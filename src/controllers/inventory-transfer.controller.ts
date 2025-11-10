import { Request, Response } from 'express';
import { InventoryTransferService } from '../services/inventory-transfer.service';
import logger from '../config/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    storeId?: string;
    role?: string;
  };
}

export class InventoryTransferController {
  /**
   * Create a new inventory transfer request
   */
  static async createTransfer(req: AuthRequest, res: Response) {
    try {
      const { tenantId, id: userId } = req.user!;
      const transferData = req.body;

      const transfer = await InventoryTransferService.createTransfer(userId, {
        ...transferData,
        tenantId,
      });

      res.status(201).json({
        success: true,
        message: 'Inventory transfer request created successfully',
        data: transfer,
      });
    } catch (error: any) {
      logger.error('Error creating inventory transfer:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create inventory transfer',
      });
    }
  }

  /**
   * Get transfer by ID
   */
  static async getTransfer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = req.user!;
      const { transferId } = req.params;

      if (!transferId) {
        res.status(400).json({
          success: false,
          message: 'Transfer ID is required',
        });
        return;
      }

      const transfer = await InventoryTransferService.getTransferById(transferId, tenantId);

      res.json({
        success: true,
        data: transfer,
      });
    } catch (error: any) {
      logger.error('Error getting inventory transfer:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Transfer not found',
      });
    }
  }

  /**
   * Get transfers with filtering
   */
  static async getTransfers(req: AuthRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const {
        status,
        sourceStoreId,
        destinationStoreId,
        productId,
        requestedBy,
        dateFrom,
        dateTo,
        limit,
        offset,
      } = req.query;

      const filters: any = {};

      if (status) {
        filters.status = Array.isArray(status) ? status : [status];
      }

      if (sourceStoreId) {
        filters.sourceStoreId = sourceStoreId as string;
      }

      if (destinationStoreId) {
        filters.destinationStoreId = destinationStoreId as string;
      }

      if (productId) {
        filters.productId = productId as string;
      }

      if (requestedBy) {
        filters.requestedBy = requestedBy as string;
      }

      if (dateFrom) {
        filters.dateFrom = new Date(dateFrom as string);
      }

      if (dateTo) {
        filters.dateTo = new Date(dateTo as string);
      }

      if (limit) {
        filters.limit = parseInt(limit as string);
      }

      if (offset) {
        filters.offset = parseInt(offset as string);
      }

      const result = await InventoryTransferService.getTransfers(tenantId, filters);

      res.json({
        success: true,
        data: result.transfers,
        pagination: {
          total: result.total,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
        },
      });
    } catch (error: any) {
      logger.error('Error getting inventory transfers:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve transfers',
      });
    }
  }

  /**
   * Approve transfer
   */
  static async approveTransfer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tenantId, id: userId } = req.user!;
      const { transferId } = req.params;

      if (!transferId) {
        res.status(400).json({
          success: false,
          message: 'Transfer ID is required',
        });
        return;
      }

      const transfer = await InventoryTransferService.approveTransfer(transferId, tenantId, userId);

      res.json({
        success: true,
        message: 'Transfer approved successfully',
        data: transfer,
      });
    } catch (error: any) {
      logger.error('Error approving inventory transfer:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to approve transfer',
      });
    }
  }

  /**
   * Reject transfer
   */
  static async rejectTransfer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tenantId, id: userId } = req.user!;
      const { transferId } = req.params;
      const { notes } = req.body;

      if (!transferId) {
        res.status(400).json({
          success: false,
          message: 'Transfer ID is required',
        });
        return;
      }

      const transfer = await InventoryTransferService.rejectTransfer(transferId, tenantId, userId, notes);

      res.json({
        success: true,
        message: 'Transfer rejected successfully',
        data: transfer,
      });
    } catch (error: any) {
      logger.error('Error rejecting inventory transfer:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reject transfer',
      });
    }
  }

  /**
   * Ship transfer
   */
  static async shipTransfer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tenantId, id: userId } = req.user!;
      const { transferId } = req.params;

      if (!transferId) {
        res.status(400).json({
          success: false,
          message: 'Transfer ID is required',
        });
        return;
      }

      const transfer = await InventoryTransferService.shipTransfer(transferId, tenantId, userId);

      res.json({
        success: true,
        message: 'Transfer shipped successfully',
        data: transfer,
      });
    } catch (error: any) {
      logger.error('Error shipping inventory transfer:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to ship transfer',
      });
    }
  }

  /**
   * Complete transfer
   */
  static async completeTransfer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tenantId, id: userId } = req.user!;
      const { transferId } = req.params;

      if (!transferId) {
        res.status(400).json({
          success: false,
          message: 'Transfer ID is required',
        });
        return;
      }

      const transfer = await InventoryTransferService.completeTransfer(transferId, tenantId, userId);

      res.json({
        success: true,
        message: 'Transfer completed successfully',
        data: transfer,
      });
    } catch (error: any) {
      logger.error('Error completing inventory transfer:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to complete transfer',
      });
    }
  }

  /**
   * Cancel transfer
   */
  static async cancelTransfer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tenantId, id: userId } = req.user!;
      const { transferId } = req.params;
      const { notes } = req.body;

      if (!transferId) {
        res.status(400).json({
          success: false,
          message: 'Transfer ID is required',
        });
        return;
      }

      const transfer = await InventoryTransferService.cancelTransfer(transferId, tenantId, userId, notes);

      res.json({
        success: true,
        message: 'Transfer cancelled successfully',
        data: transfer,
      });
    } catch (error: any) {
      logger.error('Error cancelling inventory transfer:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to cancel transfer',
      });
    }
  }

  /**
   * Get transfer statistics
   */
  static async getTransferStats(req: AuthRequest, res: Response) {
    try {
      const { tenantId } = req.user!;

      const stats = await InventoryTransferService.getTransferStats(tenantId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Error getting transfer statistics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get transfer statistics',
      });
    }
  }
}