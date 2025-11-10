import { Sale, Customer, Product, Inventory, User } from '../db/models';
import { Op, fn, col, literal } from 'sequelize';
import logger from '../config/logger';
import { SaleService } from './sale.service';
import { CustomerService } from './customer.service';
import { InventoryService } from './inventory.service';
import { ProductService } from './product.service';

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  storeId?: string;
  categoryId?: string;
  productId?: string;
  customerId?: string;
  userId?: string;
}

export interface SalesReport {
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalTax: number;
    totalDiscount: number;
    averageSaleValue: number;
    completedSales: number;
  };
  sales: any[];
  trends: {
    date: string;
    sales: number;
    revenue: number;
  }[];
  paymentMethods: {
    method: string;
    count: number;
    amount: number;
  }[];
}

export interface InventoryReport {
  summary: {
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    categories: {
      categoryId: string;
      categoryName: string;
      itemCount: number;
      totalValue: number;
    }[];
  };
  items: any[];
  alerts: {
    type: 'low_stock' | 'out_of_stock';
    productId: string;
    productName: string;
    currentStock: number;
    reorderPoint: number;
  }[];
}

export interface CustomerReport {
  summary: {
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    totalLoyaltyPoints: number;
    averageSpent: number;
  };
  customers: any[];
  topSpenders: any[];
  loyaltyStats: {
    pointsEarned: number;
    pointsRedeemed: number;
    averagePointsPerCustomer: number;
  };
}

export interface ProductReport {
  summary: {
    totalProducts: number;
    activeProducts: number;
    totalCategories: number;
    averagePrice: number;
  };
  products: any[];
  topSelling: {
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }[];
  categories: {
    categoryId: string;
    categoryName: string;
    productCount: number;
    totalRevenue: number;
  }[];
}

export class ReportService {
  /**
   * Generate sales report
   */
  static async generateSalesReport(tenantId: string, filters: ReportFilters = {}): Promise<SalesReport> {
    try {
      const { startDate, endDate, storeId } = filters;

      // Get sales statistics
      const stats = await SaleService.getSalesStats(storeId || '', tenantId, startDate, endDate);

      // Get sales data with details
      const salesData = await this.getSalesData(tenantId, filters);

      // Get sales trends
      const trends = await this.getSalesTrends(tenantId, filters);

      // Get payment method breakdown
      const paymentMethods = stats.paymentMethodStats || [];

      return {
        summary: {
          totalSales: stats.totalSales,
          totalRevenue: stats.totalRevenue,
          totalTax: stats.totalTax,
          totalDiscount: stats.totalDiscount,
          averageSaleValue: stats.averageSaleValue,
          completedSales: stats.completedSales,
        },
        sales: salesData,
        trends,
        paymentMethods,
      };
    } catch (error: any) {
      logger.error('Generate sales report error:', error);
      throw error;
    }
  }

  /**
   * Generate inventory report
   */
  static async generateInventoryReport(tenantId: string, filters: ReportFilters = {}): Promise<InventoryReport> {
    try {
      const { storeId } = filters;

      // Get inventory statistics
      const stats = await InventoryService.getInventoryStats(storeId || '', tenantId);

      // Get inventory items with details
      const items = await this.getInventoryData(tenantId, filters);

      // Get inventory alerts
      const alerts = await this.getInventoryAlerts(tenantId, filters);

      // Get category breakdown
      const categories = await this.getInventoryCategories(tenantId, filters);

      return {
        summary: {
          totalItems: stats.totalItems,
          totalValue: stats.totalValue,
          lowStockItems: stats.lowStockItems,
          outOfStockItems: stats.outOfStockItems,
          categories,
        },
        items,
        alerts,
      };
    } catch (error: any) {
      logger.error('Generate inventory report error:', error);
      throw error;
    }
  }

