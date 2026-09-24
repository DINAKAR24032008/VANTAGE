import { Router } from 'express';
import { FollowController } from '../controllers/followController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Follow & Unfollow Actions
router.post('/follow/:targetUserId', authenticateToken, FollowController.followUser);
router.delete('/follow/:targetUserId', authenticateToken, FollowController.unfollowUser);
router.delete('/followers/:userId', authenticateToken, FollowController.removeFollower);

// Pending Requests
router.get('/follow/requests', authenticateToken, FollowController.getPendingRequests);
router.post('/follow/requests/:id/accept', authenticateToken, FollowController.acceptRequest);
router.post('/follow/requests/:id/decline', authenticateToken, FollowController.declineRequest);

// Follower / Following Lists
router.get('/u/:username/followers', FollowController.getFollowers);
router.get('/u/:username/following', FollowController.getFollowing);

// Block Actions
router.post('/block/:targetUserId', authenticateToken, FollowController.blockUser);
router.delete('/block/:targetUserId', authenticateToken, FollowController.unblockUser);
router.get('/blocks', authenticateToken, FollowController.getBlockedUsers);

// Admin Recompute Counter
router.post('/admin/recompute-follow-counts', authenticateToken, FollowController.recomputeFollowCounts);

export default router;
