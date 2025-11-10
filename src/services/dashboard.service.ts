import { DashboardWidget, Role, Permission, User } from '../db/models';
import { Op } from 'sequelize';
import logger from '../config/logger';
import { SaleService } from './sale.service';
import { CustomerService } from './customer.service';
import { InventoryService } from './inventory.service';
import { ProductService } from './product.service';
import { UserService } from './user.service';

export interface CreateWidgetData {
  tenantId?: string;
  storeId?: string;
  widgetKey: string;
  config: object;
  roles: string[];
  permissions: string[];
  position?: object;
}

export interface UpdateWidgetData {
  config?: object;
  roles?: string[];
  permissions?: string[];
  position?: object;
}

export interface WidgetWithConfig {
  id: string;
  tenantId?: string;
  storeId?: string;
  widgetKey: string;
  config: object;
  roles: string[];
  permissions: string[];
  position?: object;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetData {
  key: string;
  title: string;
  type: string;
  data: any;
  config?: object;
}

export interface DashboardData {
  widgets: WidgetData[];
  layout?: any;
}

export class DashboardService {
  // Available widget definitions
  private static readonly WIDGET_DEFINITIONS = {
    'sales-overview': {
      title: 'Sales Overview',
      type: 'chart',
      requiredPermissions: ['sales.view'],
    },
    'customer-stats': {
      title: 'Customer Statistics',
      type: 'stats',
      requiredPermissions: ['customers.view'],
    },
    'inventory-alerts': {
      title: 'Inventory Alerts',
      type: 'alerts',
      requiredPermissions: ['inventory.view'],
    },
    'top-products': {
      title: 'Top Products',
      type: 'list',
      requiredPermissions: ['products.view'],
    },
    'recent-sales': {
      title: 'Recent Sales',
      type: 'table',
      requiredPermissions: ['sales.view'],
    },
    'user-activity': {
      title: 'User Activity',
      type: 'chart',
      requiredPermissions: ['users.view'],
    },
    'revenue-trends': {
      title: 'Revenue Trends',
      type: 'chart',
      requiredPermissions: ['sales.view'],
    },
    'loyalty-overview': {
      title: 'Loyalty Program',
      type: 'stats',
      requiredPermissions: ['customers.view'],
    },
    'store-comparison': {
      title: 'Store Performance Comparison',
      type: 'chart',
      requiredPermissions: ['analytics:tenant_wide'],
    },
    'tenant-inventory-overview': {
      title: 'Tenant Inventory Overview',
      type: 'stats',
      requiredPermissions: ['inventory:view_all'],
    },
    'multi-store-sales-trends': {
      title: 'Multi-store Sales Trends',
      type: 'chart',
      requiredPermissions: ['analytics:tenant_wide'],
    },
    'inventory-transfer-summary': {
      title: 'Inventory Transfer Summary',
      type: 'stats',
      requiredPermissions: ['inventory_transfer:view'],
    },
  };

  /**
   * Get available widgets for a user based on their permissions
   */
  static async getAvailableWidgets(userId: string, tenantId: string, storeId?: string): Promise<string[]> {
    try {
      // Get user's roles and permissions
      const user = await User.findOne({
        where: { id: userId, tenantId },
        include: [
          {
            model: Role,
            as: 'roles',
            include: [
              {
                model: Permission,
                as: 'permissions',
              },
            ],
          },
        ],
      });

      if (!user) {
        return [];
      }

      const userPermissions = new Set<string>();
      user.roles?.forEach((role: any) => {
        role.permissions?.forEach((permission: any) => {
          userPermissions.add(permission.code);
        });
      });

      // Filter widgets based on permissions
      const availableWidgets: string[] = [];
      for (const [key, definition] of Object.entries(this.WIDGET_DEFINITIONS)) {
        const hasPermission = definition.requiredPermissions.some(perm =>
          userPermissions.has(perm)
        );
        if (hasPermission) {
          availableWidgets.push(key);
        }
      }

      return availableWidgets;
    } catch (error: any) {
      logger.error('Get available widgets error:', error);
      throw error;
    }
  }

