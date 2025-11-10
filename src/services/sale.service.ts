import { Sale, SaleItem, Payment, Product, Customer, User } from '../db/models';
import { InventoryService } from './inventory.service';
import { Op, Transaction, fn, col } from 'sequelize';
import logger from '../config/logger';

export interface CreateSaleData {
  tenantId: string;
  storeId: string;
  customerId?: string;
  userId: string;
  saleItems: CreateSaleItemData[];
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
}

export interface CreateSaleItemData {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
}

export interface UpdateSaleData {
  customerId?: string;
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
}

export interface ProcessPaymentData {
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'digital_wallet' | 'check' | 'gift_card' | 'loyalty_points';
  amount: number;
  referenceNumber?: string;
  transactionId?: string;
  notes?: string;
}

export interface SaleWithDetails {
  id: string;
  tenantId: string;
  storeId: string;
  customerId?: string | undefined;
  userId: string;
  saleNumber: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'partially_paid' | 'refunded';
  notes?: string | undefined;
  saleDate: Date;
  customer?: {
    id: string;
    name: string;
    email?: string | undefined;
    phone?: string | undefined;
  } | undefined;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  saleItems?: SaleItemWithProduct[] | undefined;
  payments?: PaymentDetails[] | undefined;
  totalPaid: number;
  balanceDue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItemWithProduct {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string | undefined;
  product?: {
    id: string;
    name: string;
    sku?: string | undefined;
    barcode?: string | undefined;
  } | undefined;
}

export interface PaymentDetails {
  id: string;
  paymentMethod: string;
  amount: number;
  referenceNumber?: string;
  transactionId?: string;
  paymentDate: Date;
  status: string;
  notes?: string;
  processedBy: string;
}

export class SaleService {
  /**
   * Generate a unique sale number
   */
  private static async generateSaleNumber(tenantId: string, storeId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const storePrefix = storeId.slice(0, 4).toUpperCase();

    let counter = 1;
    let saleNumber: string;

    do {
      saleNumber = `${storePrefix}-${dateStr}-${counter.toString().padStart(4, '0')}`;
      const existingSale = await Sale.findOne({
        where: { tenantId, saleNumber },
      });
      if (!existingSale) break;
      counter++;
    } while (counter < 10000);

    return saleNumber;
  }

