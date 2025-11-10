import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authenticateToken, requireTenantAccess, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// All inventory routes require authentication and tenant access
router.use(authenticateToken);
router.use(requireTenantAccess);

// GET /api/v1/inventory - Get all inventory for store
router.get('/', requirePermission('inventory:read'), InventoryController.getStoreInventory);

// GET /api/v1/inventory/stats - Get inventory statistics
router.get('/stats', requirePermission('inventory:read'), InventoryController.getInventoryStats);

// GET /api/v1/inventory/low-stock - Get low stock items
router.get('/low-stock', requirePermission('inventory:read'), InventoryController.getLowStockItems);

// GET /api/v1/inventory/expiring - Get expiring items
router.get('/expiring', requirePermission('inventory:read'), InventoryController.getExpiringItems);

// GET /api/v1/inventory/:productId - Get inventory by product
router.get('/:productId', requirePermission('inventory:read'), InventoryController.getInventoryByProduct);

// POST /api/v1/inventory - Create or update inventory record
router.post('/', requirePermission('inventory:create'), InventoryController.createOrUpdateInventory);

// PUT /api/v1/inventory/:productId - Update inventory settings
router.put('/:productId', requirePermission('inventory:update'), InventoryController.updateInventory);

// POST /api/v1/inventory/adjust - Adjust inventory quantity (stock in/out)
router.post('/adjust', requirePermission('inventory:update'), InventoryController.adjustInventory);

// POST /api/v1/inventory/reserve - Reserve inventory for sale
router.post('/reserve', requirePermission('inventory:update'), InventoryController.reserveInventory);

// POST /api/v1/inventory/release - Release reserved inventory
router.post('/release', requirePermission('inventory:update'), InventoryController.releaseReservedInventory);

// POST /api/v1/inventory/stock-take - Perform stock take
router.post('/stock-take', requirePermission('inventory:update'), InventoryController.performStockTake);

// DELETE /api/v1/inventory/:productId - Delete inventory record
router.delete('/:productId', requirePermission('inventory:delete'), InventoryController.deleteInventory);

export default router;