  /**
   * Get user's dashboard configuration
   */
  static async getUserDashboard(userId: string, tenantId: string, storeId?: string): Promise<DashboardData> {
    try {
      // Get available widgets
      const availableWidgets = await this.getAvailableWidgets(userId, tenantId, storeId);

      // Get user's widget configurations
      const whereClause: any = { tenantId };
      if (storeId) {
        whereClause[Op.or] = [
          { storeId: null },
          { storeId },
        ];
      } else {
        whereClause.storeId = null;
      }

      const widgetConfigs = await DashboardWidget.findAll({
        where: whereClause,
      });

      // Build dashboard data
      const widgets: WidgetData[] = [];

      for (const widgetKey of availableWidgets) {
        const config = widgetConfigs.find(w => w.widgetKey === widgetKey);
        const definition = this.WIDGET_DEFINITIONS[widgetKey as keyof typeof this.WIDGET_DEFINITIONS];

        if (definition) {
          const data = await this.getWidgetData(widgetKey, tenantId, storeId, config?.config);

          widgets.push({
            key: widgetKey,
            title: definition.title,
            type: definition.type,
            data,
            config: config?.config || {},
          });
        }
      }

      return { widgets };
    } catch (error: any) {
      logger.error('Get user dashboard error:', error);
      throw error;
    }
  }

  /**
   * Get data for a specific widget
   */
  private static async getWidgetData(
    widgetKey: string,
    tenantId: string,
    storeId?: string,
    config?: any
  ): Promise<any> {
    try {
      switch (widgetKey) {
        case 'sales-overview':
          return await this.getSalesOverviewData(tenantId, storeId, config);

        case 'customer-stats':
          return await this.getCustomerStatsData(tenantId, config);

        case 'inventory-alerts':
          return await this.getInventoryAlertsData(tenantId, storeId, config);

        case 'top-products':
          return await this.getTopProductsData(tenantId, storeId, config);

        case 'recent-sales':
          return await this.getRecentSalesData(tenantId, storeId, config);

        case 'user-activity':
          return await this.getUserActivityData(tenantId, config);

        case 'revenue-trends':
          return await this.getRevenueTrendsData(tenantId, storeId, config);

        case 'loyalty-overview':
          return await this.getLoyaltyOverviewData(tenantId, config);

        // Multi-store and tenant-wide widgets
        case 'store-comparison':
          return await this.getStoreComparisonData(tenantId, config);

        case 'tenant-inventory-overview':
          return await this.getTenantInventoryOverviewData(tenantId, config);

        case 'multi-store-sales-trends':
          return await this.getMultiStoreSalesTrendsData(tenantId, config);

        case 'inventory-transfer-summary':
          return await this.getInventoryTransferSummaryData(tenantId, config);

        default:
          return null;
      }
    } catch (error: any) {
      logger.error(`Get widget data error for ${widgetKey}:`, error);
      return null;
    }
  }

  /**
   * Configure a widget for tenant/store
   */
  static async configureWidget(
    widgetData: CreateWidgetData
  ): Promise<WidgetWithConfig> {
    try {
      const widget = await DashboardWidget.create(widgetData);

      logger.info(`Configured widget ${widgetData.widgetKey} for tenant ${widgetData.tenantId}`);

      return this.formatWidgetResponse(widget);
    } catch (error: any) {
      logger.error('Configure widget error:', error);
      throw error;
    }
  }

  /**
   * Update widget configuration
   */
  static async updateWidgetConfig(
    widgetId: string,
    tenantId: string,
    updateData: UpdateWidgetData
  ): Promise<WidgetWithConfig | null> {
    try {
      const widget = await DashboardWidget.findOne({
        where: {
          id: widgetId,
          tenantId,
        },
      });

      if (!widget) {
        throw new Error('Widget configuration not found');
      }

      await widget.update(updateData);

      logger.info(`Updated widget configuration ${widget.widgetKey} for tenant ${tenantId}`);

      const updatedWidget = await DashboardWidget.findByPk(widgetId);
      return updatedWidget ? this.formatWidgetResponse(updatedWidget) : null;
    } catch (error: any) {
      logger.error('Update widget config error:', error);
      throw error;
    }
  }

