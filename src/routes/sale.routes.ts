import { Router } from 'express';
import { SaleController } from '../controllers/sale.controller';
import { authenticateToken, requireTenantAccess, requireStoreAccess, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// All sale routes require authentication, tenant access, and store access
router.use(authenticateToken);
router.use(requireTenantAccess);
router.use(requireStoreAccess);

// GET /api/v1/sales - Get sales for store with pagination and filters
router.get('/', requirePermission('sale:read'), SaleController.getStoreSales);

// GET /api/v1/sales/stats - Get sales statistics for store
router.get('/stats', requirePermission('sale:read'), SaleController.getSalesStats);

// GET /api/v1/sales/:id - Get sale by ID
router.get('/:id', requirePermission('sale:read'), SaleController.getSaleById);

// POST /api/v1/sales - Create new sale
router.post('/', requirePermission('sale:create'), SaleController.createSale);

// PUT /api/v1/sales/:id - Update sale details
router.put('/:id', requirePermission('sale:update'), SaleController.updateSale);

// POST /api/v1/sales/:id/payment - Process payment for sale
router.post('/:id/payment', requirePermission('sale:update'), SaleController.processPayment);

// POST /api/v1/sales/:id/complete - Complete a sale
router.post('/:id/complete', requirePermission('sale:update'), SaleController.completeSale);

// POST /api/v1/sales/:id/cancel - Cancel a sale
router.post('/:id/cancel', requirePermission('sale:update'), SaleController.cancelSale);

// POST /api/v1/sales/:id/refund - Process refund for sale
router.post('/:id/refund', requirePermission('sale:update'), SaleController.processRefund);

// DELETE /api/v1/sales/:id - Delete a sale (admin only)
router.delete('/:id', requirePermission('sale:delete'), SaleController.deleteSale);

export default router;