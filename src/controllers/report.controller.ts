import { Request, Response, NextFunction } from 'express';
import {
  ReportService,
  SalesReport,
  InventoryReport,
  CustomerReport,
  ProductReport,
  ReportFilters
} from '../services/report.service';
import { AuthRequest } from './auth.controller';
import logger from '../config/logger';

export class ReportController {
  /**
   * Generate sales report
   */
  static async generateSalesReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId;
      const {
        startDate,
        endDate,
        customerId,
        userId
      } = req.query;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const filters: ReportFilters = {
        ...(startDate && { startDate: new Date(startDate as string) }),
        ...(endDate && { endDate: new Date(endDate as string) }),
        ...(storeId && { storeId: storeId as string }),
        ...(customerId && { customerId: customerId as string }),
        ...(userId && { userId: userId as string }),
      };

      const report = await ReportService.generateSalesReport(tenantId, filters);

      logger.info(`Generated sales report for tenant ${tenantId}`);

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      logger.error('Generate sales report error:', error);
      next(error);
    }
  }

  /**
   * Generate inventory report
   */
  static async generateInventoryReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId;
      const { categoryId, productId } = req.query;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const filters: ReportFilters = {
        ...(storeId && { storeId: storeId as string }),
        ...(categoryId && { categoryId: categoryId as string }),
        ...(productId && { productId: productId as string }),
      };

      const report = await ReportService.generateInventoryReport(tenantId, filters);

      logger.info(`Generated inventory report for tenant ${tenantId}`);

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      logger.error('Generate inventory report error:', error);
      next(error);
    }
  }

  /**
   * Generate customer report
   */
  static async generateCustomerReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { customerId } = req.query;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const filters: ReportFilters = {
        ...(customerId && { customerId: customerId as string }),
      };

      const report = await ReportService.generateCustomerReport(tenantId, filters);

      logger.info(`Generated customer report for tenant ${tenantId}`);

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      logger.error('Generate customer report error:', error);
      next(error);
    }
  }

  /**
   * Generate product report
   */
  static async generateProductReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { categoryId, productId } = req.query;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const filters: ReportFilters = {
        ...(categoryId && { categoryId: categoryId as string }),
        ...(productId && { productId: productId as string }),
      };

      const report = await ReportService.generateProductReport(tenantId, filters);

      logger.info(`Generated product report for tenant ${tenantId}`);

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      logger.error('Generate product report error:', error);
      next(error);
    }
  }

  /**
   * Generate business intelligence report
   */
  static async generateBusinessReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId;
      const {
        startDate,
        endDate,
        categoryId,
        productId,
        customerId,
        userId
      } = req.query;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const filters: ReportFilters = {
        ...(startDate && { startDate: new Date(startDate as string) }),
        ...(endDate && { endDate: new Date(endDate as string) }),
        ...(storeId && { storeId: storeId as string }),
        ...(categoryId && { categoryId: categoryId as string }),
        ...(productId && { productId: productId as string }),
        ...(customerId && { customerId: customerId as string }),
        ...(userId && { userId: userId as string }),
      };

      const report = await ReportService.generateBusinessReport(tenantId, filters);

      logger.info(`Generated business report for tenant ${tenantId}`);

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      logger.error('Generate business report error:', error);
      next(error);
    }
  }

  /**
   * Generate regional sales dashboard
   */
  static async generateRegionalSalesDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const {
        startDate,
        endDate,
      } = req.query;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const filters: ReportFilters = {
        ...(startDate && { startDate: new Date(startDate as string) }),
        ...(endDate && { endDate: new Date(endDate as string) }),
      };

      const dashboard = await ReportService.generateRegionalSalesDashboard(tenantId, filters);

      logger.info(`Generated regional sales dashboard for tenant ${tenantId}`);

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      logger.error('Generate regional sales dashboard error:', error);
      next(error);
    }
  }

  /**
   * Generate regional inventory dashboard
   */
  static async generateRegionalInventoryDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const filters: ReportFilters = {};

      const dashboard = await ReportService.generateRegionalInventoryDashboard(tenantId, filters);

      logger.info(`Generated regional inventory dashboard for tenant ${tenantId}`);

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      logger.error('Generate regional inventory dashboard error:', error);
      next(error);
    }
  }

  /**
   * Generate regional performance dashboard
   */
  static async generateRegionalPerformanceDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const {
        startDate,
        endDate,
      } = req.query;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const filters: ReportFilters = {
        ...(startDate && { startDate: new Date(startDate as string) }),
        ...(endDate && { endDate: new Date(endDate as string) }),
      };

      const dashboard = await ReportService.generateRegionalPerformanceDashboard(tenantId, filters);

      logger.info(`Generated regional performance dashboard for tenant ${tenantId}`);

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      logger.error('Generate regional performance dashboard error:', error);
      next(error);
    }
  }
}