  /**
   * Delete widget configuration
   */
  static async deleteWidgetConfig(widgetId: string, tenantId: string): Promise<boolean> {
    try {
      const widget = await DashboardWidget.findOne({
        where: {
          id: widgetId,
          tenantId,
        },
      });

      if (!widget) {
        throw new Error('Widget configuration not found');
      }

      await widget.destroy();

      logger.info(`Deleted widget configuration ${widget.widgetKey} for tenant ${tenantId}`);

      return true;
    } catch (error: any) {
      logger.error('Delete widget config error:', error);
      throw error;
    }
  }

  static async getWidgetConfigs(tenantId: string, storeId?: string): Promise<WidgetWithConfig[]> {
    try {
      const whereClause: any = { tenantId };
      if (storeId) {
        whereClause[Op.or] = [
          { storeId: null },
          { storeId },
        ];
      } else {
        whereClause.storeId = null;
      }

      const widgets = await DashboardWidget.findAll({
        where: whereClause,
        order: [['createdAt', 'ASC']],
      });

      return widgets.map(widget => this.formatWidgetResponse(widget));
    } catch (error: any) {
      logger.error('Get widget configs error:', error);
      throw error;
    }
  }

  // Widget data methods
  private static async getSalesOverviewData(tenantId: string, storeId?: string, config?: any): Promise<any> {
    const storeIdParam = storeId || config?.storeId;
    const stats = await SaleService.getSalesStats(storeIdParam, tenantId);
    return {
      totalSales: stats.totalSales,
      completedSales: stats.completedSales,
      totalRevenue: stats.totalRevenue,
      averageSaleValue: stats.averageSaleValue,
      paymentMethodStats: stats.paymentMethodStats,
    };
  }

  private static async getCustomerStatsData(tenantId: string, config?: any): Promise<any> {
    const stats = await CustomerService.getCustomerStats(tenantId);
    return stats;
  }

  private static async getInventoryAlertsData(tenantId: string, storeId?: string, config?: any): Promise<any> {
    const storeIdParam = storeId || config?.storeId;
    const stats = await InventoryService.getInventoryStats(storeIdParam, tenantId);
    return {
      totalItems: stats.totalItems,
      lowStockItems: stats.lowStockItems,
      outOfStockItems: stats.outOfStockItems,
      totalValue: stats.totalValue,
    };
  }

  private static async getTopProductsData(tenantId: string, storeId?: string, config?: any): Promise<any> {
    const limit = config?.limit || 10;
    // This would need to be implemented in ProductService
    // For now, return placeholder
    return {
      products: [],
      note: 'Top products data not yet implemented',
    };
  }

  private static async getRecentSalesData(tenantId: string, storeId?: string, config?: any): Promise<any> {
    const limit = config?.limit || 5;
    // This would need to be implemented in SaleService
    // For now, return placeholder
    return {
      sales: [],
      note: 'Recent sales data not yet implemented',
    };
  }

  private static async getUserActivityData(tenantId: string, config?: any): Promise<any> {
    const stats = await UserService.getUserStats(tenantId);
    return stats;
  }

  private static async getRevenueTrendsData(tenantId: string, storeId?: string, config?: any): Promise<any> {
    const days = config?.days || 30;
    // This would need to be implemented in SaleService
    // For now, return placeholder
    return {
      trends: [],
      note: 'Revenue trends data not yet implemented',
    };
  }

  private static async getLoyaltyOverviewData(tenantId: string, config?: any): Promise<any> {
    const stats = await CustomerService.getCustomerStats(tenantId);
    return {
      totalLoyaltyPoints: stats.totalLoyaltyPoints,
      averageSpent: stats.averageSpent,
      topSpenders: stats.topSpenders?.slice(0, 5),
    };
  }

