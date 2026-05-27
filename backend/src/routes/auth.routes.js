import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

export default router;