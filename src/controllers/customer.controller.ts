import { Request, Response, NextFunction } from 'express';
import {
  CustomerService,
  CreateCustomerData,
  UpdateCustomerData,
  CustomerWithDetails
} from '../services/customer.service';
import { AuthRequest } from './auth.controller';
import logger from '../config/logger';

export class CustomerController {
  /**
   * Get all customers for a tenant with pagination and filters
   */
  static async getCustomers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const {
        page = 1,
        limit = 20,
        isActive,
        search,
        email,
        phone,
        minLoyaltyPoints,
        maxLoyaltyPoints,
      } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 20;

      const filters: any = {};
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (search) filters.search = search;
      if (email) filters.email = email;
      if (phone) filters.phone = phone;
      if (minLoyaltyPoints) filters.minLoyaltyPoints = parseInt(minLoyaltyPoints as string, 10);
      if (maxLoyaltyPoints) filters.maxLoyaltyPoints = parseInt(maxLoyaltyPoints as string, 10);

      const result = await CustomerService.getCustomers(tenantId, pageNum, limitNum, filters);

      logger.info(`Retrieved ${result.customers.length} customers for tenant ${tenantId}`);

      res.json({
        success: true,
        data: result.customers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          totalPages: Math.ceil(result.total / limitNum),
        },
      });
    } catch (error: any) {
      logger.error('Get customers error:', error);
      next(error);
    }
  }

  /**
   * Get customer by ID
   */
  static async getCustomerById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Customer ID is required',
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

      const customer = await CustomerService.getCustomerById(id, tenantId);

      if (!customer) {
        res.status(404).json({
          success: false,
          error: 'Customer not found',
        });
        return;
      }

      logger.info(`Retrieved customer ${customer.fullName} for tenant ${tenantId}`);

      res.json({
        success: true,
        data: customer,
      });
    } catch (error: any) {
      logger.error('Get customer by ID error:', error);

      if (error.message === 'Customer not found') {
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
   * Create a new customer
   */
  static async createCustomer(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const customerData: CreateCustomerData = {
        tenantId,
        ...req.body,
      };

      const customer = await CustomerService.createCustomer(customerData);

      logger.info(`Created customer ${customer.fullName} for tenant ${tenantId}`);

      res.status(201).json({
        success: true,
        data: customer,
        message: 'Customer created successfully',
      });
    } catch (error: any) {
      logger.error('Create customer error:', error);

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
   * Update customer
   */
  static async updateCustomer(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Customer ID is required',
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

      const updateData: UpdateCustomerData = req.body;

      const customer = await CustomerService.updateCustomer(id, tenantId, updateData);

      if (!customer) {
        res.status(404).json({
          success: false,
          error: 'Customer not found',
        });
        return;
      }

      logger.info(`Updated customer ${customer.fullName} for tenant ${tenantId}`);

      res.json({
        success: true,
        data: customer,
        message: 'Customer updated successfully',
      });
    } catch (error: any) {
      logger.error('Update customer error:', error);

      if (error.message === 'Customer not found') {
        res.status(404).json({
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
   * Delete customer
   */
  static async deleteCustomer(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Customer ID is required',
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

      await CustomerService.deleteCustomer(id, tenantId);

      logger.info(`Deleted customer ${id} for tenant ${tenantId}`);

      res.json({
        success: true,
        message: 'Customer deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete customer error:', error);

      if (error.message === 'Customer not found') {
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
   * Add loyalty points to customer
   */
  static async addLoyaltyPoints(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      const { points } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Customer ID is required',
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

      if (!points || typeof points !== 'number' || points <= 0) {
        res.status(400).json({
          success: false,
          error: 'Valid points amount is required',
        });
        return;
      }

      const customer = await CustomerService.addLoyaltyPoints(id, tenantId, points);

      if (!customer) {
        res.status(404).json({
          success: false,
          error: 'Customer not found',
        });
        return;
      }

      logger.info(`Added ${points} loyalty points to customer ${customer.fullName}`);

      res.json({
        success: true,
        data: customer,
        message: `${points} loyalty points added successfully`,
      });
    } catch (error: any) {
      logger.error('Add loyalty points error:', error);

      if (error.message === 'Customer not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('must be positive')) {
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
   * Deduct loyalty points from customer
   */
  static async deductLoyaltyPoints(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      const { points } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Customer ID is required',
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

      if (!points || typeof points !== 'number' || points <= 0) {
        res.status(400).json({
          success: false,
          error: 'Valid points amount is required',
        });
        return;
      }

      const customer = await CustomerService.deductLoyaltyPoints(id, tenantId, points);

      if (!customer) {
        res.status(404).json({
          success: false,
          error: 'Customer not found',
        });
        return;
      }

      logger.info(`Deducted ${points} loyalty points from customer ${customer.fullName}`);

      res.json({
        success: true,
        data: customer,
        message: `${points} loyalty points deducted successfully`,
      });
    } catch (error: any) {
      logger.error('Deduct loyalty points error:', error);

      if (error.message === 'Customer not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('Insufficient loyalty points')) {
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
   * Search customers
   */
  static async searchCustomers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q: query, limit = 10 } = req.query;
      const tenantId = req.user?.tenantId;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query is required',
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

      const limitNum = parseInt(limit as string, 10) || 10;

      const customers = await CustomerService.searchCustomers(tenantId, query, limitNum);

      logger.info(`Searched customers with query "${query}" for tenant ${tenantId}, found ${customers.length} results`);

      res.json({
        success: true,
        data: customers,
        message: 'Customer search completed successfully',
      });
    } catch (error: any) {
      logger.error('Search customers error:', error);
      next(error);
    }
  }

  /**
   * Get customer statistics
   */
  static async getCustomerStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const stats = await CustomerService.getCustomerStats(tenantId);

      logger.info(`Retrieved customer statistics for tenant ${tenantId}`);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get customer stats error:', error);
      next(error);
    }
  }
}