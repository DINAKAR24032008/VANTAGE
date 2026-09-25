import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../services/authService';

/**
 * Controller for Search People & Suggestions endpoints
 */
export class PeopleController {
  /**
   * Helper: Check and increment persistent search rate limit (30 per minute)
   * Stored in SearchRateLimit table in DB to survive server restarts.
   */
  private static async checkRateLimit(userId: string): Promise<boolean> {
    const NOW = new Date();
    const WINDOW_MS = 60 * 1000; // 1 minute

    let record = await prisma.searchRateLimit.findUnique({
      where: { userId },
    });

    if (!record) {
      await prisma.searchRateLimit.create({
        data: { userId, windowStart: NOW, count: 1 },
      });
      return true;
    }

    const elapsed = NOW.getTime() - new Date(record.windowStart).getTime();

    if (elapsed > WINDOW_MS) {
      // Window expired, reset counter
      await prisma.searchRateLimit.update({
        where: { userId },
        data: { windowStart: NOW, count: 1 },
      });
      return true;
    }

    if (record.count >= 30) {
      return false; // Rate limit exceeded
    }

    // Increment count within active window
    await prisma.searchRateLimit.update({
      where: { userId },
      data: { count: { increment: 1 } },
    });

    return true;
  }

  /**
   * Helper: Sanitize query string
   * Trim, max 100 chars, strip characters that aren't letters, numbers, spaces, @, ., _, -
   */
  private static sanitizeQuery(rawQuery: string | undefined): string {
    if (!rawQuery) return '';
    let text = rawQuery.trim().slice(0, 100);
    // Strip invalid characters
    text = text.replace(/[^a-zA-Z0-9\s@._-]/g, '');
    return text.trim();
  }

  /**
   * GET /api/people/search
   */
  static async search(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required', code: 'UNAUTHORIZED' });
      }

      const currentUserId = req.user.userId;

      // Rate limit check
      const allowed = await PeopleController.checkRateLimit(currentUserId);
      if (!allowed) {
        return res.status(429).json({
          message: 'Rate limit exceeded. Maximum 30 search requests per minute.',
          code: 'RATE_LIMIT_EXCEEDED',
        });
      }

