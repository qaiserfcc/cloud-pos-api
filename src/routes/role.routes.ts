import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { authenticateToken, requireTenantAccess, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// Public route for registration - no auth required
// GET /api/v1/roles - Get all roles (public for registration)
router.get('/', RoleController.getAllRoles);

// All other role routes require authentication and tenant access
router.use(authenticateToken);
router.use(requireTenantAccess);

// GET /api/v1/roles/stats - Get role statistics
router.get('/stats', requirePermission('role:read'), RoleController.getRoleStats);

// GET /api/v1/roles/check-name/:name - Check role name availability
router.get('/check-name/:name', RoleController.checkRoleNameAvailability);

// GET /api/v1/roles/:id - Get role by ID
router.get('/:id', requirePermission('role:read'), RoleController.getRoleById);

// POST /api/v1/roles - Create new role
router.post('/', requirePermission('role:create'), RoleController.createRole);

// PUT /api/v1/roles/:id - Update role
router.put('/:id', requirePermission('role:update'), RoleController.updateRole);

// DELETE /api/v1/roles/:id - Delete role
router.delete('/:id', requirePermission('role:delete'), RoleController.deleteRole);

// GET /api/v1/roles/:roleId/permissions - Get permissions for a role
router.get('/:roleId/permissions', requirePermission('role:read'), RoleController.getRolePermissions);

// POST /api/v1/roles/:roleId/permissions - Assign permissions to a role
router.post('/:roleId/permissions', requirePermission('role:update'), RoleController.assignPermissionsToRole);

// DELETE /api/v1/roles/:roleId/permissions/:permissionId - Remove permission from a role
router.delete('/:roleId/permissions/:permissionId', requirePermission('role:update'), RoleController.removePermissionFromRole);

export default router;