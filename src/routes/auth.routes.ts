import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import {
  validateLogin,
  validateRegister,
  validateRefreshToken,
  handleValidationErrors,
} from '../utils/validation';

const router = Router();

// POST /api/v1/auth/login
router.post(
  '/login',
  validateLogin,
  handleValidationErrors,
  AuthController.login
);

// POST /api/v1/auth/register
router.post(
  '/register',
  validateRegister,
  handleValidationErrors,
  AuthController.register
);

// POST /api/v1/auth/refresh
router.post(
  '/refresh',
  validateRefreshToken,
  handleValidationErrors,
  AuthController.refreshToken
);

// POST /api/v1/auth/logout
router.post(
  '/logout',
  authenticateToken,
  AuthController.logout
);

// GET /api/v1/auth/profile
router.get(
  '/profile',
  authenticateToken,
  AuthController.getProfile
);

export default router;