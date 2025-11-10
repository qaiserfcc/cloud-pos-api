import { Router } from 'express';
import { SaleController } from '../controllers/sale.controller';
import { authenticateToken, requireTenantAccess, requireStoreAccess, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// All sale routes require authentication and tenant access
router.use(authenticateToken);
router.use(requireTenantAccess);

// Store-specific routes (require store access)
const storeRouter = Router();
storeRouter.use(requireStoreAccess);

// GET /api/v1/sales - Get sales for store with pagination and filters
storeRouter.get('/', requirePermission('sale:read'), SaleController.getStoreSales);

// GET /api/v1/sales/stats - Get sales statistics for store
storeRouter.get('/stats', requirePermission('sale:read'), SaleController.getSalesStats);

// GET /api/v1/sales/:id - Get sale by ID
storeRouter.get('/:id', requirePermission('sale:read'), SaleController.getSaleById);

// POST /api/v1/sales - Create new sale
storeRouter.post('/', requirePermission('sale:create'), SaleController.createSale);

// PUT /api/v1/sales/:id - Update sale details
storeRouter.put('/:id', requirePermission('sale:update'), SaleController.updateSale);

// POST /api/v1/sales/:id/payment - Process payment for sale
storeRouter.post('/:id/payment', requirePermission('sale:update'), SaleController.processPayment);

// POST /api/v1/sales/:id/complete - Complete a sale
storeRouter.post('/:id/complete', requirePermission('sale:update'), SaleController.completeSale);

// POST /api/v1/sales/:id/cancel - Cancel a sale
storeRouter.post('/:id/cancel', requirePermission('sale:update'), SaleController.cancelSale);

// POST /api/v1/sales/:id/refund - Process refund for sale
storeRouter.post('/:id/refund', requirePermission('sale:update'), SaleController.processRefund);

// DELETE /api/v1/sales/:id - Delete a sale (admin only)
storeRouter.delete('/:id', requirePermission('sale:delete'), SaleController.deleteSale);

// Mount store routes
router.use('/', storeRouter);

// Multi-store analytics routes (tenant-wide operations - no store access required)
router.use(requirePermission('analytics:tenant_wide'));

// GET /api/v1/sales/tenant/stats - Get tenant-wide sales statistics
router.get('/tenant/stats', SaleController.getTenantSalesStats);

// GET /api/v1/sales/tenant/compare - Compare sales across stores
router.get('/tenant/compare', SaleController.compareStoreSales);

// GET /api/v1/sales/tenant/trends - Get tenant-wide sales trends
router.get('/tenant/trends', SaleController.getTenantSalesTrends);

// GET /api/v1/sales/tenant/inventory-turnover - Get inventory turnover metrics across stores
router.get('/tenant/inventory-turnover', SaleController.getInventoryTurnoverMetrics);

// GET /api/v1/sales/tenant/profitability - Get store profitability metrics
router.get('/tenant/profitability', SaleController.getStoreProfitabilityMetrics);

export default router;