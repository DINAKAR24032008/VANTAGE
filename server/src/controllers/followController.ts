import { Response } from 'express';
import { prisma } from '../services/authService';
import { ProfileController } from './profileController';
import { AuthenticatedRequest } from '../types';

export class FollowController {
  /**
   * Helper: Enforce hourly rate limit (max 60 follow/unfollow actions per hour per user)
   */
  private static async checkRateLimit(userId: string): Promise<boolean> {
    const now = new Date();
    let limitRecord = await prisma.followRateLimit.findUnique({ where: { userId } });

    if (!limitRecord) {
      await prisma.followRateLimit.create({
        data: { userId, windowStart: now, count: 1 },
      });
      return true;
    }

    const elapsed = now.getTime() - new Date(limitRecord.windowStart).getTime();
    if (elapsed > 60 * 60 * 1000) {
      // Reset window
      await prisma.followRateLimit.update({
        where: { userId },
        data: { windowStart: now, count: 1 },
      });
      return true;
    }

    if (limitRecord.count >= 60) {
      return false;
    }

    await prisma.followRateLimit.update({
      where: { userId },
      data: { count: limitRecord.count + 1 },
    });
    return true;
  }

  /**
   * POST /api/follow/:targetUserId
   * Follow a user (Instant ACCEPTED for PUBLIC, PENDING for PRIVATE)
   */
  static async followUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Session expired. Please log in again.', code: 'USER_NOT_FOUND' });
      }

      const followerId = req.user.userId;
      const targetUserId = Array.isArray(req.params.targetUserId) ? req.params.targetUserId[0] : String(req.params.targetUserId);

      if (followerId === targetUserId) {
        return res.status(400).json({ message: 'You cannot follow yourself.', code: 'SELF_FOLLOW_REJECTED' });
      }

      // 1. Resolve follower & target profile using getOrCreateUserProfile helper
      const { user: followerUser, profile: followerProfile, userNotFound: followerNotFound } =
        await ProfileController.getOrCreateUserProfile(followerId);
      const { user: targetUser, profile: targetProfile, userNotFound: targetNotFound } =
        await ProfileController.getOrCreateUserProfile(targetUserId);

      if (followerNotFound || targetNotFound || !followerUser || !targetUser || !followerProfile || !targetProfile) {
        return res.status(404).json({ message: 'User not found.', code: 'NOT_FOUND' });
      }

      // 2. Check if a block exists in EITHER direction
      const blockExists = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: followerId, blockedId: targetUserId },
            { blockerId: targetUserId, blockedId: followerId },
          ],
        },
      });

      if (blockExists) {
        return res.status(404).json({ message: 'User not found.', code: 'NOT_FOUND' });
      }

      // 3. Hourly Rate Limit Check
      const rateLimitOk = await FollowController.checkRateLimit(followerId);
      if (!rateLimitOk) {
        return res.status(429).json({
          message: 'Follow action limit reached (max 60 actions per hour). Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        });
      }

      // 4. Check existing follow status
      const existing = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId, followingId: targetUserId } },
      });

      if (existing) {
        return res.json({
          message: `Already following or requested (${existing.status})`,
          status: existing.status,
          isFollowedByMe: existing.status === 'ACCEPTED',
          isPending: existing.status === 'PENDING',
        });
      }

      // 5. Determine initial status: PUBLIC -> ACCEPTED, PRIVATE -> PENDING
      const isTargetPublic = targetProfile.accountVisibility === 'PUBLIC' || targetUser.role === 'trainer' || targetUser.role === 'admin';
      const initialStatus = isTargetPublic ? 'ACCEPTED' : 'PENDING';

      // 6. Execute atomic transaction
      const followRecord = await prisma.$transaction(async (tx) => {
        const created = await tx.follow.create({
          data: {
            followerId,
            followingId: targetUserId,
            status: initialStatus,
          },
        });

        if (initialStatus === 'ACCEPTED') {
          await tx.userProfile.update({
            where: { userId: targetUserId },
            data: { followersCount: { increment: 1 } },
          });
          await tx.userProfile.update({
            where: { userId: followerId },
            data: { followingCount: { increment: 1 } },
          });
        }

        return created;
      });

      // 7. Trigger Notification safely
      try {
        const followerUsername = followerProfile.username || followerUser.name.toLowerCase().replace(/\s+/g, '.');

        if (initialStatus === 'ACCEPTED') {
          // Deduplicate NEW_FOLLOWER within 24h
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const recentNotif = await prisma.notification.findFirst({
            where: {
              userId: targetUserId,
              type: 'NEW_FOLLOWER',
              createdAt: { gte: dayAgo },
              message: { contains: `@${followerUsername}` },
            },
          });

          if (!recentNotif) {
            await prisma.notification.create({
              data: {
                userId: targetUserId,
                type: 'NEW_FOLLOWER',
                title: '👤 New Follower',
                message: `${followerUser.name} (@${followerUsername}) started following you.`,
                actionUrl: `/u/${followerUsername}`,
              },
            });
          }
        } else {
          // Send FOLLOW_REQUEST
          await prisma.notification.create({
            data: {
              userId: targetUserId,
              type: 'FOLLOW_REQUEST',
              title: '📩 Follow Request',
              message: `${followerUser.name} (@${followerUsername}) requested to follow you.`,
              actionUrl: `/u/${followerUsername}`,
            },
          });
        }
      } catch (notifErr) {
        console.error('[Follow Notification Error]:', notifErr);
      }

      return res.status(201).json({
        message: initialStatus === 'ACCEPTED' ? 'Now following user' : 'Follow request sent',
        status: initialStatus,
        isFollowedByMe: initialStatus === 'ACCEPTED',
        isPending: initialStatus === 'PENDING',
        followRecord,
      });
    } catch (err: any) {
      console.error('[FollowUser Error]:', err);
      return res.status(500).json({ message: 'Failed to follow user', code: 'SERVER_ERROR' });
    }
  }

  /**
   * DELETE /api/follow/:targetUserId
   * Unfollow a user or cancel pending request
   */
  static async unfollowUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Session expired. Please log in again.', code: 'USER_NOT_FOUND' });
      }

      const followerId = req.user.userId;
      const targetUserId = Array.isArray(req.params.targetUserId) ? req.params.targetUserId[0] : String(req.params.targetUserId);

      const existing = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId, followingId: targetUserId } },
      });

      if (!existing) {
        return res.json({ message: 'Not following user', status: 'NONE', isFollowedByMe: false });
      }

      // Hourly Rate Limit Check
      await FollowController.checkRateLimit(followerId);

      await prisma.$transaction(async (tx) => {
        await tx.follow.delete({
          where: { id: existing.id },
        });

        if (existing.status === 'ACCEPTED') {
          const targetProf = await tx.userProfile.findUnique({ where: { userId: targetUserId } });
          const followerProf = await tx.userProfile.findUnique({ where: { userId: followerId } });

          if (targetProf && targetProf.followersCount > 0) {
            await tx.userProfile.update({
              where: { userId: targetUserId },
              data: { followersCount: { decrement: 1 } },
            });
          }
          if (followerProf && followerProf.followingCount > 0) {
            await tx.userProfile.update({
              where: { userId: followerId },
              data: { followingCount: { decrement: 1 } },
            });
          }
        }
      });

      return res.json({ message: 'Unfollowed successfully', status: 'NONE', isFollowedByMe: false });
    } catch (err: any) {
      console.error('[UnfollowUser Error]:', err);
      return res.status(500).json({ message: 'Failed to unfollow user', code: 'SERVER_ERROR' });
    }
  }

  /**
   * DELETE /api/followers/:followerUserId
   * Remove a user from my followers list
   */
  static async removeFollower(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Session expired. Please log in again.', code: 'USER_NOT_FOUND' });
      }

      const myUserId = req.user.userId;
      const followerUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : String(req.params.userId);

      const existing = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: followerUserId, followingId: myUserId } },
      });

      if (!existing) {
        return res.json({ message: 'Follower record not found' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.follow.delete({ where: { id: existing.id } });

        if (existing.status === 'ACCEPTED') {
          const myProf = await tx.userProfile.findUnique({ where: { userId: myUserId } });
          const followerProf = await tx.userProfile.findUnique({ where: { userId: followerUserId } });

          if (myProf && myProf.followersCount > 0) {
            await tx.userProfile.update({ where: { userId: myUserId }, data: { followersCount: { decrement: 1 } } });
          }
          if (followerProf && followerProf.followingCount > 0) {
            await tx.userProfile.update({ where: { userId: followerUserId }, data: { followingCount: { decrement: 1 } } });
          }
        }
      });

      return res.json({ message: 'Removed follower successfully' });
    } catch (err: any) {
      console.error('[RemoveFollower Error]:', err);
      return res.status(500).json({ message: 'Failed to remove follower', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/follow/requests
   * List incoming PENDING follow requests for current user
   */
  static async getPendingRequests(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Session expired. Please log in again.', code: 'USER_NOT_FOUND' });
      }

      const requests = await prisma.follow.findMany({
        where: { followingId: req.user.userId, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      });

      const items = await Promise.all(
        requests.map(async (r) => {
          const requesterUser = await prisma.user.findUnique({ where: { id: r.followerId } });
          const requesterProf = await prisma.userProfile.findUnique({ where: { userId: r.followerId } });
          return {
            id: r.id,
            followerId: r.followerId,
            fullName: requesterProf?.fullName || requesterUser?.name || 'Vantage Learner',
            username: requesterProf?.username || 'user',
            avatar: requesterUser?.avatar,
            role: requesterUser?.role || 'learner',
            profession: requesterProf?.profession || 'STUDENT',
            createdAt: r.createdAt,
          };
        })
      );

      return res.json({ items });
    } catch (err: any) {
      console.error('[GetPendingRequests Error]:', err);
      return res.status(500).json({ message: 'Failed to fetch follow requests', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/follow/requests/:id/accept
   * Accept incoming follow request by request ID or requester ID
   */
  static async acceptRequest(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Session expired. Please log in again.', code: 'USER_NOT_FOUND' });
      }

      const currentUserId = req.user.userId;
      const targetId = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);

      // Find by Follow ID or by followerId
      let requestRecord = await prisma.follow.findFirst({
        where: {
          OR: [
            { id: targetId, followingId: currentUserId, status: 'PENDING' },
            { followerId: targetId, followingId: currentUserId, status: 'PENDING' },
          ],
        },
      });

      if (!requestRecord) {
        return res.status(404).json({ message: 'Pending request not found', code: 'NOT_FOUND' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.follow.update({
          where: { id: requestRecord.id },
          data: { status: 'ACCEPTED' },
        });

        await tx.userProfile.update({
          where: { userId: currentUserId },
          data: { followersCount: { increment: 1 } },
        });

        await tx.userProfile.update({
          where: { userId: requestRecord.followerId },
          data: { followingCount: { increment: 1 } },
        });
      });

      // Send FOLLOW_ACCEPTED notification
      try {
        const myProf = await prisma.userProfile.findUnique({ where: { userId: currentUserId } });
        const myUser = await prisma.user.findUnique({ where: { id: currentUserId } });
        const myUsername = myProf?.username || 'user';

        await prisma.notification.create({
          data: {
            userId: requestRecord.followerId,
            type: 'FOLLOW_ACCEPTED',
            title: '✅ Follow Request Accepted',
            message: `${myProf?.fullName || myUser?.name} (@${myUsername}) accepted your follow request.`,
            actionUrl: `/u/${myUsername}`,
          },
        });
      } catch (notifErr) {
        console.error('[Accept Notification Error]:', notifErr);
      }

      return res.json({ message: 'Follow request accepted' });
    } catch (err: any) {
      console.error('[AcceptRequest Error]:', err);
      return res.status(500).json({ message: 'Failed to accept request', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/follow/requests/:id/decline
   * Decline incoming follow request
   */
  static async declineRequest(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Session expired. Please log in again.', code: 'USER_NOT_FOUND' });
      }

      const targetId = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);

      let requestRecord = await prisma.follow.findFirst({
        where: {
          OR: [
            { id: targetId, followingId: req.user.userId, status: 'PENDING' },
            { followerId: targetId, followingId: req.user.userId, status: 'PENDING' },
          ],
        },
      });

      if (!requestRecord) {
        return res.status(404).json({ message: 'Pending request not found', code: 'NOT_FOUND' });
      }

      await prisma.follow.delete({ where: { id: requestRecord.id } });

      return res.json({ message: 'Follow request declined' });
    } catch (err: any) {
      console.error('[DeclineRequest Error]:', err);
      return res.status(500).json({ message: 'Failed to decline request', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/u/:username/followers
   * List user's followers (paginated)
   */
  static async getFollowers(req: AuthenticatedRequest, res: Response) {
    try {
      const usernameParam = Array.isArray(req.params.username) ? req.params.username[0] : String(req.params.username);
      const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
      const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
      const viewerId = req.user?.userId;

      const targetProf = await prisma.userProfile.findUnique({
        where: { username: usernameParam.toLowerCase() },
      });

      if (!targetProf) {
        return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });
      }

      // Block check
      if (viewerId) {
        const blockExists = await prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: viewerId, blockedId: targetProf.userId },
              { blockerId: targetProf.userId, blockedId: viewerId },
            ],
          },
        });
        if (blockExists) {
          return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });
        }
      }

      const follows = await prisma.follow.findMany({
        where: { followingId: targetProf.userId, status: 'ACCEPTED' },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: string | null = null;
      if (follows.length > limit) {
        const nextItem = follows.pop();
        nextCursor = nextItem ? nextItem.id : null;
      }

      const items = await Promise.all(
        follows.map(async (f) => {
          const u = await prisma.user.findUnique({ where: { id: f.followerId } });
          const p = await prisma.userProfile.findUnique({ where: { userId: f.followerId } });

          let isFollowedByMe = false;
          let followsMe = false;

          if (viewerId) {
            const rel1 = await prisma.follow.findUnique({
              where: { followerId_followingId: { followerId: viewerId, followingId: f.followerId } },
            });
            isFollowedByMe = rel1?.status === 'ACCEPTED';

            const rel2 = await prisma.follow.findUnique({
              where: { followerId_followingId: { followerId: f.followerId, followingId: viewerId } },
            });
            followsMe = rel2?.status === 'ACCEPTED';
          }

          return {
            id: f.followerId,
            username: p?.username || 'user',
            fullName: p?.fullName || u?.name || 'Vantage Learner',
            avatar: u?.avatar,
            role: u?.role || 'learner',
            profession: p?.profession || 'STUDENT',
            isFollowedByMe,
            followsMe,
          };
        })
      );

      return res.json({ items, nextCursor });
    } catch (err: any) {
      console.error('[GetFollowers Error]:', err);
      return res.status(500).json({ message: 'Failed to fetch followers', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/u/:username/following
   * List users followed by username (paginated)
   */
  static async getFollowing(req: AuthenticatedRequest, res: Response) {
    try {
      const usernameParam = Array.isArray(req.params.username) ? req.params.username[0] : String(req.params.username);
      const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
      const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
      const viewerId = req.user?.userId;

      const targetProf = await prisma.userProfile.findUnique({
        where: { username: usernameParam.toLowerCase() },
      });

      if (!targetProf) {
        return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });
      }

      // Block check
      if (viewerId) {
        const blockExists = await prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: viewerId, blockedId: targetProf.userId },
              { blockerId: targetProf.userId, blockedId: viewerId },
            ],
          },
        });
        if (blockExists) {
          return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });
        }
      }

      const follows = await prisma.follow.findMany({
        where: { followerId: targetProf.userId, status: 'ACCEPTED' },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: string | null = null;
      if (follows.length > limit) {
        const nextItem = follows.pop();
        nextCursor = nextItem ? nextItem.id : null;
      }

      const items = await Promise.all(
        follows.map(async (f) => {
          const u = await prisma.user.findUnique({ where: { id: f.followingId } });
          const p = await prisma.userProfile.findUnique({ where: { userId: f.followingId } });

          let isFollowedByMe = false;
          let followsMe = false;

          if (viewerId) {
            const rel1 = await prisma.follow.findUnique({
              where: { followerId_followingId: { followerId: viewerId, followingId: f.followingId } },
            });
            isFollowedByMe = rel1?.status === 'ACCEPTED';

            const rel2 = await prisma.follow.findUnique({
              where: { followerId_followingId: { followerId: f.followingId, followingId: viewerId } },
            });
            followsMe = rel2?.status === 'ACCEPTED';
          }

          return {
            id: f.followingId,
            username: p?.username || 'user',
            fullName: p?.fullName || u?.name || 'Vantage Learner',
            avatar: u?.avatar,
            role: u?.role || 'learner',
            profession: p?.profession || 'STUDENT',
            isFollowedByMe,
            followsMe,
          };
        })
      );

      return res.json({ items, nextCursor });
    } catch (err: any) {
      console.error('[GetFollowing Error]:', err);
      return res.status(500).json({ message: 'Failed to fetch following list', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/block/:targetUserId
   * Block a user (removes follow relationship both ways in one transaction)
   */
  static async blockUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Session expired. Please log in again.', code: 'USER_NOT_FOUND' });
      }

      const blockerId = req.user.userId;
      const blockedId = Array.isArray(req.params.targetUserId) ? req.params.targetUserId[0] : String(req.params.targetUserId);

      if (blockerId === blockedId) {
        return res.status(400).json({ message: 'You cannot block yourself.', code: 'INVALID_ACTION' });
      }

      await prisma.$transaction(async (tx) => {
        // Create block
        await tx.block.upsert({
          where: { blockerId_blockedId: { blockerId, blockedId } },
          create: { blockerId, blockedId },
          update: {},
        });

        // Remove follow in direction 1 (blocker -> blocked)
        const rel1 = await tx.follow.findUnique({
          where: { followerId_followingId: { followerId: blockerId, followingId: blockedId } },
        });
        if (rel1) {
          await tx.follow.delete({ where: { id: rel1.id } });
          if (rel1.status === 'ACCEPTED') {
            const blockedProf = await tx.userProfile.findUnique({ where: { userId: blockedId } });
            const blockerProf = await tx.userProfile.findUnique({ where: { userId: blockerId } });
            if (blockedProf && blockedProf.followersCount > 0) {
              await tx.userProfile.update({ where: { userId: blockedId }, data: { followersCount: { decrement: 1 } } });
            }
            if (blockerProf && blockerProf.followingCount > 0) {
              await tx.userProfile.update({ where: { userId: blockerId }, data: { followingCount: { decrement: 1 } } });
            }
          }
        }

        // Remove follow in direction 2 (blocked -> blocker)
        const rel2 = await tx.follow.findUnique({
          where: { followerId_followingId: { followerId: blockedId, followingId: blockerId } },
        });
        if (rel2) {
          await tx.follow.delete({ where: { id: rel2.id } });
          if (rel2.status === 'ACCEPTED') {
            const blockerProf = await tx.userProfile.findUnique({ where: { userId: blockerId } });
            const blockedProf = await tx.userProfile.findUnique({ where: { userId: blockedId } });
            if (blockerProf && blockerProf.followersCount > 0) {
              await tx.userProfile.update({ where: { userId: blockerId }, data: { followersCount: { decrement: 1 } } });
            }
            if (blockedProf && blockedProf.followingCount > 0) {
              await tx.userProfile.update({ where: { userId: blockedId }, data: { followingCount: { decrement: 1 } } });
            }
          }
        }
      });

      return res.json({ message: 'User blocked successfully' });
    } catch (err: any) {
      console.error('[BlockUser Error]:', err);
      return res.status(500).json({ message: 'Failed to block user', code: 'SERVER_ERROR' });
    }
  }

  /**
   * DELETE /api/block/:targetUserId
   * Unblock a user
   */
  static async unblockUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Session expired. Please log in again.', code: 'USER_NOT_FOUND' });
      }

      const blockerId = req.user.userId;
      const blockedId = Array.isArray(req.params.targetUserId) ? req.params.targetUserId[0] : String(req.params.targetUserId);

      await prisma.block.deleteMany({
        where: { blockerId, blockedId },
      });

      return res.json({ message: 'User unblocked successfully' });
    } catch (err: any) {
      console.error('[UnblockUser Error]:', err);
      return res.status(500).json({ message: 'Failed to unblock user', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/blocks
   * List blocked users
   */
  static async getBlockedUsers(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Session expired. Please log in again.', code: 'USER_NOT_FOUND' });
      }

      const blocks = await prisma.block.findMany({
        where: { blockerId: req.user.userId },
        orderBy: { createdAt: 'desc' },
      });

      const items = await Promise.all(
        blocks.map(async (b) => {
          const u = await prisma.user.findUnique({ where: { id: b.blockedId } });
          const p = await prisma.userProfile.findUnique({ where: { userId: b.blockedId } });
          return {
            id: b.blockedId,
            username: p?.username || 'user',
            fullName: p?.fullName || u?.name || 'Vantage Learner',
            avatar: u?.avatar,
            role: u?.role || 'learner',
          };
        })
      );

      return res.json({ items });
    } catch (err: any) {
      console.error('[GetBlockedUsers Error]:', err);
      return res.status(500).json({ message: 'Failed to fetch blocked users', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/admin/recompute-follow-counts
   * Admin Endpoint: Recalculates followersCount and followingCount for all user profiles
   */
  static async recomputeFollowCounts(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required', code: 'FORBIDDEN' });
      }

      const profiles = await prisma.userProfile.findMany();
      let updatedCount = 0;

      await prisma.$transaction(async (tx) => {
        for (const prof of profiles) {
          const actualFollowers = await tx.follow.count({
            where: { followingId: prof.userId, status: 'ACCEPTED' },
          });

          const actualFollowing = await tx.follow.count({
            where: { followerId: prof.userId, status: 'ACCEPTED' },
          });

          await tx.userProfile.update({
            where: { id: prof.id },
            data: {
              followersCount: actualFollowers,
              followingCount: actualFollowing,
            },
          });
          updatedCount++;
        }
      });

      return res.json({
        message: `Successfully recomputed follow counts for ${updatedCount} profiles.`,
        profilesUpdated: updatedCount,
      });
    } catch (err: any) {
      console.error('[RecomputeFollowCounts Error]:', err);
      return res.status(500).json({ message: 'Failed to recompute follow counts', code: 'SERVER_ERROR' });
    }
  }
}