  /**
   * Create a new sale transaction
   */
  static async createSale(saleData: CreateSaleData): Promise<SaleWithDetails> {
    const transaction = await Sale.sequelize!.transaction();

    try {
      // Validate customer if provided
      if (saleData.customerId) {
        const customer = await Customer.findOne({
          where: { id: saleData.customerId, tenantId: saleData.tenantId },
          transaction,
        });
        if (!customer) {
          throw new Error('Customer not found');
        }
      }

      // Validate user
      const user = await User.findOne({
        where: { id: saleData.userId, tenantId: saleData.tenantId },
        transaction,
      });
      if (!user) {
        throw new Error('User not found');
      }

      // Generate sale number
      const saleNumber = await this.generateSaleNumber(saleData.tenantId, saleData.storeId);

      // Calculate totals
      let subtotal = 0;
      let totalTax = saleData.taxAmount || 0;
      let totalDiscount = saleData.discountAmount || 0;

      // Validate products and calculate item totals
      for (const item of saleData.saleItems) {
        const product = await Product.findOne({
          where: { id: item.productId, tenantId: saleData.tenantId },
          transaction,
        });

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        // Check inventory availability
        const inventory = await InventoryService.getInventoryByProduct(item.productId, saleData.storeId, saleData.tenantId);
        if (!inventory || inventory.quantityAvailable < item.quantity) {
          throw new Error(`Insufficient inventory for product ${product.name}`);
        }

        const itemTotal = (item.unitPrice * item.quantity) - (item.discountAmount || 0) + (item.taxAmount || 0);
        subtotal += itemTotal;
      }

      const totalAmount = subtotal + totalTax - totalDiscount;

      // Create sale
      const saleCreateData: any = {
        tenantId: saleData.tenantId,
        storeId: saleData.storeId,
        userId: saleData.userId,
        saleNumber,
        status: 'pending',
        subtotal,
        taxAmount: totalTax,
        discountAmount: totalDiscount,
        totalAmount,
        paymentStatus: 'pending',
        saleDate: new Date(),
      };

      if (saleData.customerId) {
        saleCreateData.customerId = saleData.customerId;
      }

      if (saleData.notes) {
        saleCreateData.notes = saleData.notes;
      }

      const sale = await Sale.create(saleCreateData, { transaction });

      // Create sale items and reserve inventory
      const saleItems: SaleItemWithProduct[] = [];
      for (const itemData of saleData.saleItems) {
        const itemTotal = (itemData.unitPrice * itemData.quantity) - (itemData.discountAmount || 0) + (itemData.taxAmount || 0);

        const saleItemData: any = {
          tenantId: saleData.tenantId,
          saleId: sale.id,
          productId: itemData.productId,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          discountAmount: itemData.discountAmount || 0,
          taxAmount: itemData.taxAmount || 0,
          totalAmount: itemTotal,
        };

        if (itemData.notes) {
          saleItemData.notes = itemData.notes;
        }

        const saleItem = await SaleItem.create(saleItemData, { transaction });

        // Reserve inventory
        await InventoryService.reserveInventory(saleData.storeId, saleData.tenantId, itemData.productId, itemData.quantity);

        const product = await Product.findByPk(itemData.productId, { transaction });
        saleItems.push({
          id: saleItem.id,
          productId: saleItem.productId,
          quantity: parseFloat(saleItem.quantity.toString()),
          unitPrice: parseFloat(saleItem.unitPrice.toString()),
          discountAmount: parseFloat(saleItem.discountAmount.toString()),
          taxAmount: parseFloat(saleItem.taxAmount.toString()),
          totalAmount: parseFloat(saleItem.totalAmount.toString()),
          notes: saleItem.notes,
          product: product ? {
            id: product.id,
            name: product.name,
            sku: product.sku || undefined,
            barcode: product.barcode || undefined,
          } : undefined,
        });
      }

      await transaction.commit();

      logger.info(`Sale created: ${saleNumber} for tenant ${saleData.tenantId}, store ${saleData.storeId}`);

      const result = await this.getSaleById(sale.id, saleData.tenantId);
      return result!;
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Error creating sale:', error);
      throw error;
    }
  }

