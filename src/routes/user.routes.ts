import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken, requireTenantAccess, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// All user routes require authentication and tenant access
router.use(authenticateToken);
router.use(requireTenantAccess);

// GET /api/v1/users - Get all users for tenant
router.get('/', requirePermission('user:read'), UserController.getAllUsers);

// GET /api/v1/users/stats - Get user statistics
router.get('/stats', requirePermission('user:read'), UserController.getUserStats);

// GET /api/v1/users/check-email/:email - Check email availability
router.get('/check-email/:email', UserController.checkEmailAvailability);

// GET /api/v1/users/:id - Get user by ID
router.get('/:id', requirePermission('user:read'), UserController.getUserById);

// POST /api/v1/users - Create new user
router.post('/', requirePermission('user:create'), UserController.createUser);

// PUT /api/v1/users/:id - Update user
router.put('/:id', requirePermission('user:update'), UserController.updateUser);

// DELETE /api/v1/users/:id - Delete user
router.delete('/:id', requirePermission('user:delete'), UserController.deleteUser);

// PUT /api/v1/users/:id/change-password - Change user password
router.put('/:id/change-password', UserController.changePassword);

// PUT /api/v1/users/:id/reset-password - Reset user password (admin only)
router.put('/:id/reset-password', requirePermission('user:update'), UserController.resetPassword);

export default router;