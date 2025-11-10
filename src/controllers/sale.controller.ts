import { Request, Response, NextFunction } from 'express';
import {
  SaleService,
  CreateSaleData,
  UpdateSaleData,
  ProcessPaymentData,
  SaleWithDetails
} from '../services/sale.service';
import { AuthRequest } from './auth.controller';
import logger from '../config/logger';

export class SaleController {
  /**
   * Create a new sale transaction
   */
  static async createSale(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId;

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

      const saleData: CreateSaleData = {
        tenantId,
        storeId,
        userId: req.user!.id,
        ...req.body,
      };

      const sale = await SaleService.createSale(saleData);

      logger.info(`Created sale ${sale.saleNumber} for store ${storeId} in tenant ${tenantId}`);

      res.status(201).json({
        success: true,
        data: sale,
        message: 'Sale created successfully',
      });
    } catch (error: any) {
      logger.error('Create sale error:', error);

      if (error.message.includes('not found') || error.message.includes('insufficient stock')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Get sale by ID
   */
  static async getSaleById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Sale ID is required',
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

      const sale = await SaleService.getSaleById(id, tenantId);

      if (!sale) {
        res.status(404).json({
          success: false,
          error: 'Sale not found',
        });
        return;
      }

      logger.info(`Retrieved sale ${sale.saleNumber} for tenant ${tenantId}`);

      res.json({
        success: true,
        data: sale,
      });
    } catch (error: any) {
      logger.error('Get sale by ID error:', error);

      if (error.message === 'Sale not found') {
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
   * Get sales for a store with pagination and filters
   */
  static async getStoreSales(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId;

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

      const {
        page = 1,
        limit = 20,
        status,
        paymentStatus,
        startDate,
        endDate,
        customerId,
        search,
      } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 20;

      const filters: any = {};
      if (status) filters.status = status;
      if (paymentStatus) filters.paymentStatus = paymentStatus;
      if (customerId) filters.customerId = customerId;
      if (search) filters.search = search;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const result = await SaleService.getStoreSales(
        storeId,
        tenantId,
        pageNum,
        limitNum,
        filters
      );

      logger.info(`Retrieved ${result.sales.length} sales for store ${storeId} in tenant ${tenantId}`);

      res.json({
        success: true,
        data: result.sales,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          totalPages: Math.ceil(result.total / limitNum),
        },
      });
    } catch (error: any) {
      logger.error('Get store sales error:', error);
      next(error);
    }
  }

  /**
   * Update sale details
   */
  static async updateSale(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Sale ID is required',
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

      const updateData: UpdateSaleData = req.body;

      const sale = await SaleService.updateSale(id, tenantId, updateData);

      if (!sale) {
        res.status(404).json({
          success: false,
          error: 'Sale not found',
        });
        return;
      }

      logger.info(`Updated sale ${sale.saleNumber} for tenant ${tenantId}`);

      res.json({
        success: true,
        data: sale,
        message: 'Sale updated successfully',
      });
    } catch (error: any) {
      logger.error('Update sale error:', error);

      if (error.message === 'Sale not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('cannot be updated')) {
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
   * Process payment for a sale
   */
  static async processPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Sale ID is required',
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

      const paymentData: ProcessPaymentData = req.body;

      const sale = await SaleService.processPayment(id, tenantId, paymentData, req.user!.id);

      logger.info(`Processed payment for sale ${sale.saleNumber} in tenant ${tenantId}`);

      res.json({
        success: true,
        data: sale,
        message: 'Payment processed successfully',
      });
    } catch (error: any) {
      logger.error('Process payment error:', error);

      if (error.message === 'Sale not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('cannot process payment') || error.message.includes('invalid')) {
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
   * Complete a sale
   */
  static async completeSale(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Sale ID is required',
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

      const sale = await SaleService.completeSale(id, tenantId);

      logger.info(`Completed sale ${sale.saleNumber} for tenant ${tenantId}`);

      res.json({
        success: true,
        data: sale,
        message: 'Sale completed successfully',
      });
    } catch (error: any) {
      logger.error('Complete sale error:', error);

      if (error.message === 'Sale not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('cannot be completed')) {
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
   * Cancel a sale
   */
  static async cancelSale(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Sale ID is required',
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

      const sale = await SaleService.cancelSale(id, tenantId);

      logger.info(`Cancelled sale ${sale.saleNumber} for tenant ${tenantId}`);

      res.json({
        success: true,
        data: sale,
        message: 'Sale cancelled successfully',
      });
    } catch (error: any) {
      logger.error('Cancel sale error:', error);

      if (error.message === 'Sale not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('cannot be cancelled')) {
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
   * Process refund for a sale
   */
  static async processRefund(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      const { refundAmount, reason } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Sale ID is required',
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

      if (!refundAmount || typeof refundAmount !== 'number' || refundAmount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Valid refund amount is required',
        });
        return;
      }

      if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Refund reason is required',
        });
        return;
      }

      const sale = await SaleService.processRefund(id, tenantId, refundAmount, reason.trim(), req.user!.id);

      logger.info(`Processed refund for sale ${sale.saleNumber} in tenant ${tenantId}`);

      res.json({
        success: true,
        data: sale,
        message: 'Refund processed successfully',
      });
    } catch (error: any) {
      logger.error('Process refund error:', error);

      if (error.message === 'Sale not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('cannot process refund') || error.message.includes('invalid')) {
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
   * Get sales statistics for a store
   */
  static async getSalesStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId;

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

      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await SaleService.getSalesStats(storeId, tenantId, start, end);

      logger.info(`Retrieved sales statistics for store ${storeId} in tenant ${tenantId}`);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get sales stats error:', error);
      next(error);
    }
  }

  /**
   * Delete a sale (admin only, for data cleanup)
   */
  static async deleteSale(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Sale ID is required',
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

      const deleted = await SaleService.deleteSale(id, tenantId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Sale not found',
        });
        return;
      }

      logger.info(`Deleted sale ${id} for tenant ${tenantId}`);

      res.json({
        success: true,
        message: 'Sale deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete sale error:', error);

      if (error.message === 'Sale not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Cannot delete completed or paid sale') {
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
   * Get tenant-wide sales statistics
   */
  static async getTenantSalesStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await SaleService.getTenantSalesStats(tenantId, start, end);

      logger.info(`Retrieved tenant-wide sales statistics for tenant ${tenantId}`);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get tenant sales stats error:', error);
      next(error);
    }
  }

  /**
   * Compare sales performance across stores
   */
  static async compareStoreSales(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const comparison = await SaleService.compareStoreSales(tenantId, start, end);

      logger.info(`Retrieved store sales comparison for tenant ${tenantId}`);

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error: any) {
      logger.error('Compare store sales error:', error);
      next(error);
    }
  }

  /**
   * Get sales trends across all stores
   */
  static async getTenantSalesTrends(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const trends = await SaleService.getTenantSalesTrends(tenantId, start, end);

      logger.info(`Retrieved tenant sales trends for tenant ${tenantId}`);

      res.json({
        success: true,
        data: trends,
      });
    } catch (error: any) {
      logger.error('Get tenant sales trends error:', error);
      next(error);
    }
  }

  /**
   * Get inventory turnover metrics across stores
   */
  static async getInventoryTurnoverMetrics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const metrics = await SaleService.getInventoryTurnoverMetrics(tenantId, start, end);

      logger.info(`Retrieved inventory turnover metrics for tenant ${tenantId}`);

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      logger.error('Get inventory turnover metrics error:', error);
      next(error);
    }
  }

  /**
   * Get profitability metrics across stores
   */
  static async getStoreProfitabilityMetrics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const metrics = await SaleService.getStoreProfitabilityMetrics(tenantId, start, end);

      logger.info(`Retrieved store profitability metrics for tenant ${tenantId}`);

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      logger.error('Get store profitability metrics error:', error);
      next(error);
    }
  }
}