  /**
   * Get sale by ID with full details
   */
  static async getSaleById(saleId: string, tenantId: string): Promise<SaleWithDetails | null> {
    try {
      const sale = await Sale.findOne({
        where: { id: saleId, tenantId },
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'email', 'phone'],
            required: false,
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
            required: true,
          },
          {
            model: SaleItem,
            as: 'saleItems',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'sku', 'barcode'],
                required: true,
              },
            ],
            required: false,
          },
          {
            model: Payment,
            as: 'payments',
            attributes: ['id', 'paymentMethod', 'amount', 'referenceNumber', 'transactionId', 'paymentDate', 'status', 'notes', 'processedBy'],
            required: false,
          },
        ],
      });

      if (!sale) {
        return null;
      }

      // Calculate total paid and balance due
      const payments = sale.payments || [];
      const totalPaid = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

      const totalAmount = parseFloat(sale.totalAmount.toString());
      const balanceDue = totalAmount - totalPaid;

      return {
        id: sale.id,
        tenantId: sale.tenantId,
        storeId: sale.storeId,
        customerId: sale.customerId || undefined,
        userId: sale.userId,
        saleNumber: sale.saleNumber,
        status: sale.status,
        subtotal: parseFloat(sale.subtotal.toString()),
        taxAmount: parseFloat(sale.taxAmount.toString()),
        discountAmount: parseFloat(sale.discountAmount.toString()),
        totalAmount,
        paymentStatus: sale.paymentStatus,
        notes: sale.notes || undefined,
        saleDate: sale.saleDate,
        customer: sale.customer ? {
          id: sale.customer.id,
          name: sale.customer.name,
          email: sale.customer.email || undefined,
          phone: sale.customer.phone || undefined,
        } : undefined,
        user: {
          id: sale.user.id,
          name: sale.user.name,
          email: sale.user.email,
        },
        saleItems: sale.saleItems?.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: parseFloat(item.quantity.toString()),
          unitPrice: parseFloat(item.unitPrice.toString()),
          discountAmount: parseFloat(item.discountAmount.toString()),
          taxAmount: parseFloat(item.taxAmount.toString()),
          totalAmount: parseFloat(item.totalAmount.toString()),
          notes: item.notes || undefined,
          product: item.product ? {
            id: item.product.id,
            name: item.product.name,
            sku: item.product.sku || undefined,
            barcode: item.product.barcode || undefined,
          } : undefined,
        })) as SaleItemWithProduct[],
        payments: payments.map(payment => ({
          id: payment.id,
          paymentMethod: payment.paymentMethod,
          amount: parseFloat(payment.amount.toString()),
          referenceNumber: payment.referenceNumber || undefined,
          transactionId: payment.transactionId || undefined,
          paymentDate: payment.paymentDate,
          status: payment.status,
          notes: payment.notes || undefined,
          processedBy: payment.processedBy,
        })),
        totalPaid,
        balanceDue,
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt,
      };
    } catch (error) {
      logger.error('Error getting sale by ID:', error);
      throw new Error('Failed to retrieve sale');
    }
  }

  /**
   * Get sales for a store with pagination
   */
  static async getStoreSales(
    storeId: string,
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
    paymentStatus?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ sales: SaleWithDetails[]; total: number; page: number; limit: number; totalPages: number }> {
    try {
      const offset = (page - 1) * limit;
      const whereClause: any = { storeId, tenantId };

      if (status) {
        whereClause.status = status;
      }

      if (paymentStatus) {
        whereClause.paymentStatus = paymentStatus;
      }

      if (startDate || endDate) {
        whereClause.saleDate = {};
        if (startDate) whereClause.saleDate[Op.gte] = startDate;
        if (endDate) whereClause.saleDate[Op.lte] = endDate;
      }

      const { count, rows } = await Sale.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'email', 'phone'],
            required: false,
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
            required: true,
          },
        ],
        order: [['saleDate', 'DESC']],
        limit,
        offset,
      });

      const sales = await Promise.all(
        rows.map(async (sale) => {
          const fullSale = await this.getSaleById(sale.id, tenantId);
          return fullSale!;
        })
      );

      return {
        sales,
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error('Error getting store sales:', error);
      throw new Error('Failed to retrieve sales');
    }
  }

  /**
   * Update sale details (only for pending sales)
   */
  static async updateSale(saleId: string, tenantId: string, updateData: UpdateSaleData): Promise<SaleWithDetails | null> {
    try {
      const sale = await Sale.findOne({
        where: { id: saleId, tenantId, status: 'pending' },
      });

      if (!sale) {
        throw new Error('Sale not found or not in pending status');
      }

      // Validate customer if provided
      if (updateData.customerId) {
        const customer = await Customer.findOne({
          where: { id: updateData.customerId, tenantId },
        });
        if (!customer) {
          throw new Error('Customer not found');
        }
      }

      await Sale.update(updateData, {
        where: { id: saleId, tenantId },
      });

      logger.info(`Sale updated: ${saleId} for tenant ${tenantId}`);
      const updatedSale = await this.getSaleById(saleId, tenantId);
      return updatedSale;
    } catch (error: any) {
      logger.error('Error updating sale:', error);
      throw error;
    }
  }

  /**
   * Process payment for a sale
   */
  static async processPayment(saleId: string, tenantId: string, paymentData: ProcessPaymentData, processedBy: string): Promise<SaleWithDetails> {
    const transaction = await Sale.sequelize!.transaction();

    try {
      const sale = await Sale.findOne({
        where: { id: saleId, tenantId },
        include: [
          {
            model: Payment,
            as: 'payments',
            where: { status: 'completed' },
            required: false,
          },
        ],
        transaction,
        lock: Transaction.LOCK.UPDATE,
      });

      if (!sale) {
        throw new Error('Sale not found');
      }

      if (sale.status === 'cancelled' || sale.status === 'refunded') {
        throw new Error('Cannot process payment for cancelled or refunded sale');
      }

      // Calculate current total paid
      const currentPayments = sale.payments || [];
      const totalPaid = currentPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
      const totalAmount = parseFloat(sale.totalAmount.toString());

      if (totalPaid + paymentData.amount > totalAmount) {
        throw new Error('Payment amount exceeds outstanding balance');
      }

      // Create payment record
      const paymentCreateData: any = {
        tenantId,
        saleId,
        paymentMethod: paymentData.paymentMethod,
        amount: paymentData.amount,
        paymentDate: new Date(),
        status: 'completed',
        processedBy,
      };

      if (paymentData.referenceNumber) {
        paymentCreateData.referenceNumber = paymentData.referenceNumber;
      }

      if (paymentData.transactionId) {
        paymentCreateData.transactionId = paymentData.transactionId;
      }

      if (paymentData.notes) {
        paymentCreateData.notes = paymentData.notes;
      }

      const payment = await Payment.create(paymentCreateData, { transaction });

      // Update sale payment status
      const newTotalPaid = totalPaid + paymentData.amount;
      let newPaymentStatus: 'pending' | 'paid' | 'partially_paid' | 'refunded';

      if (newTotalPaid >= totalAmount) {
        newPaymentStatus = 'paid';
        // If fully paid and sale is pending, complete it
        if (sale.status === 'pending') {
          await Sale.update(
            { status: 'completed' as const, paymentStatus: newPaymentStatus },
            { where: { id: saleId, tenantId }, transaction }
          );
        } else {
          await Sale.update(
            { paymentStatus: newPaymentStatus },
            { where: { id: saleId, tenantId }, transaction }
          );
        }
      } else {
        newPaymentStatus = 'partially_paid';
        await Sale.update(
          { paymentStatus: newPaymentStatus },
          { where: { id: saleId, tenantId }, transaction }
        );
      }

      await transaction.commit();

      logger.info(`Payment processed: ${paymentData.amount} for sale ${saleId} via ${paymentData.paymentMethod}`);
      const result = await this.getSaleById(saleId, tenantId);
      return result!;
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Complete a sale (finalize transaction)
   */
  static async completeSale(saleId: string, tenantId: string): Promise<SaleWithDetails> {
    const transaction = await Sale.sequelize!.transaction();

    try {
      const sale = await Sale.findOne({
        where: { id: saleId, tenantId, status: 'pending' },
        include: [
          {
            model: SaleItem,
            as: 'saleItems',
            required: false,
          },
        ],
        transaction,
        lock: Transaction.LOCK.UPDATE,
      });

      if (!sale) {
        throw new Error('Sale not found or not in pending status');
      }

      // Convert reserved inventory to actual sales
      if (sale.saleItems) {
        for (const item of sale.saleItems) {
          await InventoryService.adjustInventory(sale.storeId, tenantId, {
            productId: item.productId,
            quantity: -parseFloat(item.quantity.toString()),
            reason: 'sale',
            reference: saleId,
          });
        }
      }

      await Sale.update(
        { status: 'completed' as const },
        { where: { id: saleId, tenantId }, transaction }
      );

      await transaction.commit();

      logger.info(`Sale completed: ${saleId} for tenant ${tenantId}`);
      const result = await this.getSaleById(saleId, tenantId);
      return result!;
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Error completing sale:', error);
      throw error;
    }
  }

  /**
   * Cancel a sale (only pending sales)
   */
  static async cancelSale(saleId: string, tenantId: string): Promise<SaleWithDetails> {
    const transaction = await Sale.sequelize!.transaction();

    try {
      const sale = await Sale.findOne({
        where: { id: saleId, tenantId, status: 'pending' },
        include: [
          {
            model: SaleItem,
            as: 'saleItems',
            required: false,
          },
        ],
        transaction,
        lock: Transaction.LOCK.UPDATE,
      });

      if (!sale) {
        throw new Error('Sale not found or not in pending status');
      }

      // Release reserved inventory
      if (sale.saleItems) {
        for (const item of sale.saleItems) {
          await InventoryService.releaseReservedInventory(
            sale.storeId,
            tenantId,
            item.productId,
            parseFloat(item.quantity.toString())
          );
        }
      }

      await Sale.update(
        { status: 'cancelled' as const, paymentStatus: 'pending' as const },
        { where: { id: saleId, tenantId }, transaction }
      );

      await transaction.commit();

      logger.info(`Sale cancelled: ${saleId} for tenant ${tenantId}`);
      const result = await this.getSaleById(saleId, tenantId);
      return result!;
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Error cancelling sale:', error);
      throw error;
    }
  }

  /**
   * Process refund for a sale
   */
  static async processRefund(saleId: string, tenantId: string, refundAmount: number, reason: string, processedBy: string): Promise<SaleWithDetails> {
    const transaction = await Sale.sequelize!.transaction();

    try {
      const sale = await Sale.findOne({
        where: { id: saleId, tenantId, status: 'completed' },
        include: [
          {
            model: Payment,
            as: 'payments',
            where: { status: 'completed' },
            required: false,
          },
          {
            model: SaleItem,
            as: 'saleItems',
            required: false,
          },
        ],
        transaction,
        lock: Transaction.LOCK.UPDATE,
      });

      if (!sale) {
        throw new Error('Sale not found or not in completed status');
      }

      const totalPaid = (sale.payments || []).reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
      const totalAmount = parseFloat(sale.totalAmount.toString());

      if (refundAmount > totalPaid) {
        throw new Error('Refund amount cannot exceed total paid amount');
      }

      // Create refund payment record
      const refundPayment = await Payment.create({
        tenantId,
        saleId,
        paymentMethod: 'cash', // Default to cash for refunds
        amount: -refundAmount, // Negative amount for refund
        paymentDate: new Date(),
        status: 'completed',
        notes: `Refund: ${reason}`,
        processedBy,
      }, { transaction });

      // Update sale status
      const newTotalPaid = totalPaid - refundAmount;
      let newPaymentStatus: string;
      let newSaleStatus: string;

      if (newTotalPaid <= 0) {
        newPaymentStatus = 'refunded';
        newSaleStatus = 'refunded';
      } else {
        newPaymentStatus = 'partially_paid';
        newSaleStatus = 'completed';
      }

      await Sale.update(
        { status: newSaleStatus as 'completed' | 'refunded', paymentStatus: newPaymentStatus as 'pending' | 'paid' | 'partially_paid' | 'refunded' },
        { where: { id: saleId, tenantId }, transaction }
      );

      // Return inventory if applicable (partial refunds might need proportional returns)
      // This is a simplified implementation - in practice, you'd need to specify which items to return
      if (sale.saleItems && refundAmount === totalAmount) {
        for (const item of sale.saleItems) {
          await InventoryService.adjustInventory(sale.storeId, tenantId, {
            productId: item.productId,
            quantity: parseFloat(item.quantity.toString()),
            reason: 'return',
            reference: saleId,
          });
        }
      }

      await transaction.commit();

      logger.info(`Refund processed: ${refundAmount} for sale ${saleId}, reason: ${reason}`);
      const result = await this.getSaleById(saleId, tenantId);
      return result!;
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Get sales statistics for a store
   */
  static async getSalesStats(storeId: string, tenantId: string, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const dateFilter: any = {};
      if (startDate || endDate) {
        if (startDate) dateFilter[Op.gte] = startDate;
        if (endDate) dateFilter[Op.lte] = endDate;
      }

      const whereClause = {
        storeId,
        tenantId,
        ...(Object.keys(dateFilter).length > 0 && { saleDate: dateFilter }),
      };

      const totalSales = await Sale.count({ where: whereClause });

      const completedSales = await Sale.count({
        where: { ...whereClause, status: 'completed' },
      });

      const totalRevenue = await Sale.sum('totalAmount', {
        where: { ...whereClause, status: 'completed' },
      });

      const totalTax = await Sale.sum('taxAmount', {
        where: { ...whereClause, status: 'completed' },
      });

      const totalDiscount = await Sale.sum('discountAmount', {
        where: { ...whereClause, status: 'completed' },
      });

      const paymentMethodStats = await Payment.findAll({
        attributes: [
          'paymentMethod',
          [Sale.sequelize!.fn('SUM', Sale.sequelize!.col('Payment.amount')), 'totalAmount'],
          [Sale.sequelize!.fn('COUNT', Sale.sequelize!.col('Payment.id')), 'count'],
        ],
        include: [
          {
            model: Sale,
            as: 'sale',
            where: { ...whereClause, status: 'completed' },
            attributes: [],
          },
        ],
        group: ['Payment.paymentMethod'],
        raw: true,
      });

      return {
        totalSales,
        completedSales,
        totalRevenue: totalRevenue ? parseFloat(totalRevenue.toString()) : 0,
        totalTax: totalTax ? parseFloat(totalTax.toString()) : 0,
        totalDiscount: totalDiscount ? parseFloat(totalDiscount.toString()) : 0,
        averageSaleValue: totalRevenue && completedSales ? parseFloat(totalRevenue.toString()) / completedSales : 0,
        paymentMethodStats: paymentMethodStats.map((stat: any) => ({
          method: stat.paymentMethod,
          totalAmount: parseFloat(stat.totalAmount.toString()),
          count: parseInt(stat.count.toString()),
        })),
      };
    } catch (error) {
      logger.error('Error getting sales stats:', error);
      throw new Error('Failed to get sales statistics');
    }
  }

  /**
   * Delete a sale (only cancelled sales)
   */
  static async deleteSale(saleId: string, tenantId: string): Promise<boolean> {
    try {
      const sale = await Sale.findOne({
        where: { id: saleId, tenantId, status: 'cancelled' },
      });

      if (!sale) {
        return false;
      }

      await Sale.destroy({
        where: { id: saleId, tenantId },
      });

      logger.info(`Sale deleted: ${saleId} for tenant ${tenantId}`);
      return true;
    } catch (error: any) {
      logger.error('Error deleting sale:', error);
      throw error;
    }
  }

  /**
   * Get tenant-wide sales statistics across all stores
   */
  static async getTenantSalesStats(tenantId: string, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const dateFilter: any = {};
      if (startDate || endDate) {
        if (startDate) dateFilter[Op.gte] = startDate;
        if (endDate) dateFilter[Op.lte] = endDate;
      }

      const whereClause = {
        tenantId,
        ...(Object.keys(dateFilter).length > 0 && { saleDate: dateFilter }),
      };

      const totalSales = await Sale.count({ where: whereClause });

      const completedSales = await Sale.count({
        where: { ...whereClause, status: 'completed' },
      });

      const totalRevenue = await Sale.sum('totalAmount', {
        where: { ...whereClause, status: 'completed' },
      });

      const totalTax = await Sale.sum('taxAmount', {
        where: { ...whereClause, status: 'completed' },
      });

      const totalDiscount = await Sale.sum('discountAmount', {
        where: { ...whereClause, status: 'completed' },
      });

      return {
        totalSales,
        completedSales,
        totalRevenue: totalRevenue ? parseFloat(totalRevenue.toString()) : 0,
        totalTax: totalTax ? parseFloat(totalTax.toString()) : 0,
        totalDiscount: totalDiscount ? parseFloat(totalDiscount.toString()) : 0,
        averageSaleValue: totalRevenue && completedSales ? parseFloat(totalRevenue.toString()) / completedSales : 0,
      };
    } catch (error) {
      logger.error('Error getting tenant sales stats:', error);
      throw new Error('Failed to get tenant sales statistics');
    }
  }

  /**
   * Compare sales performance across stores
   */
  static async compareStoreSales(tenantId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      const dateFilter: any = {};
      if (startDate || endDate) {
        if (startDate) dateFilter[Op.gte] = startDate;
        if (endDate) dateFilter[Op.lte] = endDate;
      }

      const whereClause = {
        tenantId,
        status: 'completed',
        ...(Object.keys(dateFilter).length > 0 && { saleDate: dateFilter }),
      };

      const storeStats = await Sale.findAll({
        where: whereClause,
        attributes: [
          'storeId',
          [fn('COUNT', col('id')), 'totalSales'],
          [fn('SUM', col('totalAmount')), 'totalRevenue'],
          [fn('SUM', col('taxAmount')), 'totalTax'],
          [fn('SUM', col('discountAmount')), 'totalDiscount'],
          [fn('AVG', col('totalAmount')), 'averageSaleValue'],
          [fn('MIN', col('saleDate')), 'firstSaleDate'],
          [fn('MAX', col('saleDate')), 'lastSaleDate'],
        ],
        group: ['storeId'],
        raw: true,
      });

      return storeStats.map((stat: any) => ({
        storeId: stat.storeId,
        totalSales: parseInt(stat.totalSales.toString()),
        totalRevenue: parseFloat(stat.totalRevenue.toString()),
        totalTax: parseFloat(stat.totalTax.toString()),
        totalDiscount: parseFloat(stat.totalDiscount.toString()),
        averageSaleValue: parseFloat(stat.averageSaleValue.toString()),
        firstSaleDate: stat.firstSaleDate,
        lastSaleDate: stat.lastSaleDate,
      }));
    } catch (error) {
      logger.error('Error comparing store sales:', error);
      throw new Error('Failed to compare store sales');
    }
  }

  /**
   * Get sales trends across all stores in tenant
   */
  static async getTenantSalesTrends(tenantId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      const dateRange = startDate && endDate ? { [Op.between]: [startDate, endDate] } : {};

      const trends = await Sale.findAll({
        where: {
          tenantId,
          status: 'completed',
          ...(Object.keys(dateRange).length > 0 && { saleDate: dateRange }),
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

      return trends.map((trend: any) => ({
        date: trend.date,
        totalSales: parseInt(trend.totalSales.toString()),
        totalRevenue: parseFloat(trend.totalRevenue.toString()),
      }));
    } catch (error) {
      logger.error('Error getting tenant sales trends:', error);
      throw new Error('Failed to get tenant sales trends');
    }
  }

  /**
   * Get inventory turnover metrics across stores
   */
  static async getInventoryTurnoverMetrics(tenantId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      // This would require joining sales with inventory data
      // For now, return basic sales volume by product across stores
      const productSales = await Sale.findAll({
        where: {
          tenantId,
          status: 'completed',
          ...(startDate && endDate && { saleDate: { [Op.between]: [startDate, endDate] } }),
        },
        include: [
          {
            model: SaleItem,
            as: 'saleItems',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'sku'],
              },
            ],
          },
        ],
        attributes: ['storeId'],
      });

      // Aggregate sales by store and product
      const turnoverData: { [key: string]: any } = {};

      for (const sale of productSales) {
        const storeId = sale.storeId;
        if (!turnoverData[storeId]) {
          turnoverData[storeId] = {
            storeId,
            productsSold: {},
            totalItemsSold: 0,
          };
        }

        for (const item of sale.saleItems || []) {
          const productId = item.productId;
          const quantity = parseFloat(item.quantity.toString());

          if (!turnoverData[storeId].productsSold[productId]) {
            turnoverData[storeId].productsSold[productId] = {
              productId,
              productName: item.product?.name,
              quantitySold: 0,
            };
          }

          turnoverData[storeId].productsSold[productId].quantitySold += quantity;
          turnoverData[storeId].totalItemsSold += quantity;
        }
      }

      return Object.values(turnoverData).map((storeData: any) => ({
        storeId: storeData.storeId,
        totalItemsSold: storeData.totalItemsSold,
        uniqueProductsSold: Object.keys(storeData.productsSold).length,
        topProducts: Object.values(storeData.productsSold)
          .sort((a: any, b: any) => b.quantitySold - a.quantitySold)
          .slice(0, 5),
      }));
    } catch (error) {
      logger.error('Error getting inventory turnover metrics:', error);
      throw new Error('Failed to get inventory turnover metrics');
    }
  }

  /**
   * Get profitability metrics across stores
   */
  static async getStoreProfitabilityMetrics(tenantId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      // Get sales data with cost information
      const salesData = await Sale.findAll({
        where: {
          tenantId,
          status: 'completed',
          ...(startDate && endDate && { saleDate: { [Op.between]: [startDate, endDate] } }),
        },
        include: [
          {
            model: SaleItem,
            as: 'saleItems',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'unitCost'],
              },
            ],
          },
        ],
        attributes: ['storeId', 'totalAmount', 'taxAmount', 'discountAmount'],
      });

      // Calculate profitability by store
      const profitabilityData: { [key: string]: any } = {};

      for (const sale of salesData) {
        const storeId = sale.storeId;
        if (!profitabilityData[storeId]) {
          profitabilityData[storeId] = {
            storeId,
            totalRevenue: 0,
            totalCost: 0,
            totalTax: 0,
            totalDiscount: 0,
            totalSales: 0,
          };
        }

        profitabilityData[storeId].totalRevenue += parseFloat(sale.totalAmount.toString());
        profitabilityData[storeId].totalTax += parseFloat(sale.taxAmount.toString());
        profitabilityData[storeId].totalDiscount += parseFloat(sale.discountAmount.toString());
        profitabilityData[storeId].totalSales += 1;

        // Calculate cost of goods sold
        for (const item of sale.saleItems || []) {
          const quantity = parseFloat(item.quantity.toString());
          const unitCost = parseFloat(item.product?.unitCost?.toString() || '0');
          profitabilityData[storeId].totalCost += quantity * unitCost;
        }
      }

      return Object.values(profitabilityData).map((storeData: any) => ({
        storeId: storeData.storeId,
        totalRevenue: storeData.totalRevenue,
        totalCost: storeData.totalCost,
        grossProfit: storeData.totalRevenue - storeData.totalCost,
        profitMargin: storeData.totalRevenue > 0 ? ((storeData.totalRevenue - storeData.totalCost) / storeData.totalRevenue) * 100 : 0,
        totalTax: storeData.totalTax,
        totalDiscount: storeData.totalDiscount,
        netProfit: storeData.totalRevenue - storeData.totalCost - storeData.totalTax,
        totalSales: storeData.totalSales,
        averageProfitPerSale: storeData.totalSales > 0 ? (storeData.totalRevenue - storeData.totalCost) / storeData.totalSales : 0,
      }));
    } catch (error) {
      logger.error('Error getting store profitability metrics:', error);
      throw new Error('Failed to get store profitability metrics');
    }
  }
}