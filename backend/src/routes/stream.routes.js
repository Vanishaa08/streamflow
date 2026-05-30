import { Router } from 'express';
import { authenticateStream, streamDone } from '../controllers/stream.controller.js';

const router = Router();

// Called by Nginx RTMP on_publish — verify stream key
router.post('/authenticate', authenticateStream);

// Called by Nginx RTMP on_publish_done — mark stream as offline
router.post('/done', streamDone);

export default router;