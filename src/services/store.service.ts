import { Store, Tenant, User } from '../db/models';
import { Op } from 'sequelize';
import logger from '../config/logger';

export interface CreateStoreData {
  tenantId: string;
  name: string;
  code: string;
  address: string;
  phone?: string;
  email?: string;
  settings?: object;
}

export interface UpdateStoreData {
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  settings?: object;
  isActive?: boolean;
}

export interface StoreWithStats {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  settings: object;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userCount: number;
  tenantName?: string;
}

export class StoreService {
  /**
   * Get all stores for a tenant
   */
  static async getAllStores(tenantId: string): Promise<StoreWithStats[]> {
    const stores = await Store.findAll({
      where: { tenantId, isActive: true },
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['name'],
          required: false,
        },
        {
          model: User,
          as: 'storeUsers',
          attributes: ['id'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return stores.map((store) => ({
      id: store.id,
      tenantId: store.tenantId,
      name: store.name,
      code: store.code,
      address: store.address,
      phone: store.phone || '',
      email: store.email || '',
      settings: store.settings || {},
      isActive: store.isActive,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
      userCount: store.storeUsers?.length || 0,
      tenantName: store.tenant?.name,
    }));
  }

  /**
   * Get store by ID with full details
   */
  static async getStoreById(storeId: string, tenantId?: string): Promise<StoreWithStats | null> {
    const whereClause: any = { id: storeId };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const store = await Store.findOne({
      where: whereClause,
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['name'],
          required: false,
        },
        {
          model: User,
          as: 'storeUsers',
          attributes: ['id', 'firstName', 'lastName', 'email', 'isActive'],
          required: false,
        },
      ],
    });

    if (!store) {
      return null;
    }

    return {
      id: store.id,
      tenantId: store.tenantId,
      name: store.name,
      code: store.code,
      address: store.address,
      phone: store.phone || '',
      email: store.email || '',
      settings: store.settings || {},
      isActive: store.isActive,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
      userCount: store.storeUsers?.length || 0,
      tenantName: store.tenant?.name,
    };
  }

  /**
   * Create a new store
   */
  static async createStore(data: CreateStoreData): Promise<Store> {
    // Verify tenant exists
    const tenant = await Tenant.findByPk(data.tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Check if store code already exists for this tenant
    const existingStore = await Store.findOne({
      where: {
        tenantId: data.tenantId,
        code: data.code,
      },
      paranoid: false, // Include soft deleted records
    });

    if (existingStore) {
      throw new Error('Store with this code already exists for this tenant');
    }

    const store = await Store.create({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      address: data.address,
      phone: data.phone || '',
      email: data.email || '',
      settings: data.settings || {},
    });

    logger.info(`New store created: ${data.name}`, {
      storeId: store.id,
      tenantId: data.tenantId,
      code: data.code,
    });

    return store;
  }

  /**
   * Update store information
   */
  static async updateStore(storeId: string, tenantId: string, data: UpdateStoreData): Promise<Store> {
    const store = await Store.findOne({
      where: { id: storeId, tenantId },
    });

    if (!store) {
      throw new Error('Store not found');
    }

    // Check code uniqueness if being updated
    if (data.code && data.code !== store.code) {
      const existingStore = await Store.findOne({
        where: {
          tenantId,
          code: data.code,
        },
        paranoid: false,
      });

      if (existingStore && existingStore.id !== storeId) {
        throw new Error('Store with this code already exists for this tenant');
      }
    }

    // Update fields
    if (data.name !== undefined) store.name = data.name;
    if (data.code !== undefined) store.code = data.code;
    if (data.address !== undefined) store.address = data.address;
    if (data.phone !== undefined) store.phone = data.phone;
    if (data.email !== undefined) store.email = data.email;
    if (data.settings !== undefined) store.settings = data.settings;
    if (data.isActive !== undefined) store.isActive = data.isActive;

    await store.save();

    logger.info(`Store updated: ${store.name}`, {
      storeId: store.id,
      tenantId,
      changes: data,
    });

    return store;
  }

  /**
   * Soft delete store
   */
  static async deleteStore(storeId: string, tenantId: string): Promise<void> {
    const store = await Store.findOne({
      where: { id: storeId, tenantId },
    });

    if (!store) {
      throw new Error('Store not found');
    }

    // Check if store has active users
    const userCount = await User.count({
      where: { defaultStoreId: storeId, isActive: true },
    });

    if (userCount > 0) {
      throw new Error('Cannot delete store with active users. Deactivate them first.');
    }

    await store.destroy();

    logger.info(`Store deleted: ${store.name}`, {
      storeId: store.id,
      tenantId,
    });
  }

  /**
   * Get store statistics
   */
  static async getStoreStats(storeId: string, tenantId: string): Promise<{
    userCount: number;
    activeUserCount: number;
    totalRevenue?: number; // Will be implemented when orders are added
  }> {
    const userCount = await User.count({
      where: { defaultStoreId: storeId, tenantId: tenantId },
    });

    const activeUserCount = await User.count({
      where: { defaultStoreId: storeId, tenantId: tenantId, isActive: true },
    });

    return {
      userCount,
      activeUserCount,
    };
  }

  /**
   * Check if store code is available for a tenant
   */
  static async isStoreCodeAvailable(tenantId: string, code: string, excludeStoreId?: string): Promise<boolean> {
    const whereClause: any = {
      tenantId,
      code,
    };

    if (excludeStoreId) {
      whereClause.id = { [Op.ne]: excludeStoreId };
    }

    const existingStore = await Store.findOne({
      where: whereClause,
      paranoid: false,
    });

    return !existingStore;
  }

  /**
   * Get stores by tenant ID (for tenant admin access)
   */
  static async getStoresByTenant(tenantId: string): Promise<StoreWithStats[]> {
    return this.getAllStores(tenantId);
  }
}