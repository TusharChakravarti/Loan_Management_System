import { Router } from 'express';
import {
  register,
  login,
  getMe,
  logout,
  googleAuthInit,
  googleCallback,
  setGoogleToken,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);
router.post('/auth/logout', logout);

// Google OAuth & Password Reset routes
router.get(`/auth/google`, googleAuthInit);
router.get(`/auth/google/callback`, googleCallback);
router.post(`/auth/google/token`, setGoogleToken);
router.post(`/auth/forgot-password`, forgotPassword);
router.post(`/auth/reset-password`, resetPassword);

export default router;
