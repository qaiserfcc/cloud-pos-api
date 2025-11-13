import { Tenant, Store, User } from '../db/models';
import { Op } from 'sequelize';
import logger from '../config/logger';

export interface CreateTenantData {
  name: string;
  domain: string;
  settings?: object;
}

export interface UpdateTenantData {
  name?: string;
  domain?: string;
  settings?: object;
  isActive?: boolean;
}

export interface TenantWithStats {
  id: string;
  name: string;
  domain: string;
  settings: object;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  storeCount: number;
  userCount: number;
}

export class TenantService {
  static async getAllTenants(): Promise<TenantWithStats[]> {
    const tenants = await Tenant.findAll({
      where: { isActive: true },
      include: [
        {
          model: Store,
          as: 'stores',
          attributes: ['id'],
          required: false,
        },
        {
          model: User,
          as: 'users',
          attributes: ['id'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return tenants.map((tenant) => ({
      id: tenant.dataValues.id,
      name: tenant.dataValues.name,
      domain: tenant.dataValues.domain!,
      settings: tenant.dataValues.settings || {},
      isActive: tenant.dataValues.isActive,
      createdAt: tenant.dataValues.createdAt,
      updatedAt: tenant.dataValues.updatedAt,
      storeCount: tenant.stores?.length || 0,
      userCount: tenant.users?.length || 0,
    }));
  }

  /**
   * Get tenant by ID with full details
   */
  static async getTenantById(tenantId: string): Promise<TenantWithStats | null> {
    const tenant = await Tenant.findByPk(tenantId, {
      include: [
        {
          model: Store,
          as: 'stores',
          attributes: ['id', 'name', 'is_active'],
          required: false,
        },
        {
          model: User,
          as: 'users',
          attributes: ['id', 'firstName', 'lastName', 'email', 'isActive'],
          required: false,
        },
      ],
    });

    if (!tenant) {
      return null;
    }

    return {
      id: tenant.dataValues.id,
      name: tenant.dataValues.name,
      domain: tenant.dataValues.domain!,
      settings: tenant.dataValues.settings || {},
      isActive: tenant.dataValues.isActive,
      createdAt: tenant.dataValues.createdAt,
      updatedAt: tenant.dataValues.updatedAt,
      storeCount: tenant.stores?.length || 0,
      userCount: tenant.users?.length || 0,
    };
  }

  /**
   * Create a new tenant
   */
  static async createTenant(data: CreateTenantData): Promise<Tenant> {
    // Check if domain already exists
    const existingTenant = await Tenant.findOne({
      where: { domain: data.domain },
      paranoid: false, // Include soft deleted records
    });

    if (existingTenant) {
      throw new Error('Tenant with this domain already exists');
    }

    const tenant = await Tenant.create({
      name: data.name,
      domain: data.domain,
      settings: data.settings || {},
    });

    logger.info(`New tenant created: ${data.name}`, {
      tenantId: tenant.dataValues.id,
      domain: data.domain,
    });

    return tenant;
  }

  /**
   * Update tenant information
   */
  static async updateTenant(tenantId: string, data: UpdateTenantData): Promise<Tenant> {
    const tenant = await Tenant.findByPk(tenantId);

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Check domain uniqueness if being updated
    if (data.domain && data.domain !== tenant.dataValues.domain) {
      const existingTenant = await Tenant.findOne({
        where: { domain: data.domain },
        paranoid: false,
      });

      if (existingTenant && existingTenant.dataValues.id !== tenantId) {
        throw new Error('Tenant with this domain already exists');
      }
    }

    // Update fields
    if (data.name !== undefined) (tenant as any).name = data.name;
    if (data.domain !== undefined) (tenant as any).domain = data.domain;
    if (data.settings !== undefined) (tenant as any).settings = data.settings;
    if (data.isActive !== undefined) (tenant as any).isActive = data.isActive;

    await tenant.save();

    logger.info(`Tenant updated: ${tenant.dataValues.name}`, {
      tenantId: tenant.dataValues.id,
      changes: data,
    });

    return tenant;
  }

  /**
   * Soft delete tenant
   */
  static async deleteTenant(tenantId: string): Promise<void> {
    const tenant = await Tenant.findByPk(tenantId);

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Check if tenant has active stores or users
    const storeCount = await Store.count({
      where: { tenantId: tenantId, isActive: true },
    });

    const userCount = await User.count({
      where: { tenantId: tenantId, isActive: true },
    });

    if (storeCount > 0 || userCount > 0) {
      throw new Error('Cannot delete tenant with active stores or users. Deactivate them first.');
    }

    await tenant.destroy();

    logger.info(`Tenant deleted: ${tenant.dataValues.name}`, {
      tenantId: tenant.dataValues.id,
    });
  }

  /**
   * Get tenant statistics
   */
  static async getTenantStats(tenantId: string): Promise<{
    storeCount: number;
    userCount: number;
    activeUserCount: number;
    totalRevenue?: number; // Will be implemented when orders are added
  }> {
    const storeCount = await Store.count({
      where: { tenantId: tenantId, isActive: true },
    });

    const userCount = await User.count({
      where: { tenantId: tenantId },
    });

    const activeUserCount = await User.count({
      where: { tenantId: tenantId, isActive: true },
    });

    return {
      storeCount,
      userCount,
      activeUserCount,
    };
  }

  /**
   * Check if domain is available
   */
  static async isDomainAvailable(domain: string, excludeTenantId?: string): Promise<boolean> {
    const whereClause: any = { domain };

    if (excludeTenantId) {
      whereClause.id = { [Op.ne]: excludeTenantId };
    }

    const existingTenant = await Tenant.findOne({
      where: whereClause,
      paranoid: false,
    });

    return !existingTenant;
  }
}