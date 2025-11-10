import { Request, Response, NextFunction } from 'express';
import { TenantService, CreateTenantData, UpdateTenantData } from '../services/tenant.service';
import logger from '../config/logger';

export class TenantController {
  /**
   * Get all tenants
   */
  static async getAllTenants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenants = await TenantService.getAllTenants();

      res.json({
        success: true,
        data: tenants,
        count: tenants.length,
      });
    } catch (error) {
      logger.error('Error fetching tenants:', error);
      next(error);
    }
  }

  /**
   * Get tenant by ID
   */
  static async getTenantById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Tenant ID is required',
        });
        return;
      }

      const tenant = await TenantService.getTenantById(id);

      if (!tenant) {
        res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
        return;
      }

      res.json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      logger.error('Error fetching tenant:', error);
      next(error);
    }
  }

  /**
   * Create new tenant
   */
  static async createTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantData: CreateTenantData = req.body;

      // Basic validation
      if (!tenantData.name || !tenantData.domain) {
        res.status(400).json({
          success: false,
          message: 'Name and domain are required',
        });
        return;
      }

      // Validate domain format
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(tenantData.domain)) {
        res.status(400).json({
          success: false,
          message: 'Invalid domain format',
        });
        return;
      }

      const tenant = await TenantService.createTenant(tenantData);

      res.status(201).json({
        success: true,
        data: tenant,
        message: 'Tenant created successfully',
      });
    } catch (error) {
      logger.error('Error creating tenant:', error);

      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Update tenant
   */
  static async updateTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Tenant ID is required',
        });
        return;
      }

      const updateData: UpdateTenantData = req.body;

      const tenant = await TenantService.updateTenant(id, updateData);

      res.json({
        success: true,
        data: tenant,
        message: 'Tenant updated successfully',
      });
    } catch (error) {
      logger.error('Error updating tenant:', error);

      if (error instanceof Error && error.message === 'Tenant not found') {
        res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
        return;
      }

      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Delete tenant
   */
  static async deleteTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Tenant ID is required',
        });
        return;
      }

      await TenantService.deleteTenant(id);

      res.json({
        success: true,
        message: 'Tenant deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting tenant:', error);

      if (error instanceof Error && error.message === 'Tenant not found') {
        res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
        return;
      }

      if (error instanceof Error && error.message.includes('active stores or users')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Get tenant statistics
   */
  static async getTenantStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Tenant ID is required',
        });
        return;
      }

      const stats = await TenantService.getTenantStats(id);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error fetching tenant stats:', error);
      next(error);
    }
  }

  /**
   * Check domain availability
   */
  static async checkDomainAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { domain } = req.params;

      if (!domain) {
        res.status(400).json({
          success: false,
          message: 'Domain is required',
        });
        return;
      }

      const { excludeId } = req.query;

      const isAvailable = await TenantService.isDomainAvailable(domain, excludeId as string);

      res.json({
        success: true,
        data: {
          domain,
          available: isAvailable,
        },
      });
    } catch (error) {
      logger.error('Error checking domain availability:', error);
      next(error);
    }
  }
}