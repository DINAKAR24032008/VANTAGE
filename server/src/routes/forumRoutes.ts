import { Router } from 'express';
import { ForumController } from '../controllers/forumController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', ForumController.getPosts);
router.get('/:id', ForumController.getPostById);
router.post('/', authenticateToken, ForumController.createPost);

export default router;
