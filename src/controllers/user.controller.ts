import { Request, Response, NextFunction } from 'express';
import { UserService, CreateUserData, UpdateUserData } from '../services/user.service';
import { AuthRequest } from './auth.controller';
import logger from '../config/logger';

export class UserController {
  /**
   * Get all users for the tenant
   */
  static async getAllUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const users = await UserService.getAllUsers(tenantId);

      res.json({
        success: true,
        data: users,
      });
    } catch (error: any) {
      logger.error('Get all users error:', error);

      if (error.message === 'Tenant not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
        return;
      }

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const user = await UserService.getUserById(id, tenantId);

      res.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      logger.error('Get user by ID error:', error);

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

  /**
   * Create a new user
   */
  static async createUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const userData: CreateUserData = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        avatar: req.body.avatar,
        defaultStoreId: req.body.defaultStoreId,
        roleIds: req.body.roleIds,
      };

      const user = await UserService.createUser(tenantId, userData);

      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully',
      });
    } catch (error: any) {
      logger.error('Create user error:', error);

      if (error.message === 'User with this email already exists') {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('not found') || error.message.includes('does not belong')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Update user
   */
  static async updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
        return;
      }

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const updateData: UpdateUserData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        avatar: req.body.avatar,
        defaultStoreId: req.body.defaultStoreId,
        isActive: req.body.isActive,
        roleIds: req.body.roleIds,
      };

      const user = await UserService.updateUser(id, tenantId, updateData);

      res.json({
        success: true,
        data: user,
        message: 'User updated successfully',
      });
    } catch (error: any) {
      logger.error('Update user error:', error);

      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('not found') || error.message.includes('does not belong')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
        return;
      }

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      await UserService.deleteUser(id, tenantId);

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete user error:', error);

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

  /**
   * Change user password
   */
  static async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      const { currentPassword, newPassword } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
        return;
      }

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      // Users can only change their own password, or superadmin can change any
      const isSuperAdmin = req.user?.roles.includes('Super Admin');
      const isOwnPassword = req.user?.id === id;

      if (!isSuperAdmin && !isOwnPassword) {
        res.status(403).json({
          success: false,
          error: 'You can only change your own password',
        });
        return;
      }

      await UserService.changePassword(id, tenantId, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      logger.error('Change password error:', error);

      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Current password is incorrect') {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Reset user password (admin only)
   */
  static async resetPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      const { newPassword } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
        return;
      }

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      await UserService.resetPassword(id, tenantId, newPassword);

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error: any) {
      logger.error('Reset password error:', error);

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

  /**
   * Get user statistics
   */
  static async getUserStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const stats = await UserService.getUserStats(tenantId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get user stats error:', error);
      next(error);
    }
  }

  /**
   * Check if email is available
   */
  static async checkEmailAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.params;
      const { excludeUserId } = req.query;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required',
        });
        return;
      }

      const available = await UserService.isEmailAvailable(email, excludeUserId as string);

      res.json({
        success: true,
        data: {
          email,
          available,
        },
      });
    } catch (error: any) {
      logger.error('Check email availability error:', error);
      next(error);
    }
  }
}