  /**
   * Generate customer report
   */
  static async generateCustomerReport(tenantId: string, filters: ReportFilters = {}): Promise<CustomerReport> {
    try {
      // Get customer statistics
      const stats = await CustomerService.getCustomerStats(tenantId);

      // Get customer data
      const customers = await this.getCustomerData(tenantId, filters);

      // Get top spenders
      const topSpenders = stats.topSpenders || [];

      // Get loyalty statistics
      const loyaltyStats = await this.getLoyaltyStats(tenantId, filters);

      return {
        summary: {
          totalCustomers: stats.totalCustomers,
          activeCustomers: stats.activeCustomers,
          newCustomers: stats.newCustomersThisMonth,
          totalLoyaltyPoints: stats.totalLoyaltyPoints,
          averageSpent: stats.averageSpent,
        },
        customers,
        topSpenders,
        loyaltyStats,
      };
    } catch (error: any) {
      logger.error('Generate customer report error:', error);
      throw error;
    }
  }

  /**
   * Generate product report
   */
  static async generateProductReport(tenantId: string, filters: ReportFilters = {}): Promise<ProductReport> {
    try {
      // Get product statistics
      const productStats = await ProductService.getProductStats(tenantId);

      // Get product data
      const products = await this.getProductData(tenantId, filters);

      // Get top selling products
      const topSelling = await this.getTopSellingProducts(tenantId, filters);

      // Get category performance
      const categories = await this.getCategoryPerformance(tenantId, filters);

      return {
        summary: {
          totalProducts: productStats.totalProducts,
          activeProducts: productStats.totalProducts, // Placeholder
          totalCategories: 0, // Placeholder
          averagePrice: 0, // Placeholder
        },
        products,
        topSelling,
        categories,
      };
    } catch (error: any) {
      logger.error('Generate product report error:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive business report
   */
  static async generateBusinessReport(tenantId: string, filters: ReportFilters = {}): Promise<any> {
    try {
      const [salesReport, inventoryReport, customerReport, productReport] = await Promise.all([
        this.generateSalesReport(tenantId, filters),
        this.generateInventoryReport(tenantId, filters),
        this.generateCustomerReport(tenantId, filters),
        this.generateProductReport(tenantId, filters),
      ]);

      return {
        period: {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
        sales: salesReport,
        inventory: inventoryReport,
        customers: customerReport,
        products: productReport,
        generatedAt: new Date(),
      };
    } catch (error: any) {
      logger.error('Generate business report error:', error);
      throw error;
    }
  }

  /**
   * Generate regional sales dashboard with multi-store analytics
   */
  static async generateRegionalSalesDashboard(tenantId: string, filters: ReportFilters = {}): Promise<any> {
    try {
      const { startDate, endDate } = filters;

      // Get sales data grouped by store
      const storeSales = await Sale.findAll({
        where: {
          tenantId,
          status: 'completed',
          ...(startDate && endDate && { saleDate: { [Op.between]: [startDate, endDate] } }),
        },
        attributes: [
          'storeId',
          [fn('COUNT', col('id')), 'totalSales'],
          [fn('SUM', col('totalAmount')), 'totalRevenue'],
          [fn('AVG', col('totalAmount')), 'averageSale'],
          [fn('MAX', col('saleDate')), 'lastSaleDate'],
        ],
        include: [
          {
            model: require('../db/models').Store,
            as: 'store',
            attributes: ['id', 'name', 'location'],
          },
        ],
        group: ['storeId', 'store.id', 'store.name', 'store.location'],
        raw: true,
      });

      // Get sales trends over time across all stores
      const salesTrends = await Sale.findAll({
        where: {
          tenantId,
          status: 'completed',
          ...(startDate && endDate && { saleDate: { [Op.between]: [startDate, endDate] } }),
        },
        attributes: [
          [fn('DATE', col('saleDate')), 'date'],
          [fn('COUNT', col('id')), 'totalSales'],
          [fn('SUM', col('totalAmount')), 'totalRevenue'],
        ],
        group: [fn('DATE', col('saleDate'))],
        order: [[fn('DATE', col('saleDate')), 'ASC']],
        raw: true,
      });

      // Calculate summary metrics
      const totalRevenue = storeSales.reduce((sum, store: any) => sum + parseFloat(store.totalRevenue || '0'), 0);
      const totalSales = storeSales.reduce((sum, store: any) => sum + parseInt(store.totalSales || '0'), 0);
      const averageSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

      return {
        period: {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
        summary: {
          totalStores: storeSales.length,
          totalRevenue,
          totalSales,
          averageSaleValue,
        },
        storePerformance: storeSales.map((store: any) => ({
          storeId: store.storeId,
          storeName: store['store.name'],
          location: store['store.location'],
          totalSales: parseInt(store.totalSales || '0'),
          totalRevenue: parseFloat(store.totalRevenue || '0'),
          averageSale: parseFloat(store.averageSale || '0'),
          lastSaleDate: store.lastSaleDate,
        })),
        trends: salesTrends.map((trend: any) => ({
          date: trend.date,
          totalSales: parseInt(trend.totalSales || '0'),
          totalRevenue: parseFloat(trend.totalRevenue || '0'),
        })),
        generatedAt: new Date(),
      };
    } catch (error: any) {
      logger.error('Generate regional sales dashboard error:', error);
      throw error;
    }
  }

  /**
   * Generate regional inventory dashboard
   */
  static async generateRegionalInventoryDashboard(tenantId: string, filters: ReportFilters = {}): Promise<any> {
    try {
      // Get inventory data grouped by store
      const storeInventory = await Inventory.findAll({
        where: { tenantId },
        attributes: [
          'storeId',
          [fn('COUNT', col('id')), 'totalProducts'],
          [fn('SUM', literal('quantity_available * (SELECT unit_cost FROM products WHERE products.id = inventories.product_id)')), 'totalValue'],
          [fn('SUM', col('quantityAvailable')), 'totalQuantity'],
        ],
        include: [
          {
            model: require('../db/models').Store,
            as: 'store',
            attributes: ['id', 'name', 'location'],
          },
        ],
        group: ['storeId', 'store.id', 'store.name', 'store.location'],
        raw: true,
      });

      // Get low stock alerts across all stores
      const lowStockAlerts = await Inventory.findAll({
        where: {
          tenantId,
          [Op.and]: [
            literal('quantity_available <= reorder_point'),
            literal('quantity_available > 0'),
          ],
        },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku'],
          },
          {
            model: require('../db/models').Store,
            as: 'store',
            attributes: ['id', 'name'],
          },
        ],
        order: [['quantityAvailable', 'ASC']],
        limit: 50,
      });

      // Get out of stock items
      const outOfStockItems = await Inventory.findAll({
        where: {
          tenantId,
          quantityAvailable: { [Op.lte]: 0 },
        },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku'],
          },
          {
            model: require('../db/models').Store,
            as: 'store',
            attributes: ['id', 'name'],
          },
        ],
        limit: 50,
      });

      const totalValue = storeInventory.reduce((sum, store: any) => sum + parseFloat(store.totalValue || '0'), 0);
      const totalProducts = storeInventory.reduce((sum, store: any) => sum + parseInt(store.totalProducts || '0'), 0);

      return {
        summary: {
          totalStores: storeInventory.length,
          totalValue,
          totalProducts,
          lowStockAlerts: lowStockAlerts.length,
          outOfStockItems: outOfStockItems.length,
        },
        storeInventory: storeInventory.map((store: any) => ({
          storeId: store.storeId,
          storeName: store['store.name'],
          location: store['store.location'],
          totalProducts: parseInt(store.totalProducts || '0'),
          totalValue: parseFloat(store.totalValue || '0'),
          totalQuantity: parseInt(store.totalQuantity || '0'),
        })),
        alerts: {
          lowStock: lowStockAlerts.map(item => ({
            productId: item.productId,
            productName: item.product?.name,
            sku: item.product?.sku,
            storeId: item.storeId,
            storeName: item.store?.name,
            currentStock: item.quantityAvailable,
            reorderPoint: item.reorderPoint,
          })),
          outOfStock: outOfStockItems.map(item => ({
            productId: item.productId,
            productName: item.product?.name,
            sku: item.product?.sku,
            storeId: item.storeId,
            storeName: item.store?.name,
            currentStock: item.quantityAvailable,
            reorderPoint: item.reorderPoint,
          })),
        },
        generatedAt: new Date(),
      };
    } catch (error: any) {
      logger.error('Generate regional inventory dashboard error:', error);
      throw error;
    }
  }

  /**
   * Generate regional performance dashboard
   */
  static async generateRegionalPerformanceDashboard(tenantId: string, filters: ReportFilters = {}): Promise<any> {
    try {
      const { startDate, endDate } = filters;

      // Get comprehensive performance metrics by store
      const storePerformance = await Sale.findAll({
        where: {
          tenantId,
          status: 'completed',
          ...(startDate && endDate && { saleDate: { [Op.between]: [startDate, endDate] } }),
        },
        attributes: [
          'storeId',
          [fn('COUNT', col('id')), 'totalSales'],
          [fn('SUM', col('totalAmount')), 'totalRevenue'],
          [fn('SUM', col('taxAmount')), 'totalTax'],
          [fn('SUM', col('discountAmount')), 'totalDiscounts'],
          [fn('AVG', col('totalAmount')), 'averageSaleValue'],
          [fn('COUNT', literal('DISTINCT customer_id')), 'uniqueCustomers'],
        ],
        include: [
          {
            model: require('../db/models').Store,
            as: 'store',
            attributes: ['id', 'name', 'location'],
          },
        ],
        group: ['storeId', 'store.id', 'store.name', 'store.location'],
        raw: true,
      });

      // Get customer metrics by store
      const customerMetrics = await Customer.findAll({
        where: { tenantId },
        attributes: [
          'storeId',
          [fn('COUNT', col('id')), 'totalCustomers'],
          [fn('AVG', col('totalSpent')), 'averageSpent'],
          [fn('SUM', col('loyaltyPoints')), 'totalLoyaltyPoints'],
          [fn('COUNT', literal('CASE WHEN total_spent > 0 THEN 1 END')), 'activeCustomers'],
        ],
        include: [
          {
            model: require('../db/models').Store,
            as: 'store',
            attributes: ['id', 'name'],
          },
        ],
        group: ['storeId', 'store.id', 'store.name'],
        raw: true,
      });

      // Calculate profitability (revenue - cost of goods sold approximation)
      // This would need more complex calculations in a real implementation
      const performanceWithProfitability = storePerformance.map((store: any) => {
        const revenue = parseFloat(store.totalRevenue || '0');
        const tax = parseFloat(store.totalTax || '0');
        const discounts = parseFloat(store.totalDiscounts || '0');
        const netRevenue = revenue - tax - discounts;

        // Simplified COGS calculation (would need actual cost data)
        const estimatedCOGS = netRevenue * 0.6; // Assume 60% COGS
        const estimatedProfit = netRevenue - estimatedCOGS;
        const profitMargin = netRevenue > 0 ? (estimatedProfit / netRevenue) * 100 : 0;

        return {
          storeId: store.storeId,
          storeName: store['store.name'],
          location: store['store.location'],
          sales: {
            totalSales: parseInt(store.totalSales || '0'),
            totalRevenue: revenue,
            netRevenue,
            averageSaleValue: parseFloat(store.averageSaleValue || '0'),
            totalTax: tax,
            totalDiscounts: discounts,
          },
          customers: {
            uniqueCustomers: parseInt(store.uniqueCustomers || '0'),
          },
          profitability: {
            estimatedCOGS,
            estimatedProfit,
            profitMargin: Math.round(profitMargin * 100) / 100,
          },
        };
      });

      return {
        period: {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
        summary: {
          totalStores: storePerformance.length,
          totalRevenue: performanceWithProfitability.reduce((sum, store) => sum + store.sales.totalRevenue, 0),
          totalProfit: performanceWithProfitability.reduce((sum, store) => sum + store.profitability.estimatedProfit, 0),
          averageProfitMargin: performanceWithProfitability.length > 0
            ? performanceWithProfitability.reduce((sum, store) => sum + store.profitability.profitMargin, 0) / performanceWithProfitability.length
            : 0,
        },
        storePerformance: performanceWithProfitability,
        customerMetrics: customerMetrics.map((metric: any) => ({
          storeId: metric.storeId,
          storeName: metric['store.name'],
          totalCustomers: parseInt(metric.totalCustomers || '0'),
          activeCustomers: parseInt(metric.activeCustomers || '0'),
          averageSpent: parseFloat(metric.averageSpent || '0'),
          totalLoyaltyPoints: parseInt(metric.totalLoyaltyPoints || '0'),
        })),
        generatedAt: new Date(),
      };
    } catch (error: any) {
      logger.error('Generate regional performance dashboard error:', error);
      throw error;
    }
  }

  // Helper methods for data retrieval
  private static async getSalesData(tenantId: string, filters: ReportFilters): Promise<any[]> {
    const { startDate, endDate, storeId, customerId, userId } = filters;

    const whereClause: any = {
      tenantId,
      status: 'completed',
    };

    if (startDate || endDate) {
      whereClause.saleDate = {};
      if (startDate) whereClause.saleDate[Op.gte] = startDate;
      if (endDate) whereClause.saleDate[Op.lte] = endDate;
    }

    if (storeId) whereClause.storeId = storeId;
    if (customerId) whereClause.customerId = customerId;
    if (userId) whereClause.userId = userId;

    const sales = await Sale.findAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [['saleDate', 'DESC']],
      limit: 100, // Limit for performance
    });

    return sales.map(sale => ({
      id: sale.id,
      saleDate: sale.saleDate,
      totalAmount: parseFloat(sale.totalAmount.toString()),
      taxAmount: parseFloat(sale.taxAmount.toString()),
      discountAmount: parseFloat(sale.discountAmount.toString()),
      customer: sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName}` : null,
      user: sale.user ? `${sale.user.firstName} ${sale.user.lastName}` : null,
    }));
  }

  private static async getSalesTrends(tenantId: string, filters: ReportFilters): Promise<any[]> {
    const { startDate, endDate, storeId } = filters;

    const dateRange = startDate && endDate ? { [Op.between]: [startDate, endDate] } : {};

    const trends = await Sale.findAll({
      where: {
        tenantId,
        status: 'completed',
        ...(storeId && { storeId }),
        ...(Object.keys(dateRange).length > 0 && { saleDate: dateRange }),
      },
      attributes: [
        [fn('DATE', col('saleDate')), 'date'],
        [fn('COUNT', col('id')), 'sales'],
        [fn('SUM', col('totalAmount')), 'revenue'],
      ],
      group: [fn('DATE', col('saleDate'))],
      order: [[fn('DATE', col('saleDate')), 'ASC']],
      raw: true,
    });

    return trends.map((trend: any) => ({
      date: trend.date,
      sales: parseInt(trend.sales.toString()),
      revenue: parseFloat(trend.revenue.toString()),
    }));
  }

  private static async getInventoryData(tenantId: string, filters: ReportFilters): Promise<any[]> {
    const { storeId, categoryId } = filters;

    const whereClause: any = { tenantId };
    if (storeId) whereClause.storeId = storeId;

    const inventories = await Inventory.findAll({
      where: whereClause,
      include: [
        {
          model: Product,
          as: 'product',
          where: categoryId ? { categoryId } : {},
          required: !!categoryId,
          attributes: ['id', 'name', 'sku', 'unitCost'],
        },
      ],
      order: [['product.name', 'ASC']],
    });

    return inventories.map(inv => ({
      productId: inv.productId,
      productName: inv.product?.name,
      sku: inv.product?.sku,
      quantityAvailable: inv.quantityAvailable,
      quantityReserved: inv.quantityReserved,
      reorderPoint: inv.reorderPoint,
      unitCost: parseFloat(inv.product?.unitCost?.toString() || '0'),
      totalValue: inv.quantityAvailable * parseFloat(inv.product?.unitCost?.toString() || '0'),
    }));
  }

  private static async getInventoryAlerts(tenantId: string, filters: ReportFilters): Promise<any[]> {
    const { storeId } = filters;

    const whereClause: any = { tenantId };
    if (storeId) whereClause.storeId = storeId;

    // Low stock items
    const lowStockItems = await Inventory.findAll({
      where: {
        ...whereClause,
        [Op.and]: [
          literal('quantity_available <= reorder_point'),
          literal('quantity_available > 0'),
        ],
      },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name'],
        },
      ],
    });

    // Out of stock items
    const outOfStockItems = await Inventory.findAll({
      where: {
        ...whereClause,
        quantityAvailable: { [Op.lte]: 0 },
      },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name'],
        },
      ],
    });

    const alerts: any[] = [];

    lowStockItems.forEach(item => {
      alerts.push({
        type: 'low_stock',
        productId: item.productId,
        productName: item.product?.name,
        currentStock: item.quantityAvailable,
        reorderPoint: item.reorderPoint,
      });
    });

    outOfStockItems.forEach(item => {
      alerts.push({
        type: 'out_of_stock',
        productId: item.productId,
        productName: item.product?.name,
        currentStock: item.quantityAvailable,
        reorderPoint: item.reorderPoint,
      });
    });

    return alerts;
  }

  private static async getInventoryCategories(tenantId: string, filters: ReportFilters): Promise<any[]> {
    const { storeId } = filters;

    // This would require joining with categories through products
    // For now, return placeholder
    return [];
  }

  private static async getCustomerData(tenantId: string, filters: ReportFilters): Promise<any[]> {
    const customers = await Customer.findAll({
      where: { tenantId },
      attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'totalSpent', 'loyaltyPoints', 'createdAt'],
      order: [['totalSpent', 'DESC']],
      limit: 100,
    });

    return customers.map(customer => ({
      id: customer.id,
      name: `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
      phone: customer.phone,
      totalSpent: parseFloat(customer.totalSpent.toString()),
      loyaltyPoints: customer.loyaltyPoints,
      joinedAt: customer.createdAt,
    }));
  }

  private static async getLoyaltyStats(tenantId: string, filters: ReportFilters): Promise<any> {
    const customers = await Customer.findAll({
      where: { tenantId },
      attributes: ['loyaltyPoints', 'totalSpent'],
    });

    const totalPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);
    const averagePoints = customers.length > 0 ? totalPoints / customers.length : 0;

    return {
      pointsEarned: totalPoints, // This would need audit logs to track properly
      pointsRedeemed: 0, // Placeholder
      averagePointsPerCustomer: averagePoints,
    };
  }

  private static async getProductData(tenantId: string, filters: ReportFilters): Promise<any[]> {
    const products = await Product.findAll({
      where: { tenantId },
      attributes: ['id', 'name', 'sku', 'description'],
      order: [['name', 'ASC']],
      limit: 100,
    });

    return products.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
    }));
  }

  private static async getTopSellingProducts(tenantId: string, filters: ReportFilters): Promise<any[]> {
    // This would require aggregating sale items
    // For now, return placeholder
    return [];
  }

  private static async getCategoryPerformance(tenantId: string, filters: ReportFilters): Promise<any[]> {
    // This would require joining products and sale items
    // For now, return placeholder
    return [];
  }
}