import { Customer, Sale } from '../db/models';
import { Op } from 'sequelize';
import logger from '../config/logger';

export interface CreateCustomerData {
  tenantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  loyaltyPoints?: number;
  totalSpent?: number;
  isActive?: boolean;
  notes?: string;
}

export interface UpdateCustomerData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  notes?: string;
  isActive?: boolean;
}

export interface CustomerWithDetails {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  loyaltyPoints: number;
  totalSpent: number;
  lastPurchaseAt?: Date;
  isActive: boolean;
  notes?: string;
  fullName: string;
  salesCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalLoyaltyPoints: number;
  averageSpent: number;
  topSpenders: CustomerWithDetails[];
  newCustomersThisMonth: number;
  customersByGender: {
    male: number;
    female: number;
    other: number;
  };
}

export class CustomerService {
  /**
   * Create a new customer
   */
  static async createCustomer(customerData: CreateCustomerData): Promise<CustomerWithDetails> {
    try {
      // Check for duplicate email or phone within tenant
      if (customerData.email) {
        const existingEmail = await Customer.findOne({
          where: {
            tenantId: customerData.tenantId,
            email: customerData.email,
          },
        });
        if (existingEmail) {
          throw new Error('Customer with this email already exists');
        }
      }

      if (customerData.phone) {
        const existingPhone = await Customer.findOne({
          where: {
            tenantId: customerData.tenantId,
            phone: customerData.phone,
          },
        });
        if (existingPhone) {
          throw new Error('Customer with this phone number already exists');
        }
      }

      const customerDataWithDefaults = {
        ...customerData,
        loyaltyPoints: customerData.loyaltyPoints ?? 0,
        totalSpent: customerData.totalSpent ?? 0,
        isActive: customerData.isActive ?? true,
      };

      const customer = await Customer.create(customerDataWithDefaults);

      logger.info(`Created customer ${customer.firstName} ${customer.lastName} for tenant ${customerData.tenantId}`);

      return this.formatCustomerResponse(customer);
    } catch (error: any) {
      logger.error('Create customer error:', error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  static async getCustomerById(customerId: string, tenantId: string): Promise<CustomerWithDetails | null> {
    try {
      const customer = await Customer.findOne({
        where: {
          id: customerId,
          tenantId,
        },
        include: [
          {
            model: Sale,
            as: 'sales',
            attributes: ['id', 'totalAmount', 'saleDate'],
            where: { status: 'completed' },
            required: false,
          },
        ],
      });

      if (!customer) {
        return null;
      }

      return this.formatCustomerResponse(customer);
    } catch (error: any) {
      logger.error('Get customer by ID error:', error);
      throw error;
    }
  }

  /**
   * Get all customers for a tenant with pagination and filters
   */
  static async getCustomers(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    filters: any = {}
  ): Promise<{ customers: CustomerWithDetails[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      const whereClause: any = { tenantId };

      // Apply filters
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }

      if (filters.search) {
        whereClause[Op.or] = [
          { firstName: { [Op.iLike]: `%${filters.search}%` } },
          { lastName: { [Op.iLike]: `%${filters.search}%` } },
          { email: { [Op.iLike]: `%${filters.search}%` } },
          { phone: { [Op.iLike]: `%${filters.search}%` } },
        ];
      }

      if (filters.email) {
        whereClause.email = { [Op.iLike]: `%${filters.email}%` };
      }

      if (filters.phone) {
        whereClause.phone = { [Op.iLike]: `%${filters.phone}%` };
      }

      if (filters.minLoyaltyPoints !== undefined) {
        whereClause.loyaltyPoints = { [Op.gte]: filters.minLoyaltyPoints };
      }

      if (filters.maxLoyaltyPoints !== undefined) {
        whereClause.loyaltyPoints = { ...whereClause.loyaltyPoints, [Op.lte]: filters.maxLoyaltyPoints };
      }

      const { rows: customers, count: total } = await Customer.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Sale,
            as: 'sales',
            attributes: ['id', 'totalAmount', 'saleDate'],
            where: { status: 'completed' },
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      const formattedCustomers = customers.map(customer => this.formatCustomerResponse(customer));

      return { customers: formattedCustomers, total };
    } catch (error: any) {
      logger.error('Get customers error:', error);
      throw error;
    }
  }

  /**
   * Update customer
   */
  static async updateCustomer(
    customerId: string,
    tenantId: string,
    updateData: UpdateCustomerData
  ): Promise<CustomerWithDetails | null> {
    try {
      const customer = await Customer.findOne({
        where: {
          id: customerId,
          tenantId,
        },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Check for duplicate email or phone within tenant (excluding current customer)
      if (updateData.email && updateData.email !== customer.email) {
        const existingEmail = await Customer.findOne({
          where: {
            tenantId,
            email: updateData.email,
            id: { [Op.ne]: customerId },
          },
        });
        if (existingEmail) {
          throw new Error('Customer with this email already exists');
        }
      }

      if (updateData.phone && updateData.phone !== customer.phone) {
        const existingPhone = await Customer.findOne({
          where: {
            tenantId,
            phone: updateData.phone,
            id: { [Op.ne]: customerId },
          },
        });
        if (existingPhone) {
          throw new Error('Customer with this phone number already exists');
        }
      }

      await customer.update(updateData);

      logger.info(`Updated customer ${customer.firstName} ${customer.lastName} for tenant ${tenantId}`);

      // Fetch updated customer with associations
      const updatedCustomer = await Customer.findOne({
        where: { id: customerId, tenantId },
        include: [
          {
            model: Sale,
            as: 'sales',
            attributes: ['id', 'totalAmount', 'saleDate'],
            where: { status: 'completed' },
            required: false,
          },
        ],
      });

      return updatedCustomer ? this.formatCustomerResponse(updatedCustomer) : null;
    } catch (error: any) {
      logger.error('Update customer error:', error);
      throw error;
    }
  }

  /**
   * Delete customer (soft delete)
   */
  static async deleteCustomer(customerId: string, tenantId: string): Promise<boolean> {
    try {
      const customer = await Customer.findOne({
        where: {
          id: customerId,
          tenantId,
        },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Check if customer has completed sales
      const salesCount = await Sale.count({
        where: {
          customerId,
          tenantId,
          status: 'completed',
        },
      });

      if (salesCount > 0) {
        // Soft delete - just deactivate
        await customer.update({ isActive: false });
        logger.info(`Deactivated customer ${customer.firstName} ${customer.lastName} for tenant ${tenantId}`);
      } else {
        // Hard delete if no sales
        await customer.destroy();
        logger.info(`Deleted customer ${customer.firstName} ${customer.lastName} for tenant ${tenantId}`);
      }

      return true;
    } catch (error: any) {
      logger.error('Delete customer error:', error);
      throw error;
    }
  }

  /**
   * Add loyalty points to customer
   */
  static async addLoyaltyPoints(customerId: string, tenantId: string, points: number): Promise<CustomerWithDetails | null> {
    try {
      if (points <= 0) {
        throw new Error('Points must be positive');
      }

      const customer = await Customer.findOne({
        where: {
          id: customerId,
          tenantId,
        },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      const newPoints = customer.loyaltyPoints + points;
      await customer.update({ loyaltyPoints: newPoints });

      logger.info(`Added ${points} loyalty points to customer ${customer.firstName} ${customer.lastName}`);

      return this.getCustomerById(customerId, tenantId);
    } catch (error: any) {
      logger.error('Add loyalty points error:', error);
      throw error;
    }
  }

  /**
   * Deduct loyalty points from customer
   */
  static async deductLoyaltyPoints(customerId: string, tenantId: string, points: number): Promise<CustomerWithDetails | null> {
    try {
      if (points <= 0) {
        throw new Error('Points must be positive');
      }

      const customer = await Customer.findOne({
        where: {
          id: customerId,
          tenantId,
        },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      if (customer.loyaltyPoints < points) {
        throw new Error('Insufficient loyalty points');
      }

      const newPoints = customer.loyaltyPoints - points;
      await customer.update({ loyaltyPoints: newPoints });

      logger.info(`Deducted ${points} loyalty points from customer ${customer.firstName} ${customer.lastName}`);

      return this.getCustomerById(customerId, tenantId);
    } catch (error: any) {
      logger.error('Deduct loyalty points error:', error);
      throw error;
    }
  }

  /**
   * Update customer spending after sale completion
   */
  static async updateCustomerSpending(customerId: string, tenantId: string, amount: number): Promise<void> {
    try {
      if (!customerId) return; // Skip if no customer

      const customer = await Customer.findOne({
        where: {
          id: customerId,
          tenantId,
        },
      });

      if (!customer) {
        logger.warn(`Customer ${customerId} not found for spending update`);
        return;
      }

      const newTotalSpent = parseFloat(customer.totalSpent.toString()) + amount;

      await customer.update({
        totalSpent: newTotalSpent,
        lastPurchaseAt: new Date(),
      });

      logger.info(`Updated spending for customer ${customer.firstName} ${customer.lastName}: +$${amount}`);
    } catch (error: any) {
      logger.error('Update customer spending error:', error);
      throw error;
    }
  }

  /**
   * Search customers
   */
  static async searchCustomers(tenantId: string, query: string, limit: number = 10): Promise<CustomerWithDetails[]> {
    try {
      const customers = await Customer.findAll({
        where: {
          tenantId,
          isActive: true,
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${query}%` } },
            { lastName: { [Op.iLike]: `%${query}%` } },
            { email: { [Op.iLike]: `%${query}%` } },
            { phone: { [Op.iLike]: `%${query}%` } },
          ],
        },
        include: [
          {
            model: Sale,
            as: 'sales',
            attributes: ['id', 'totalAmount', 'saleDate'],
            where: { status: 'completed' },
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
      });

      return customers.map(customer => this.formatCustomerResponse(customer));
    } catch (error: any) {
      logger.error('Search customers error:', error);
      throw error;
    }
  }

  /**
   * Get customer statistics
   */
  static async getCustomerStats(tenantId: string): Promise<CustomerStats> {
    try {
      const customers = await Customer.findAll({
        where: { tenantId },
        attributes: ['isActive', 'loyaltyPoints', 'totalSpent', 'gender', 'createdAt'],
      });

      const totalCustomers = customers.length;
      const activeCustomers = customers.filter(c => c.isActive).length;
      const inactiveCustomers = totalCustomers - activeCustomers;
      const totalLoyaltyPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);
      const totalSpent = customers.reduce((sum, c) => sum + parseFloat(c.totalSpent.toString()), 0);
      const averageSpent = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

      // Top spenders
      const topSpendersData = await Customer.findAll({
        where: { tenantId, isActive: true },
        order: [['totalSpent', 'DESC']],
        limit: 10,
        include: [
          {
            model: Sale,
            as: 'sales',
            attributes: ['id', 'totalAmount', 'saleDate'],
            where: { status: 'completed' },
            required: false,
          },
        ],
      });

      const topSpenders = topSpendersData.map(customer => this.formatCustomerResponse(customer));

      // New customers this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const newCustomersThisMonth = await Customer.count({
        where: {
          tenantId,
          createdAt: { [Op.gte]: startOfMonth },
        },
      });

      // Customers by gender
      const genderStats = customers.reduce(
        (acc, customer) => {
          if (customer.gender === 'male') acc.male++;
          else if (customer.gender === 'female') acc.female++;
          else acc.other++;
          return acc;
        },
        { male: 0, female: 0, other: 0 }
      );

      return {
        totalCustomers,
        activeCustomers,
        inactiveCustomers,
        totalLoyaltyPoints,
        averageSpent,
        topSpenders,
        newCustomersThisMonth,
        customersByGender: genderStats,
      };
    } catch (error: any) {
      logger.error('Get customer stats error:', error);
      throw error;
    }
  }

  /**
   * Format customer response with computed fields
   */
  private static formatCustomerResponse(customer: any): CustomerWithDetails {
    const salesCount = customer.sales ? customer.sales.length : 0;

    return {
      id: customer.id,
      tenantId: customer.tenantId,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zipCode: customer.zipCode,
      country: customer.country,
      dateOfBirth: customer.dateOfBirth,
      gender: customer.gender,
      loyaltyPoints: customer.loyaltyPoints,
      totalSpent: parseFloat(customer.totalSpent.toString()),
      lastPurchaseAt: customer.lastPurchaseAt,
      isActive: customer.isActive,
      notes: customer.notes,
      fullName: `${customer.firstName} ${customer.lastName}`,
      salesCount,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}