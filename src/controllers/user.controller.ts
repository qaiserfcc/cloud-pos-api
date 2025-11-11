import { Request, Response, NextFunction } from 'express';
import { UserService, CreateUserData, UpdateUserData } from '../services/user.service';
import { AuthRequest } from './auth.controller';
import logger from '../config/logger';

export class UserController {
  /**
   * @swagger
   * /users:
   *   get:
   *     summary: Get all users for the tenant
   *     description: Retrieve a list of all users belonging to the authenticated user's tenant
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/UserWithAssociations'
   *       400:
   *         description: Tenant ID is required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Tenant not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   * @swagger
   * /users/{id}:
   *   get:
   *     summary: Get user by ID
   *     description: Retrieve a specific user by their ID within the tenant
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: User ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     responses:
   *       200:
   *         description: User retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/UserWithAssociations'
   *       400:
   *         description: User ID or Tenant ID is required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   * @swagger
   * /users:
   *   post:
   *     summary: Create a new user
   *     description: Create a new user account within the tenant with specified roles and details
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateUserData'
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/UserWithAssociations'
   *                 message:
   *                   type: string
   *                   example: "User created successfully"
   *       400:
   *         description: Tenant ID is required or invalid data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       409:
   *         description: User with this email already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   * @swagger
   * /users/{id}:
   *   put:
   *     summary: Update user
   *     description: Update an existing user's information within the tenant
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: User ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateUserData'
   *     responses:
   *       200:
   *         description: User updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/UserWithAssociations'
   *                 message:
   *                   type: string
   *                   example: "User updated successfully"
   *       400:
   *         description: User ID, Tenant ID is required or invalid data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   * @swagger
   * /users/{id}:
   *   delete:
   *     summary: Delete user
   *     description: Delete a user account within the tenant
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: User ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     responses:
   *       200:
   *         description: User deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "User deleted successfully"
   *       400:
   *         description: User ID or Tenant ID is required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   * @swagger
   * /users/{id}/change-password:
   *   put:
   *     summary: Change user password
   *     description: Change the password for a user (users can only change their own password, or superadmin can change any)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: User ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *                 description: Current password
   *                 example: "currentPassword123"
   *               newPassword:
   *                 type: string
   *                 description: New password
   *                 example: "newPassword456"
   *     responses:
   *       200:
   *         description: Password changed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Password changed successfully"
   *       400:
   *         description: User ID, Tenant ID is required or current password is incorrect
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - can only change own password
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   * @swagger
   * /users/{id}/reset-password:
   *   put:
   *     summary: Reset user password (admin only)
   *     description: Reset the password for a user (admin only operation)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: User ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - newPassword
   *             properties:
   *               newPassword:
   *                 type: string
   *                 description: New password
   *                 example: "newPassword456"
   *     responses:
   *       200:
   *         description: Password reset successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Password reset successfully"
   *       400:
   *         description: User ID or Tenant ID is required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   * @swagger
   * /users/stats:
   *   get:
   *     summary: Get user statistics
   *     description: Retrieve statistics about users within the tenant
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalUsers:
   *                       type: integer
   *                       example: 25
   *                     activeUsers:
   *                       type: integer
   *                       example: 22
   *                     inactiveUsers:
   *                       type: integer
   *                       example: 3
   *       400:
   *         description: Tenant ID is required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   * @swagger
   * /users/check-email/{email}:
   *   get:
   *     summary: Check if email is available
   *     description: Check if an email address is available for registration
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: email
   *         required: true
   *         schema:
   *           type: string
   *           format: email
   *         description: Email address to check
   *         example: "user@example.com"
   *       - in: query
   *         name: excludeUserId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: User ID to exclude from the check (useful for updates)
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     responses:
   *       200:
   *         description: Email availability checked successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     email:
   *                       type: string
   *                       format: email
   *                       example: "user@example.com"
   *                     available:
   *                       type: boolean
   *                       example: true
   *       400:
   *         description: Email is required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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

  /**
   * @swagger
   * /users/{userId}/roles:
   *   get:
   *     summary: Get all roles assigned to a user
   *     description: Retrieve all roles assigned to a specific user within the tenant
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: User ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     responses:
   *       200:
   *         description: User roles retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         format: uuid
   *                         example: "123e4567-e89b-12d3-a456-426614174000"
   *                       name:
   *                         type: string
   *                         example: "Store Manager"
   *                       description:
   *                         type: string
   *                         example: "Can manage store operations"
   *       400:
   *         description: User ID or Tenant ID is required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async getUserRoles(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!userId) {
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

      const roles = await UserService.getUserRoles(userId, tenantId);

      res.json({
        success: true,
        data: roles,
      });
    } catch (error: any) {
      logger.error('Get user roles error:', error);

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
   * @swagger
   * /users/{userId}/roles:
   *   post:
   *     summary: Assign roles to a user
   *     description: Assign one or more roles to a specific user within the tenant
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: User ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - roleIds
   *             properties:
   *               roleIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: uuid
   *                 description: Array of role IDs to assign
   *                 example: ["123e4567-e89b-12d3-a456-426614174000", "456e7890-e89b-12d3-a456-426614174001"]
   *     responses:
   *       200:
   *         description: Roles assigned to user successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Roles assigned to user successfully"
   *       400:
   *         description: User ID, Tenant ID is required or invalid role data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async assignRolesToUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const tenantId = req.user?.tenantId;
      const { roleIds } = req.body;

      if (!userId) {
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

      if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Role IDs array is required and cannot be empty',
        });
        return;
      }

      await UserService.assignRolesToUser(userId, tenantId, roleIds);

      res.json({
        success: true,
        message: 'Roles assigned to user successfully',
      });
    } catch (error: any) {
      logger.error('Assign roles to user error:', error);

      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('not found') || error.message.includes('do not belong') || error.message.includes('already assigned')) {
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
   * @swagger
   * /users/{userId}/roles/{roleId}:
   *   delete:
   *     summary: Remove a role from a user
   *     description: Remove a specific role assignment from a user within the tenant
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: User ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *       - in: path
   *         name: roleId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Role ID to remove
   *         example: "456e7890-e89b-12d3-a456-426614174001"
   *     responses:
   *       200:
   *         description: Role removed from user successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Role removed from user successfully"
   *       400:
   *         description: User ID, Role ID, or Tenant ID is required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async removeRoleFromUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, roleId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
        return;
      }

      if (!roleId) {
        res.status(400).json({
          success: false,
          error: 'Role ID is required',
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

      await UserService.removeRoleFromUser(userId, tenantId, roleId);

      res.json({
        success: true,
        message: 'Role removed from user successfully',
      });
    } catch (error: any) {
      logger.error('Remove role from user error:', error);

      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('not found') || error.message.includes('does not belong') || error.message.includes('does not have')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }
}