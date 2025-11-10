import { Router } from 'express';
import { PermissionController } from '../controllers/permission.controller';
import { authenticateToken, requireTenantAccess, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// All permission routes require authentication and tenant access
router.use(authenticateToken);
router.use(requireTenantAccess);

// GET /api/v1/permissions - Get all permissions for tenant
router.get('/', requirePermission('role:read'), PermissionController.getAllPermissions);

// GET /api/v1/permissions/stats - Get permission statistics
router.get('/stats', requirePermission('role:read'), PermissionController.getPermissionStats);

// GET /api/v1/permissions/check-name/:name - Check permission name availability
router.get('/check-name/:name', PermissionController.checkPermissionNameAvailability);

// GET /api/v1/permissions/check-resource-action/:resource/:action - Check resource:action availability
router.get('/check-resource-action/:resource/:action', PermissionController.checkResourceActionAvailability);

// GET /api/v1/permissions/resource/:resource - Get permissions by resource
router.get('/resource/:resource', requirePermission('role:read'), PermissionController.getPermissionsByResource);

// GET /api/v1/permissions/:id - Get permission by ID
router.get('/:id', requirePermission('role:read'), PermissionController.getPermissionById);

// POST /api/v1/permissions - Create new permission
router.post('/', requirePermission('role:create'), PermissionController.createPermission);

// PUT /api/v1/permissions/:id - Update permission
router.put('/:id', requirePermission('role:update'), PermissionController.updatePermission);

// DELETE /api/v1/permissions/:id - Delete permission
router.delete('/:id', requirePermission('role:delete'), PermissionController.deletePermission);

export default router;