  /**
   * Get store comparison data for dashboard
   */
  private static async getStoreComparisonData(tenantId: string, config?: any): Promise<any> {
    try {
      const startDate = config?.startDate ? new Date(config.startDate) : undefined;
      const endDate = config?.endDate ? new Date(config.endDate) : undefined;

      const comparisonData = await SaleService.compareStoreSales(tenantId, startDate, endDate);

      return {
        stores: comparisonData.map(store => ({
          storeId: store.storeId,
          totalSales: store.totalSales,
          totalRevenue: store.totalRevenue,
          averageSaleValue: store.averageSaleValue,
        })),
        period: {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error getting store comparison data:', error);
      return { stores: [], error: 'Failed to load store comparison data' };
    }
  }

  /**
   * Get tenant inventory overview data for dashboard
   */
  private static async getTenantInventoryOverviewData(tenantId: string, config?: any): Promise<any> {
    try {
      const stats = await InventoryService.getTenantInventoryStats(tenantId);

      return {
        totalItems: stats.totalItems,
        lowStockItems: stats.lowStockItems,
        outOfStockItems: stats.outOfStockItems,
        totalValue: stats.totalValue,
        expiringSoon: stats.expiringSoon,
        storeBreakdown: stats.storeBreakdown,
      };
    } catch (error) {
      logger.error('Error getting tenant inventory overview data:', error);
      return { error: 'Failed to load tenant inventory overview' };
    }
  }

  /**
   * Get multi-store sales trends data for dashboard
   */
  private static async getMultiStoreSalesTrendsData(tenantId: string, config?: any): Promise<any> {
    try {
      const days = config?.days || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trends = await SaleService.getTenantSalesTrends(tenantId, startDate);

      return {
        trends: trends.map(trend => ({
          date: trend.date,
          totalSales: trend.totalSales,
          totalRevenue: trend.totalRevenue,
        })),
        period: {
          days,
          startDate: startDate.toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error getting multi-store sales trends data:', error);
      return { trends: [], error: 'Failed to load sales trends data' };
    }
  }

  /**
   * Get inventory transfer summary data for dashboard
   */
  private static async getInventoryTransferSummaryData(tenantId: string, config?: any): Promise<any> {
    try {
      const { InventoryTransfer } = await import('../db/models');
      const { Op } = await import('sequelize');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const transfers = await InventoryTransfer.findAll({
        where: {
          tenantId,
          createdAt: { [Op.gte]: thirtyDaysAgo },
        },
        attributes: [
          'status',
          [InventoryTransfer.sequelize!.fn('COUNT', InventoryTransfer.sequelize!.col('id')), 'count'],
        ],
        group: ['status'],
        raw: true,
      });

      const transferStats = transfers.reduce((acc: any, transfer: any) => {
        acc[transfer.status] = parseInt(transfer.count);
        return acc;
      }, {});

      return {
        pending: transferStats.pending || 0,
        approved: transferStats.approved || 0,
        in_transit: transferStats.in_transit || 0,
        completed: transferStats.completed || 0,
        cancelled: transferStats.cancelled || 0,
        total: Object.values(transferStats).reduce((sum: number, count: any) => sum + count, 0),
        period: 'Last 30 days',
      };
    } catch (error) {
      logger.error('Error getting inventory transfer summary data:', error);
      return { error: 'Failed to load inventory transfer summary' };
    }
  }

  /**
   * Format widget response
   */
  private static formatWidgetResponse(widget: any): WidgetWithConfig {
    return {
      id: widget.id,
      tenantId: widget.tenantId,
      storeId: widget.storeId,
      widgetKey: widget.widgetKey,
      config: widget.config,
      roles: widget.roles,
      permissions: widget.permissions,
      position: widget.position,
      createdAt: widget.createdAt,
      updatedAt: widget.updatedAt,
    };
  }
}