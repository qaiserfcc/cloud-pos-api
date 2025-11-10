import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { authenticateToken, requireTenantAccess, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// All role routes require authentication and tenant access
router.use(authenticateToken);
router.use(requireTenantAccess);

// GET /api/v1/roles - Get all roles for tenant
router.get('/', requirePermission('role:read'), RoleController.getAllRoles);

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

export default router;