import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { verifyRefreshToken } from '../utils/jwt';
import logger from '../config/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    storeId?: string;
    roles: string[];
    permissions: string[];
  };
}

export class AuthController {
  // Login user
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await AuthService.authenticateUser(email, password);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Login error:', error);

      if (error.message === 'Invalid credentials' || error.message.includes('locked')) {
        res.status(401).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  // Register new user
  static async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, firstName, lastName, tenantId } = req.body;

      const result = await AuthService.registerUser(
        email,
        password,
        firstName,
        lastName,
        tenantId || req.user?.tenantId
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully',
      });
    } catch (error: any) {
      logger.error('Registration error:', error);

      if (error.message === 'User with this email already exists') {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  // Refresh access token
  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
        return;
      }

      // For now, implement basic refresh token logic
      // In production, you'd store refresh tokens in database/redis
      const decoded = verifyRefreshToken(refreshToken);

      // Get user profile to generate new tokens
      const userProfile = await AuthService.getUserProfile(decoded.id);

      // Generate new tokens using the same logic as login
      const { generateToken, generateRefreshToken } = await import('../utils/jwt');

      const tokenPayload = {
        id: userProfile.id,
        email: userProfile.email,
        tenantId: userProfile.tenant?.id,
        storeId: userProfile.defaultStore?.id,
        roles: userProfile.roles,
        permissions: userProfile.permissions,
      };

      const accessToken = generateToken(tokenPayload);
      const newRefreshToken = generateRefreshToken({ id: userProfile.id });

      logger.info(`Token refreshed for user: ${userProfile.email}`, {
        userId: userProfile.id,
      });

      res.json({
        success: true,
        data: {
          tokens: {
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
          },
        },
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }
  }

  // Logout user (client-side token removal, but we can log the event)
  static async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (userId) {
        logger.info(`User logged out`, { userId });
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      logger.error('Logout error:', error);
      next(error);
    }
  }

  // Get current user profile
  static async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const userProfile = await AuthService.getUserProfile(userId);

      res.json({
        success: true,
        data: {
          user: userProfile,
        },
      });
    } catch (error: any) {
      logger.error('Get profile error:', error);

      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }
}