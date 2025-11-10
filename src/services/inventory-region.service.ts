import { Transaction, Op } from 'sequelize';
import sequelize from '@/config/database';
import {
  InventoryRegion,
  Store,
  Inventory,
  Product
} from '../db/models';
import logger from '../config/logger';

export interface CreateRegionData {
  regionCode: string;
  regionName: string;
  description?: string;
  managerId?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  timezone?: string;
  storeIds: string[];
}

export interface UpdateRegionData {
  regionName?: string;
  description?: string;
  managerId?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  timezone?: string;
  storeIds?: string[];
}

export interface RegionalInventoryData {
  regionId: string;
  regionName: string;
  totalStores: number;
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  storeBreakdown: Array<{
    storeId: string;
    storeName: string;
    productCount: number;
    totalValue: number;
    lowStockCount: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    totalQuantity: number;
    totalValue: number;
    storeDistribution: Array<{
      storeId: string;
      storeName: string;
      quantity: number;
    }>;
  }>;
}

class InventoryRegionService {
  /**
   * Create a new inventory region
   */
  static async createRegion(
    tenantId: string,
    regionData: CreateRegionData
  ): Promise<InventoryRegion> {
    const transaction = await sequelize.transaction();

    try {
      // Validate region code uniqueness
      const existingRegion = await InventoryRegion.findOne({
        where: { regionCode: regionData.regionCode, tenantId }
      });

      if (existingRegion) {
        throw new Error('Region code already exists');
      }

      // Validate stores exist and belong to tenant
      if (regionData.storeIds.length > 0) {
        const stores = await Store.findAll({
          where: {
            id: { [Op.in]: regionData.storeIds },
            tenantId
          }
        });

        if (stores.length !== regionData.storeIds.length) {
          throw new Error('One or more stores not found');
        }
      }

      const createData: any = {
        tenantId,
        regionCode: regionData.regionCode,
        regionName: regionData.regionName,
        isActive: true,
      };

      if (regionData.description !== undefined) createData.description = regionData.description;
      if (regionData.managerId !== undefined) createData.managerId = regionData.managerId;
      if (regionData.address !== undefined) createData.address = regionData.address;
      if (regionData.city !== undefined) createData.city = regionData.city;
      if (regionData.state !== undefined) createData.state = regionData.state;
      if (regionData.postalCode !== undefined) createData.postalCode = regionData.postalCode;
      if (regionData.country !== undefined) createData.country = regionData.country;
      if (regionData.timezone !== undefined) createData.timezone = regionData.timezone;

      const region = await InventoryRegion.create(createData, { transaction });

      // Associate stores with the region
      if (regionData.storeIds.length > 0) {
        const stores = await Store.findAll({
          where: {
            id: { [Op.in]: regionData.storeIds },
            tenantId
          },
          transaction
        });

        await (region as any).setStores(stores, { transaction });
      }

      await transaction.commit();

      logger.info(`Created inventory region ${regionData.regionCode} for tenant ${tenantId}`);

      return region;
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Create region error:', error);
      throw new Error(error.message || 'Failed to create inventory region');
    }
  }

  /**
   * Update an inventory region
   */
  static async updateRegion(
    regionId: string,
    tenantId: string,
    updateData: UpdateRegionData
  ): Promise<InventoryRegion> {
    const transaction = await sequelize.transaction();

    try {
      const region = await InventoryRegion.findOne({
        where: { id: regionId, tenantId },
        transaction
      });

      if (!region) {
        throw new Error('Inventory region not found');
      }

      // Validate stores if provided
      if (updateData.storeIds) {
        const stores = await Store.findAll({
          where: {
            id: { [Op.in]: updateData.storeIds },
            tenantId
          },
          transaction
        });

        if (stores.length !== updateData.storeIds.length) {
          throw new Error('One or more stores not found');
        }
      }

      const updatedData: any = {};
      if (updateData.regionName) updatedData.regionName = updateData.regionName;
      if (updateData.description !== undefined) updatedData.description = updateData.description;
      if (updateData.managerId !== undefined) updatedData.managerId = updateData.managerId;
      if (updateData.address !== undefined) updatedData.address = updateData.address;
      if (updateData.city !== undefined) updatedData.city = updateData.city;
      if (updateData.state !== undefined) updatedData.state = updateData.state;
      if (updateData.postalCode !== undefined) updatedData.postalCode = updateData.postalCode;
      if (updateData.country !== undefined) updatedData.country = updateData.country;
      if (updateData.timezone !== undefined) updatedData.timezone = updateData.timezone;

      await region.update(updatedData, { transaction });

      // Update store associations if provided
      if (updateData.storeIds !== undefined) {
        const stores = await Store.findAll({
          where: {
            id: { [Op.in]: updateData.storeIds },
            tenantId
          },
          transaction
        });

        await (region as any).setStores(stores, { transaction });
      }

      await transaction.commit();

      logger.info(`Updated inventory region ${region.dataValues.regionCode}`);

      return region;
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Update region error:', error);
      throw new Error(error.message || 'Failed to update inventory region');
    }
  }

