import { Request, Response, NextFunction } from 'express';
import {
  InventoryService,
  CreateInventoryData,
  UpdateInventoryData,
  InventoryAdjustmentData,
  StockTakeData,
  InventoryWithProduct
} from '../services/inventory.service';
import { AuthRequest } from './auth.controller';
import logger from '../config/logger';

export class InventoryController {
  /**
   * Get all inventory for a store
   */
  static async getStoreInventory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId || req.query.storeId as string;
      const includeInactive = req.query.includeInactive === 'true';

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      if (!storeId) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
        return;
      }

      const inventory = await InventoryService.getStoreInventory(storeId, tenantId, includeInactive);

      logger.info(`Retrieved ${inventory.length} inventory items for store ${storeId}, tenant ${tenantId}`);

      res.json({
        success: true,
        data: inventory,
      });
    } catch (error: any) {
      logger.error('Get store inventory error:', error);
      next(error);
    }
  }

  /**
   * Get inventory by product
   */
  static async getInventoryByProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId || req.query.storeId as string;

      if (!productId) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required',
        });
        return;
      }

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      if (!storeId) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
        return;
      }

      const inventory = await InventoryService.getInventoryByProduct(productId, storeId, tenantId);

      if (!inventory) {
        res.status(404).json({
          success: false,
          error: 'Inventory record not found',
        });
        return;
      }

      logger.info(`Retrieved inventory for product ${productId} in store ${storeId}, tenant ${tenantId}`);

      res.json({
        success: true,
        data: inventory,
      });
    } catch (error: any) {
      logger.error('Get inventory by product error:', error);

      if (error.message === 'Inventory record not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Create or update inventory record
   */
  static async createOrUpdateInventory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId || req.body.storeId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      if (!storeId) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
        return;
      }

      const inventoryData: CreateInventoryData = {
        tenantId,
        storeId,
        ...req.body,
      };

      const inventory = await InventoryService.createOrUpdateInventory(inventoryData);

      logger.info(`Created/updated inventory for product ${inventory.productId} in store ${storeId}, tenant ${tenantId}`);

      res.status(201).json({
        success: true,
        data: inventory,
        message: 'Inventory record created/updated successfully',
      });
    } catch (error: any) {
      logger.error('Create/update inventory error:', error);

      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Product not found') {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Update inventory settings
   */
  static async updateInventory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId || req.query.storeId as string;

      if (!productId) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required',
        });
        return;
      }

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      if (!storeId) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
        return;
      }

      const updateData: UpdateInventoryData = req.body;

      const inventory = await InventoryService.updateInventory(productId, storeId, tenantId, updateData);

      if (!inventory) {
        res.status(404).json({
          success: false,
          error: 'Inventory record not found',
        });
        return;
      }

      logger.info(`Updated inventory for product ${productId} in store ${storeId}, tenant ${tenantId}`);

      res.json({
        success: true,
        data: inventory,
        message: 'Inventory updated successfully',
      });
    } catch (error: any) {
      logger.error('Update inventory error:', error);
      next(error);
    }
  }

  /**
   * Adjust inventory quantity (stock in/out)
   */
  static async adjustInventory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId || req.body.storeId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      if (!storeId) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
        return;
      }

      const adjustmentData: InventoryAdjustmentData = req.body;

      const inventory = await InventoryService.adjustInventory(storeId, tenantId, adjustmentData);

      logger.info(`Adjusted inventory for product ${adjustmentData.productId} by ${adjustmentData.quantity} (${adjustmentData.reason}) in store ${storeId}, tenant ${tenantId}`);

      res.json({
        success: true,
        data: inventory,
        message: 'Inventory adjusted successfully',
      });
    } catch (error: any) {
      logger.error('Adjust inventory error:', error);

      if (error.message === 'Inventory record not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Insufficient inventory quantity') {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Reserve inventory for sale
   */
  static async reserveInventory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId || req.body.storeId;
      const { productId, quantity } = req.body;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      if (!storeId) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
        return;
      }

      if (!productId || typeof quantity !== 'number' || quantity <= 0) {
        res.status(400).json({
          success: false,
          error: 'Valid productId and positive quantity are required',
        });
        return;
      }

      const inventory = await InventoryService.reserveInventory(storeId, tenantId, productId, quantity);

      logger.info(`Reserved ${quantity} units of product ${productId} in store ${storeId}, tenant ${tenantId}`);

      res.json({
        success: true,
        data: inventory,
        message: 'Inventory reserved successfully',
      });
    } catch (error: any) {
      logger.error('Reserve inventory error:', error);

      if (error.message === 'Inventory record not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Insufficient available inventory') {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Release reserved inventory
   */
  static async releaseReservedInventory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId || req.body.storeId;
      const { productId, quantity } = req.body;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      if (!storeId) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
        return;
      }

      if (!productId || typeof quantity !== 'number' || quantity <= 0) {
        res.status(400).json({
          success: false,
          error: 'Valid productId and positive quantity are required',
        });
        return;
      }

      const inventory = await InventoryService.releaseReservedInventory(storeId, tenantId, productId, quantity);

      logger.info(`Released ${quantity} units of reserved inventory for product ${productId} in store ${storeId}, tenant ${tenantId}`);

      res.json({
        success: true,
        data: inventory,
        message: 'Reserved inventory released successfully',
      });
    } catch (error: any) {
      logger.error('Release reserved inventory error:', error);

      if (error.message === 'Inventory record not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Cannot release more than reserved quantity') {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Perform stock take
   */
  static async performStockTake(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId || req.body.storeId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      if (!storeId) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
        return;
      }

      const stockTakeData: StockTakeData = req.body;

      const inventory = await InventoryService.performStockTake(storeId, tenantId, stockTakeData);

      logger.info(`Performed stock take for product ${stockTakeData.productId} in store ${storeId}, tenant ${tenantId}`);

      res.json({
        success: true,
        data: inventory,
        message: 'Stock take completed successfully',
      });
    } catch (error: any) {
      logger.error('Perform stock take error:', error);

      if (error.message === 'Inventory record not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Get low stock items
   */
  static async getLowStockItems(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId || req.query.storeId as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      if (!storeId) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
        return;
      }

      const lowStockItems = await InventoryService.getLowStockItems(storeId, tenantId);

      logger.info(`Retrieved ${lowStockItems.length} low stock items for store ${storeId}, tenant ${tenantId}`);

      res.json({
        success: true,
        data: lowStockItems,
      });
    } catch (error: any) {
      logger.error('Get low stock items error:', error);
      next(error);
    }
  }

  /**
   * Get expiring items
   */
  static async getExpiringItems(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId || req.query.storeId as string;
      const daysAhead = parseInt(req.query.daysAhead as string) || 30;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      if (!storeId) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
        return;
      }

      const expiringItems = await InventoryService.getExpiringItems(storeId, tenantId, daysAhead);

      logger.info(`Retrieved ${expiringItems.length} expiring items for store ${storeId}, tenant ${tenantId} (within ${daysAhead} days)`);

      res.json({
        success: true,
        data: expiringItems,
      });
    } catch (error: any) {
      logger.error('Get expiring items error:', error);
      next(error);
    }
  }

  /**
   * Get inventory statistics
   */
  static async getInventoryStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId || req.query.storeId as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      if (!storeId) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
        return;
      }

      const stats = await InventoryService.getInventoryStats(storeId, tenantId);

      logger.info(`Retrieved inventory statistics for store ${storeId}, tenant ${tenantId}`);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get inventory stats error:', error);
      next(error);
    }
  }

  /**
   * Delete inventory record
   */
  static async deleteInventory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId || req.query.storeId as string;

      if (!productId) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required',
        });
        return;
      }

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      if (!storeId) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
        return;
      }

      const deleted = await InventoryService.deleteInventory(productId, storeId, tenantId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Inventory record not found',
        });
        return;
      }

      logger.info(`Deleted inventory for product ${productId} in store ${storeId}, tenant ${tenantId}`);

      res.json({
        success: true,
        message: 'Inventory record deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete inventory error:', error);
      next(error);
    }
  }
}