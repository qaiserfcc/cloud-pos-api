import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import BulkInventoryTransferService, { CreateBulkTransferData } from '../services/bulk-inventory-transfer.service';
import logger from '../config/logger';

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
export const createBulkTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;

    if (!tenantId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required authentication data',
      });
    }

    const transferData: any = {
      sourceStoreId: req.body.sourceStoreId,
      destinationStoreId: req.body.destinationStoreId,
      title: req.body.title,
      items: req.body.items,
    };

    if (req.body.description !== undefined) transferData.description = req.body.description;
    if (req.body.priority !== undefined) transferData.priority = req.body.priority;
    if (req.body.transferType !== undefined) transferData.transferType = req.body.transferType;
    if (req.body.scheduledShipDate !== undefined) transferData.scheduledShipDate = new Date(req.body.scheduledShipDate);
    if (req.body.scheduledReceiveDate !== undefined) transferData.scheduledReceiveDate = new Date(req.body.scheduledReceiveDate);
    if (req.body.notes !== undefined) transferData.notes = req.body.notes;
    if (req.body.reference !== undefined) transferData.reference = req.body.reference;

    const bulkTransfer = await BulkInventoryTransferService.createBulkTransfer(tenantId, userId, transferData);

    return res.status(201).json({
      success: true,
      message: 'Bulk transfer created successfully',
      data: bulkTransfer,
    });
  } catch (error: any) {
    logger.error('Create bulk transfer error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create bulk transfer',
    });
  }
};

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
export const submitBulkTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    const userId = req.user!.id;

    if (!id || !tenantId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
    }

    const bulkTransfer = await BulkInventoryTransferService.submitBulkTransfer(id, tenantId, userId);

    return res.json({
      success: true,
      message: 'Bulk transfer submitted for approval',
      data: bulkTransfer,
    });
  } catch (error: any) {
    logger.error('Submit bulk transfer error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit bulk transfer',
    });
  }
};

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
export const approveBulkTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { notes } = req.body;

    if (!id || !tenantId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
    }

    const result = await BulkInventoryTransferService.approveBulkTransfer(id, tenantId, userId, notes);

    return res.json({
      success: true,
      message: 'Bulk transfer approved and individual transfers created',
      data: result,
    });
  } catch (error: any) {
    logger.error('Approve bulk transfer error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve bulk transfer',
    });
  }
};

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
export const getBulkTransfers = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;

    const filters: any = {};
    if (req.query.status) filters.status = Array.isArray(req.query.status) ? req.query.status : [req.query.status];
    if (req.query.sourceStoreId) filters.sourceStoreId = req.query.sourceStoreId as string;
    if (req.query.destinationStoreId) filters.destinationStoreId = req.query.destinationStoreId as string;
    if (req.query.transferType) filters.transferType = Array.isArray(req.query.transferType) ? req.query.transferType : [req.query.transferType];
    if (req.query.priority) filters.priority = Array.isArray(req.query.priority) ? req.query.priority : [req.query.priority];
    if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
    if (req.query.offset) filters.offset = parseInt(req.query.offset as string);

    const result = await BulkInventoryTransferService.getBulkTransfers(tenantId, filters);

    return res.json({
      success: true,
      message: 'Bulk transfers retrieved successfully',
      data: result.transfers,
      pagination: {
        total: result.total,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      },
    });
  } catch (error: any) {
    logger.error('Get bulk transfers error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve bulk transfers',
    });
  }
};

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
export const getBulkTransferById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    if (!id || !tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
    }

    const result = await BulkInventoryTransferService.getBulkTransferById(id, tenantId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Bulk transfer not found',
      });
    }

    return res.json({
      success: true,
      message: 'Bulk transfer retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Get bulk transfer by ID error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve bulk transfer',
    });
  }
};

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
export const cancelBulkTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { reason } = req.body;

    if (!id || !tenantId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
    }

    const result = await BulkInventoryTransferService.cancelBulkTransfer(id, tenantId, userId, reason);

    return res.json({
      success: true,
      message: 'Bulk transfer cancelled successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Cancel bulk transfer error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel bulk transfer',
    });
  }
};