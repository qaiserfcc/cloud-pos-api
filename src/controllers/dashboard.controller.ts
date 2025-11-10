import { Request, Response, NextFunction } from 'express';
import {
  DashboardService,
  CreateWidgetData,
  UpdateWidgetData,
  WidgetWithConfig,
  DashboardData
} from '../services/dashboard.service';
import { AuthRequest } from './auth.controller';
import logger from '../config/logger';

export class DashboardController {
  /**
   * Get available widgets for the authenticated user based on their permissions
   */
  static async getAvailableWidgets(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
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

      const widgets = await DashboardService.getAvailableWidgets(userId, tenantId, storeId);

      logger.info(`Retrieved ${widgets.length} available widgets for user ${userId}`);

      res.json({
        success: true,
        data: widgets,
      });
    } catch (error: any) {
      logger.error('Get available widgets error:', error);
      next(error);
    }
  }

  /**
   * Get user's dashboard with all widget data
   */
  static async getUserDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
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

      const dashboardData = await DashboardService.getUserDashboard(userId, tenantId, storeId);

      logger.info(`Retrieved dashboard data for user ${userId}`);

      res.json({
        success: true,
        data: dashboardData,
      });
    } catch (error: any) {
      logger.error('Get user dashboard error:', error);
      next(error);
    }
  }

  /**
   * Configure a widget for the tenant/store
   */
  static async configureWidget(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId;
      const { widgetKey, config, roles, permissions, position } = req.body;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      if (!widgetKey) {
        res.status(400).json({
          success: false,
          error: 'Widget key is required',
        });
        return;
      }

      const widgetData: CreateWidgetData = {
        tenantId,
        ...(storeId && { storeId }),
        widgetKey,
        config: config || {},
        roles: roles || [],
        permissions: permissions || [],
        position: position || {},
      };

      const result = await DashboardService.configureWidget(widgetData);

      logger.info(`Configured widget ${widgetKey} for tenant ${tenantId}`);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Widget configured successfully',
      });
    } catch (error: any) {
      logger.error('Configure widget error:', error);

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
   * Get all widget configurations for tenant/store
   */
  static async getWidgetConfigs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

      const configs = await DashboardService.getWidgetConfigs(tenantId, storeId);

      logger.info(`Retrieved ${configs.length} widget configurations for tenant ${tenantId}`);

      res.json({
        success: true,
        data: configs,
      });
    } catch (error: any) {
      logger.error('Get widget configs error:', error);
      next(error);
    }
  }

  /**
   * Update widget configuration
   */
  static async updateWidgetConfig(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { widgetId } = req.params;
      const { config, roles, permissions, position } = req.body;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      if (!widgetId) {
        res.status(400).json({
          success: false,
          error: 'Widget ID is required',
        });
        return;
      }

      const updateData: UpdateWidgetData = {};
      if (config !== undefined) updateData.config = config;
      if (roles !== undefined) updateData.roles = roles;
      if (permissions !== undefined) updateData.permissions = permissions;
      if (position !== undefined) updateData.position = position;

      const result = await DashboardService.updateWidgetConfig(widgetId, tenantId, updateData);

      if (!result) {
        res.status(404).json({
          success: false,
          error: 'Widget configuration not found',
        });
        return;
      }

      logger.info(`Updated widget configuration ${widgetId} for tenant ${tenantId}`);

      res.json({
        success: true,
        data: result,
        message: 'Widget configuration updated successfully',
      });
    } catch (error: any) {
      logger.error('Update widget config error:', error);

      if (error.message === 'Widget configuration not found') {
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
   * Remove widget configuration
   */
  static async removeWidget(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { widgetId } = req.params;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      if (!widgetId) {
        res.status(400).json({
          success: false,
          error: 'Widget ID is required',
        });
        return;
      }

      await DashboardService.deleteWidgetConfig(widgetId, tenantId);

      logger.info(`Removed widget configuration ${widgetId} for tenant ${tenantId}`);

      res.json({
        success: true,
        message: 'Widget configuration removed successfully',
      });
    } catch (error: any) {
      logger.error('Remove widget error:', error);

      if (error.message === 'Widget configuration not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }
}