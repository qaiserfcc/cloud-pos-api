import { Router } from 'express';
import {
  createBulkTransfer,
  submitBulkTransfer,
  approveBulkTransfer,
  getBulkTransfers,
  getBulkTransferById,
  cancelBulkTransfer,
} from '../controllers/bulk-inventory-transfer.controller';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/bulk-transfers:
 *   post:
 *     summary: Create a new bulk inventory transfer
 *     tags: [Bulk Inventory Transfers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sourceStoreId
 *               - destinationStoreId
 *               - title
 *               - items
 *             properties:
 *               sourceStoreId:
 *                 type: string
 *               destinationStoreId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *               transferType:
 *                 type: string
 *                 enum: [replenishment, allocation, return, adjustment, emergency]
 *               scheduledShipDate:
 *                 type: string
 *                 format: date-time
 *               scheduledReceiveDate:
 *                 type: string
 *                 format: date-time
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                         type: string
 *                     quantity:
 *                         type: number
 *                     unitCost:
 *                         type: number
 *                     notes:
 *                         type: string
 *               notes:
 *                 type: string
 *               reference:
 *                 type: string
 *     responses:
 *       201:
 *         description: Bulk transfer created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  authenticateToken,
  requirePermission('inventory.transfer.create'),
  createBulkTransfer
);

/**
 * @swagger
 * /api/v1/bulk-transfers/{id}/submit:
 *   post:
 *     summary: Submit bulk transfer for approval
 *     tags: [Bulk Inventory Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bulk transfer submitted successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bulk transfer not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:id/submit',
  authenticateToken,
  requirePermission('inventory.transfer.update'),
  submitBulkTransfer
);

/**
 * @swagger
 * /api/v1/bulk-transfers/{id}/approve:
 *   post:
 *     summary: Approve bulk transfer and create individual transfers
 *     tags: [Bulk Inventory Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bulk transfer approved successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bulk transfer not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:id/approve',
  authenticateToken,
  requirePermission('inventory.transfer.approve'),
  approveBulkTransfer
);

/**
 * @swagger
 * /api/v1/bulk-transfers:
 *   get:
 *     summary: Get bulk transfers with filtering
 *     tags: [Bulk Inventory Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [draft, pending, approved, in_transit, completed, cancelled]
 *       - in: query
 *         name: sourceStoreId
 *         schema:
 *           type: string
 *       - in: query
 *         name: destinationStoreId
 *         schema:
 *           type: string
 *       - in: query
 *         name: transferType
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [replenishment, allocation, return, adjustment, emergency]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [low, normal, high, urgent]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Bulk transfers retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  authenticateToken,
  requirePermission('inventory.transfer.read'),
  getBulkTransfers
);

/**
 * @swagger
 * /api/v1/bulk-transfers/{id}:
 *   get:
 *     summary: Get bulk transfer by ID with full details
 *     tags: [Bulk Inventory Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bulk transfer retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bulk transfer not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id',
  authenticateToken,
  requirePermission('inventory.transfer.read'),
  getBulkTransferById
);

/**
 * @swagger
 * /api/v1/bulk-transfers/{id}/cancel:
 *   post:
 *     summary: Cancel bulk transfer
 *     tags: [Bulk Inventory Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bulk transfer cancelled successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bulk transfer not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:id/cancel',
  authenticateToken,
  requirePermission('inventory.transfer.update'),
  cancelBulkTransfer
);

export default router;