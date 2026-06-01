import { Router } from 'express';
import { authenticateStream, streamDone, getAnalytics } from '../controllers/stream.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/authenticate', authenticateStream);
router.post('/done', streamDone);
router.get('/analytics', protect, getAnalytics);

export default router;