  /**
   * Delete an inventory region
   */
  static async deleteRegion(
    regionId: string,
    tenantId: string
  ): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      const region = await InventoryRegion.findOne({
        where: { id: regionId, tenantId },
        transaction
      });

      if (!region) {
        throw new Error('Inventory region not found');
      }

      await region.destroy({ transaction });

      await transaction.commit();

      logger.info(`Deleted inventory region ${region.dataValues.regionCode}`);
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Delete region error:', error);
      throw new Error(error.message || 'Failed to delete inventory region');
    }
  }

  /**
   * Get regions with filtering
   */
  static async getRegions(
    tenantId: string,
    filters?: {
      regionCode?: string;
      regionName?: string;
      storeId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ regions: InventoryRegion[]; total: number }> {
    try {
      const whereClause: any = { tenantId };

      if (filters?.regionCode) {
        whereClause.regionCode = { [Op.iLike]: `%${filters.regionCode}%` };
      }

      if (filters?.regionName) {
        whereClause.regionName = { [Op.iLike]: `%${filters.regionName}%` };
      }

      const includeOptions: any[] = [
        {
          model: Store,
          as: 'stores',
          required: false,
          attributes: ['id', 'name'],
        },
      ];

      // If filtering by storeId, we need to include stores and filter
      if (filters?.storeId) {
        includeOptions[0].where = { id: filters.storeId };
        includeOptions[0].required = true;
      }

      const { count: total, rows: regions } = await InventoryRegion.findAndCountAll({
        where: whereClause,
        include: includeOptions,
        order: [['regionName', 'ASC']],
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
      });

      return { regions, total };
    } catch (error) {
      logger.error('Get regions error:', error);
      throw new Error('Failed to retrieve inventory regions');
    }
  }

  /**
   * Get region by ID with full details
   */
  static async getRegionById(
    regionId: string,
    tenantId: string
  ): Promise<InventoryRegion | null> {
    try {
      const region = await InventoryRegion.findOne({
        where: { id: regionId, tenantId },
        include: [
          {
            model: Store,
            as: 'stores',
            attributes: ['id', 'name', 'address'],
          },
        ],
      });

      return region;
    } catch (error) {
      logger.error('Get region by ID error:', error);
      throw new Error('Failed to retrieve inventory region');
    }
  }

  /**
   * Get regional inventory summary
   */
  static async getRegionalInventory(
    regionId: string,
    tenantId: string,
    filters?: {
      productId?: string;
      lowStockThreshold?: number;
      includeOutOfStock?: boolean;
    }
  ): Promise<RegionalInventoryData> {
    try {
      const region = await InventoryRegion.findOne({
        where: { id: regionId, tenantId },
        include: [
          {
            model: Store,
            as: 'stores',
            attributes: ['id'],
          },
        ],
      });

      if (!region || !(region as any).stores || (region as any).stores.length === 0) {
        throw new Error('Inventory region not found or has no stores');
      }

      const storeIds = (region as any).stores.map((store: any) => store.id);

      // Get all inventory for stores in this region
      const inventoryQuery: any = {
        tenantId,
        storeId: { [Op.in]: storeIds },
      };

      if (filters?.productId) {
        inventoryQuery.productId = filters.productId;
      }

      const inventories = await Inventory.findAll({
        where: inventoryQuery,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku', 'categoryId'],
          },
          {
            model: Store,
            as: 'store',
            attributes: ['id', 'name'],
          },
        ],
      });

      // Calculate regional summary
      const storeBreakdown = new Map<string, any>();
      const productBreakdown = new Map<string, any>();
      let totalValue = 0;
      let lowStockItems = 0;
      let outOfStockItems = 0;

      inventories.forEach((inv: any) => {
        const quantity = parseFloat(inv.dataValues.quantityAvailable.toString());
        const unitCost = parseFloat(inv.dataValues.unitCost?.toString() || '0');
        const value = quantity * unitCost;

        // Store breakdown
        if (!storeBreakdown.has(inv.dataValues.storeId)) {
          storeBreakdown.set(inv.dataValues.storeId, {
            storeId: inv.dataValues.storeId,
            storeName: inv.dataValues.store!.dataValues.name,
            productCount: 0,
            totalValue: 0,
            lowStockCount: 0,
          });
        }

        const storeData = storeBreakdown.get(inv.dataValues.storeId);
        storeData.productCount++;
        storeData.totalValue += value;

        // Product breakdown
        if (!productBreakdown.has(inv.dataValues.productId)) {
          productBreakdown.set(inv.dataValues.productId, {
            productId: inv.dataValues.productId,
            productName: inv.dataValues.product!.dataValues.name,
            totalQuantity: 0,
            totalValue: 0,
            storeDistribution: [],
          });
        }

        const productData = productBreakdown.get(inv.dataValues.productId);
        productData.totalQuantity += quantity;
        productData.totalValue += value;
        productData.storeDistribution.push({
          storeId: inv.dataValues.storeId,
          storeName: inv.dataValues.store!.dataValues.name,
          quantity,
        });

        totalValue += value;

        // Check stock levels
        const threshold = filters?.lowStockThreshold || parseFloat(inv.dataValues.reorderPoint?.toString() || '0');
        if (quantity === 0) {
          outOfStockItems++;
          storeData.lowStockCount++;
        } else if (quantity <= threshold) {
          lowStockItems++;
          storeData.lowStockCount++;
        }
      });

      // Sort top products by total value
      const topProducts = Array.from(productBreakdown.values())
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10);

      return {
        regionId: region.dataValues.id,
        regionName: region.dataValues.regionName,
        totalStores: (region as any).stores.length,
        totalProducts: productBreakdown.size,
        lowStockItems,
        outOfStockItems,
        totalValue,
        storeBreakdown: Array.from(storeBreakdown.values()),
        topProducts,
      };
    } catch (error: any) {
      logger.error('Get regional inventory error:', error);
      throw new Error(error.message || 'Failed to retrieve regional inventory');
    }
  }

  /**
   * Add stores to a region
   */
  static async addStoresToRegion(
    regionId: string,
    tenantId: string,
    storeIds: string[]
  ): Promise<InventoryRegion> {
    const transaction = await sequelize.transaction();

    try {
      const region = await InventoryRegion.findOne({
        where: { id: regionId, tenantId },
        transaction
      });

      if (!region) {
        throw new Error('Inventory region not found');
      }

      // Validate stores exist and belong to tenant
      const stores = await Store.findAll({
        where: {
          id: { [Op.in]: storeIds },
          tenantId
        },
        transaction
      });

      if (stores.length !== storeIds.length) {
        throw new Error('One or more stores not found');
      }

      // Add stores to region (avoid duplicates)
      const currentStores = await (region as any).getStores({ transaction });
      const allStores = [...currentStores, ...stores];
      const uniqueStores = allStores.filter((store: any, index: number, self: any[]) =>
        index === self.findIndex((s: any) => s.id === store.id)
      );

      await (region as any).setStores(uniqueStores, { transaction });

      await transaction.commit();

      logger.info(`Added ${storeIds.length} stores to region ${region.dataValues.regionCode}`);

      return region;
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Add stores to region error:', error);
      throw new Error(error.message || 'Failed to add stores to region');
    }
  }

  /**
   * Remove stores from a region
   */
  static async removeStoresFromRegion(
    regionId: string,
    tenantId: string,
    storeIds: string[]
  ): Promise<InventoryRegion> {
    const transaction = await sequelize.transaction();

    try {
      const region = await InventoryRegion.findOne({
        where: { id: regionId, tenantId },
        transaction
      });

      if (!region) {
        throw new Error('Inventory region not found');
      }

      // Get current stores and filter out the ones to remove
      const currentStores = await (region as any).getStores({ transaction });
      const remainingStores = currentStores.filter((store: any) => !storeIds.includes(store.id));

      await (region as any).setStores(remainingStores, { transaction });

      await transaction.commit();

      logger.info(`Removed ${storeIds.length} stores from region ${region.dataValues.regionCode}`);

      return region;
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Remove stores from region error:', error);
      throw new Error(error.message || 'Failed to remove stores from region');
    }
  }

  /**
   * Get regions containing a specific store
   */
  static async getRegionsForStore(
    storeId: string,
    tenantId: string
  ): Promise<InventoryRegion[]> {
    try {
      const store = await Store.findOne({
        where: { id: storeId, tenantId },
        include: [
          {
            model: InventoryRegion,
            as: 'regions',
            attributes: ['id', 'regionCode', 'regionName'],
          },
        ],
      });

      return store ? (store as any).regions || [] : [];
    } catch (error) {
      logger.error('Get regions for store error:', error);
      throw new Error('Failed to retrieve regions for store');
    }
  }
}

export default InventoryRegionService;