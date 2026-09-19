import { Router } from 'express';
import { ForumController } from '../controllers/forumController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', ForumController.getPosts);
router.get('/:id', ForumController.getPostById);
router.post('/', authenticateToken, ForumController.createPost);
router.put('/posts/:id/pin', authenticateToken, ForumController.togglePinPost);
router.put('/posts/:id', authenticateToken, ForumController.updatePost);
router.delete('/posts/:id', authenticateToken, ForumController.deletePost);

export default router;
