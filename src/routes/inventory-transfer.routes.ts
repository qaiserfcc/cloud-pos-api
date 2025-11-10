import { Router } from 'express';
import { InventoryTransferController } from '../controllers/inventory-transfer.controller';
import { authenticateToken, requireTenantAccess, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication and tenant access
router.use(authenticateToken);
router.use(requireTenantAccess);

/**
 * @route POST /api/v1/inventory-transfers
 * @desc Create a new inventory transfer request
 * @access Private (inventory_transfer.create permission required)
 */
router.post(
  '/',
  requirePermission('inventory_transfer:create'),
  InventoryTransferController.createTransfer
);

/**
 * @route GET /api/v1/inventory-transfers
 * @desc Get all inventory transfers with optional filtering
 * @access Private (inventory_transfer.read permission required)
 */
router.get(
  '/',
  requirePermission('inventory_transfer:read'),
  InventoryTransferController.getTransfers
);

/**
 * @route GET /api/v1/inventory-transfers/:transferId
 * @desc Get a specific inventory transfer by ID
 * @access Private (inventory_transfer.read permission required)
 */
router.get(
  '/:transferId',
  requirePermission('inventory_transfer:read'),
  InventoryTransferController.getTransfer
);

/**
 * @route PUT /api/v1/inventory-transfers/:transferId/approve
 * @desc Approve a pending inventory transfer
 * @access Private (inventory_transfer.approve permission required)
 */
router.put(
  '/:transferId/approve',
  requirePermission('inventory_transfer:approve'),
  InventoryTransferController.approveTransfer
);

/**
 * @route PUT /api/v1/inventory-transfers/:transferId/reject
 * @desc Reject a pending inventory transfer
 * @access Private (inventory_transfer.approve permission required)
 */
router.put(
  '/:transferId/reject',
  requirePermission('inventory_transfer:approve'),
  InventoryTransferController.rejectTransfer
);

/**
 * @route PUT /api/v1/inventory-transfers/:transferId/ship
 * @desc Mark transfer as shipped
 * @access Private (inventory_transfer.ship permission required)
 */
router.put(
  '/:transferId/ship',
  requirePermission('inventory_transfer:ship'),
  InventoryTransferController.shipTransfer
);

/**
 * @route PUT /api/v1/inventory-transfers/:transferId/complete
 * @desc Complete the inventory transfer (move inventory)
 * @access Private (inventory_transfer.complete permission required)
 */
router.put(
  '/:transferId/complete',
  requirePermission('inventory_transfer:complete'),
  InventoryTransferController.completeTransfer
);

/**
 * @route PUT /api/v1/inventory-transfers/:transferId/cancel
 * @desc Cancel an inventory transfer
 * @access Private (inventory_transfer.cancel permission required)
 */
router.put(
  '/:transferId/cancel',
  requirePermission('inventory_transfer:cancel'),
  InventoryTransferController.cancelTransfer
);

/**
 * @route GET /api/v1/inventory-transfers/stats/summary
 * @desc Get transfer statistics summary
 * @access Private (inventory_transfer.read permission required)
 */
router.get(
  '/stats/summary',
  requirePermission('inventory_transfer:read'),
  InventoryTransferController.getTransferStats
);

export default router;