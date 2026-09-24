import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PeopleController } from '../controllers/peopleController';

const router = Router();

router.get('/search', authenticateToken, PeopleController.search);
router.get('/suggestions', authenticateToken, PeopleController.suggestions);

export default router;