      const rawQ = req.query.q ? String(req.query.q) : '';
      const q = PeopleController.sanitizeQuery(rawQ);
      const roleFilter = req.query.role ? String(req.query.role).toLowerCase() : undefined;
      const professionFilter = req.query.profession ? String(req.query.profession) : undefined;
      const countryFilter = req.query.country ? String(req.query.country) : undefined;

      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 20);
      const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

      // 1. Fetch blocked user IDs (both directions)
      const blocks = await prisma.block.findMany({
        where: {
          OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }],
        },
      });

      const blockedUserIds = new Set<string>();
      blocks.forEach((b) => {
        if (b.blockerId === currentUserId) blockedUserIds.add(b.blockedId);
        if (b.blockedId === currentUserId) blockedUserIds.add(b.blockerId);
      });

      // Exclude self and blocked users
      const excludedUserIds = [currentUserId, ...Array.from(blockedUserIds)];

      // Build Prisma WHERE condition
      const whereCondition: any = {
        id: { notIn: excludedUserIds },
      };

      if (roleFilter && ['learner', 'trainer', 'admin'].includes(roleFilter)) {
        whereCondition.role = roleFilter;
      }

      const profileWhere: any = {};

      if (professionFilter && professionFilter !== 'ALL') {
        profileWhere.profession = professionFilter;
      }

      if (countryFilter && countryFilter !== 'ALL') {
        profileWhere.country = countryFilter;
      }

      // Matching text search
      if (q) {
        const searchTerms = q.split(/\s+/).filter(Boolean);
        const orConditions: any[] = [];

        searchTerms.forEach((term) => {
          const cleanTerm = term.replace(/^@/, ''); // handle @username search
          orConditions.push(
            { name: { contains: term } },
            { userProfile: { fullName: { contains: term } } },
            { userProfile: { username: { contains: cleanTerm } } },
            { userProfile: { bio: { contains: term } } },
            { userProfile: { jobTitle: { contains: term } } },
            { userProfile: { profession: { contains: term } } }
          );
        });

        whereCondition.OR = orConditions;
      }

      if (Object.keys(profileWhere).length > 0) {
        whereCondition.userProfile = {
          ...whereCondition.userProfile,
          ...profileWhere,
        };
      }

      // Execute query with cursor pagination
      const findArgs: any = {
        where: whereCondition,
        take: limit + 1, // +1 for nextCursor check
        orderBy: { createdAt: 'desc' },
        include: {
          userProfile: true,
        },
      };

      if (cursor) {
        findArgs.cursor = { id: cursor };
        findArgs.skip = 1;
      }

      const users = await prisma.user.findMany(findArgs);

      let nextCursor: string | null = null;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem?.id || null;
      }

      const candidateUserIds = users.map((u) => u.id);

      // 2. Batched Connection Lookup (NO N+1)
      const myFollowRows = await prisma.follow.findMany({
        where: {
          OR: [
            { followerId: currentUserId, followingId: { in: candidateUserIds } },
            { followingId: currentUserId, followerId: { in: candidateUserIds } },
          ],
        },
      });

      const followingMap = new Map<string, string>(); // targetId -> status (ACCEPTED / PENDING)
      const followsMeSet = new Set<string>(); // set of targetIds who follow current user

      myFollowRows.forEach((row) => {
        if (row.followerId === currentUserId) {
          followingMap.set(row.followingId, row.status);
        }
        if (row.followingId === currentUserId && row.status === 'ACCEPTED') {
          followsMeSet.add(row.followerId);
        }
      });

      // 3. Batched Mutual Followers Calculation
      const myFollowingList = await prisma.follow.findMany({
        where: { followerId: currentUserId, status: 'ACCEPTED' },
        select: { followingId: true },
      });
      const myFollowingIds = myFollowingList.map((f) => f.followingId);

      const mutualCountsMap = new Map<string, number>();
      if (myFollowingIds.length > 0 && candidateUserIds.length > 0) {
        const mutualRows = await prisma.follow.findMany({
          where: {
            followingId: { in: candidateUserIds },
            followerId: { in: myFollowingIds },
            status: 'ACCEPTED',
          },
          select: { followingId: true },
        });

        mutualRows.forEach((m) => {
          const current = mutualCountsMap.get(m.followingId) || 0;
          mutualCountsMap.set(m.followingId, current + 1);
        });
      }

      // Format results
      const results = users.map((u: any) => {
        const prof = u.userProfile;
        const followStatus = followingMap.get(u.id) || 'NONE'; // NONE, PENDING, ACCEPTED
        const followsMe = followsMeSet.has(u.id);

        let avatarParsed: any = null;
        try {
          avatarParsed = typeof u.avatar === 'string' ? JSON.parse(u.avatar) : u.avatar;
        } catch {
          avatarParsed = { type: 'initials', bgColor: '#163016' };
        }

        return {
          id: u.id,
          userId: u.id,
          username: prof?.username || null,
          fullName: prof?.fullName || u.name,
          avatar: avatarParsed,
          role: u.role,
          profession: prof?.profession || 'STUDENT',
          jobTitle: prof?.jobTitle || u.jobRole || null,
          country: prof?.country || 'India',
          city: prof?.city || null,
          accountVisibility: prof?.accountVisibility || 'PUBLIC',
          followStatus,
          isFollowedByMe: followStatus === 'ACCEPTED',
          isPending: followStatus === 'PENDING',
          followsMe,
          mutualFollowersCount: mutualCountsMap.get(u.id) || 0,
        };
      });

      return res.json({
        items: results,
        nextCursor,
        total: results.length,
      });
    } catch (err: any) {
      console.error('[People Search Error]:', err);
      return res.status(500).json({ message: 'Failed to search people', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/people/suggestions
   * Returns up to 12 suggested users to connect with
   */
  static async suggestions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required', code: 'UNAUTHORIZED' });
      }

      const currentUserId = req.user.userId;

      // 1. Excluded Users: Self + Blocked + Already Followed (ACCEPTED or PENDING)
      const blocks = await prisma.block.findMany({
        where: {
          OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }],
        },
      });

      const blockedUserIds = new Set<string>();
      blocks.forEach((b) => {
        if (b.blockerId === currentUserId) blockedUserIds.add(b.blockedId);
        if (b.blockedId === currentUserId) blockedUserIds.add(b.blockerId);
      });

      const myFollows = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });
      const followedUserIds = myFollows.map((f) => f.followingId);

      const excludedUserIds = Array.from(
        new Set([currentUserId, ...Array.from(blockedUserIds), ...followedUserIds])
      );

      // 2. Fetch User Info for signals
      const myProfile = await prisma.userProfile.findUnique({
        where: { userId: currentUserId },
      });

      const myEnrollments = await prisma.enrollment.findMany({
        where: { userId: currentUserId },
        select: { courseId: true },
      });
      const myCourseIds = myEnrollments.map((e) => e.courseId);

      // 3. Find candidate suggestions based on signals
      const suggestionsMap = new Map<string, { user: any; score: number; reason: string }>();

      // Signal A: Trainers of enrolled courses
      if (myCourseIds.length > 0) {
        const enrolledCourses = await prisma.course.findMany({
          where: { id: { in: myCourseIds } },
          select: { trainerId: true, title: true },
        });

        const trainerIds = enrolledCourses
          .map((c) => c.trainerId)
          .filter((id) => !excludedUserIds.includes(id));

        if (trainerIds.length > 0) {
          const trainers = await prisma.user.findMany({
            where: { id: { in: trainerIds } },
            include: { userProfile: true },
          });

          trainers.forEach((t) => {
            suggestionsMap.set(t.id, {
              user: t,
              score: 100,
              reason: 'Instructor of your enrolled course',
            });
          });
        }
      }

      // Signal B: Same profession or same country
      if (myProfile?.profession || myProfile?.country) {
        const sameFieldsUsers = await prisma.user.findMany({
          where: {
            id: { notIn: excludedUserIds },
            userProfile: {
              OR: [
                { profession: myProfile.profession || 'STUDENT' },
                { country: myProfile.country || 'India' },
              ],
            },
          },
          take: 20,
          include: { userProfile: true },
        });

        sameFieldsUsers.forEach((u: any) => {
          if (!suggestionsMap.has(u.id)) {
            const sameProf = u.userProfile?.profession === myProfile.profession;
            suggestionsMap.set(u.id, {
              user: u,
              score: sameProf ? 80 : 60,
              reason: sameProf ? `Also a ${u.userProfile?.profession || 'learner'}` : `Located in ${u.userProfile?.country}`,
            });
          }
        });
      }

      // Signal C: Fallback to newest profiles if fewer than 12
      if (suggestionsMap.size < 12) {
        const existingIds = Array.from(suggestionsMap.keys());
        const fallbackUsers = await prisma.user.findMany({
          where: {
            id: { notIn: [...excludedUserIds, ...existingIds] },
          },
          take: 12 - suggestionsMap.size,
          orderBy: { createdAt: 'desc' },
          include: { userProfile: true },
        });

        fallbackUsers.forEach((u: any) => {
          suggestionsMap.set(u.id, {
            user: u,
            score: 10,
            reason: 'Active Vantage member',
          });
        });
      }

      // Pick top 12 candidates
      const sortedCandidates = Array.from(suggestionsMap.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);

      const candidateUserIds = sortedCandidates.map((c) => c.user.id);

      // Batched check if targets follow requester (followsMe)
      const followsMeRows = await prisma.follow.findMany({
        where: {
          followerId: { in: candidateUserIds },
          followingId: currentUserId,
          status: 'ACCEPTED',
        },
        select: { followerId: true },
      });
      const followsMeSet = new Set(followsMeRows.map((r) => r.followerId));

      // Batched mutual count
      const myFollowingList = await prisma.follow.findMany({
        where: { followerId: currentUserId, status: 'ACCEPTED' },
        select: { followingId: true },
      });
      const myFollowingIds = myFollowingList.map((f) => f.followingId);

      const mutualCountsMap = new Map<string, number>();
      if (myFollowingIds.length > 0 && candidateUserIds.length > 0) {
        const mutualRows = await prisma.follow.findMany({
          where: {
            followingId: { in: candidateUserIds },
            followerId: { in: myFollowingIds },
            status: 'ACCEPTED',
          },
          select: { followingId: true },
        });

        mutualRows.forEach((m) => {
          const count = mutualCountsMap.get(m.followingId) || 0;
          mutualCountsMap.set(m.followingId, count + 1);
        });
      }

      // Format response
      const items = sortedCandidates.map(({ user: u, reason }) => {
        const prof = u.userProfile;
        let avatarParsed: any = null;
        try {
          avatarParsed = typeof u.avatar === 'string' ? JSON.parse(u.avatar) : u.avatar;
        } catch {
          avatarParsed = { type: 'initials', bgColor: '#163016' };
        }

        return {
          id: u.id,
          userId: u.id,
          username: prof?.username || null,
          fullName: prof?.fullName || u.name,
          avatar: avatarParsed,
          role: u.role,
          profession: prof?.profession || 'STUDENT',
          jobTitle: prof?.jobTitle || u.jobRole || null,
          country: prof?.country || 'India',
          city: prof?.city || null,
          accountVisibility: prof?.accountVisibility || 'PUBLIC',
          followStatus: 'NONE',
          isFollowedByMe: false,
          isPending: false,
          followsMe: followsMeSet.has(u.id),
          mutualFollowersCount: mutualCountsMap.get(u.id) || 0,
          suggestionReason: reason,
        };
      });

      return res.json({ items });
    } catch (err: any) {
      console.error('[People Suggestions Error]:', err);
      return res.status(500).json({ message: 'Failed to fetch suggestions', code: 'SERVER_ERROR' });
    }
  }
}
