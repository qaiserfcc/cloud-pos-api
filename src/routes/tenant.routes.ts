import { Router } from 'express';
import { TenantController } from '../controllers/tenant.controller';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route GET /api/v1/tenants
 * @desc Get all tenants (Superadmin only)
 * @access Private - Superadmin
 */
router.get(
  '/',
  authenticateToken,
  requirePermission('tenant:read'),
  TenantController.getAllTenants
);

/**
 * @route GET /api/v1/tenants/:id
 * @desc Get tenant by ID
 * @access Private - Superadmin or Tenant Admin
 */
router.get(
  '/:id',
  authenticateToken,
  requirePermission('tenant:read'),
  TenantController.getTenantById
);

/**
 * @route POST /api/v1/tenants
 * @desc Create new tenant (Superadmin only)
 * @access Private - Superadmin
 */
router.post(
  '/',
  authenticateToken,
  requirePermission('tenant:create'),
  TenantController.createTenant
);

/**
 * @route PUT /api/v1/tenants/:id
 * @desc Update tenant (Superadmin only)
 * @access Private - Superadmin
 */
router.put(
  '/:id',
  authenticateToken,
  requirePermission('tenant:update'),
  TenantController.updateTenant
);

/**
 * @route DELETE /api/v1/tenants/:id
 * @desc Delete tenant (Superadmin only)
 * @access Private - Superadmin
 */
router.delete(
  '/:id',
  authenticateToken,
  requirePermission('tenant:delete'),
  TenantController.deleteTenant
);

/**
 * @route GET /api/v1/tenants/:id/stats
 * @desc Get tenant statistics
 * @access Private - Superadmin or Tenant Admin
 */
router.get(
  '/:id/stats',
  authenticateToken,
  requirePermission('tenant:read'),
  TenantController.getTenantStats
);

/**
 * @route GET /api/v1/tenants/check-domain/:domain
 * @desc Check if domain is available
 * @access Private - Superadmin
 */
router.get(
  '/check-domain/:domain',
  authenticateToken,
  requirePermission('tenant:read'),
  TenantController.checkDomainAvailability
);

export default router;