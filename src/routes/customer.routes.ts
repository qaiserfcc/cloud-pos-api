import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticateToken, requireTenantAccess, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// All customer routes require authentication and tenant access
router.use(authenticateToken);
router.use(requireTenantAccess);

// GET /api/v1/customers - Get customers with pagination and filters
router.get('/', requirePermission('customer:read'), CustomerController.getCustomers);

// GET /api/v1/customers/stats - Get customer statistics
router.get('/stats', requirePermission('customer:read'), CustomerController.getCustomerStats);

// GET /api/v1/customers/search - Search customers
router.get('/search', requirePermission('customer:read'), CustomerController.searchCustomers);

// GET /api/v1/customers/:id - Get customer by ID
router.get('/:id', requirePermission('customer:read'), CustomerController.getCustomerById);

// POST /api/v1/customers - Create new customer
router.post('/', requirePermission('customer:create'), CustomerController.createCustomer);

// PUT /api/v1/customers/:id - Update customer
router.put('/:id', requirePermission('customer:update'), CustomerController.updateCustomer);

// POST /api/v1/customers/:id/add-points - Add loyalty points
router.post('/:id/add-points', requirePermission('customer:update'), CustomerController.addLoyaltyPoints);

// POST /api/v1/customers/:id/deduct-points - Deduct loyalty points
router.post('/:id/deduct-points', requirePermission('customer:update'), CustomerController.deductLoyaltyPoints);

// DELETE /api/v1/customers/:id - Delete customer
router.delete('/:id', requirePermission('customer:delete'), CustomerController.deleteCustomer);

export default router;