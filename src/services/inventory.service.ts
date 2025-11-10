import { Inventory } from '../db/models';
import { Product } from '../db/models';
import { Op, Transaction } from 'sequelize';
import logger from '../config/logger';

export interface CreateInventoryData {
  tenantId: string;
  storeId: string;
  productId: string;
  quantityOnHand?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  unitCost?: number;
  location?: string;
  batchNumber?: string;
  expiryDate?: Date;
}

export interface UpdateInventoryData {
  quantityOnHand?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  unitCost?: number;
  location?: string;
  batchNumber?: string;
  expiryDate?: Date;
}

export interface InventoryAdjustmentData {
  productId: string;
  quantity: number;
  reason: 'sale' | 'purchase' | 'adjustment' | 'return' | 'damage' | 'transfer';
  reference?: string;
  notes?: string;
}

export interface StockTakeData {
  productId: string;
  actualQuantity: number;
  notes?: string;
}

export interface InventoryWithProduct {
  id: string;
  tenantId: string;
  storeId: string;
  productId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastStockTakeDate?: Date;
  lastStockTakeQuantity?: number;
  unitCost?: number;
  location?: string;
  batchNumber?: string;
  expiryDate?: Date;
  product?: {
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
  };
  isLowStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class InventoryService {
  /**
   * Get all inventory for a store
   */
  static async getStoreInventory(storeId: string, tenantId: string, includeInactive: boolean = false): Promise<InventoryWithProduct[]> {
    try {
      const whereClause: any = { storeId, tenantId };

      if (!includeInactive) {
        whereClause.quantityOnHand = { [Op.gt]: 0 };
      }

      const inventories = await Inventory.findAll({
        where: whereClause,
        include: [
          {
            model: Product,
            as: 'product',
            required: true,
            attributes: ['id', 'name', 'sku', 'barcode'],
          },
        ],
        order: [
          [{ model: Product, as: 'product' }, 'name', 'ASC'],
        ],
      });

      return inventories.map(inventory => ({
        id: inventory.dataValues.id,
        tenantId: inventory.dataValues.tenantId,
        storeId: inventory.dataValues.storeId,
        productId: inventory.dataValues.productId,
        quantityOnHand: parseFloat(inventory.dataValues.quantityOnHand.toString()),
        quantityReserved: parseFloat(inventory.dataValues.quantityReserved.toString()),
        quantityAvailable: parseFloat(inventory.dataValues.quantityAvailable.toString()),
        reorderPoint: parseFloat(inventory.dataValues.reorderPoint.toString()),
        reorderQuantity: parseFloat(inventory.dataValues.reorderQuantity.toString()),
        lastStockTakeDate: inventory.dataValues.lastStockTakeDate,
        lastStockTakeQuantity: inventory.dataValues.lastStockTakeQuantity ? parseFloat(inventory.dataValues.lastStockTakeQuantity.toString()) : undefined,
        unitCost: inventory.dataValues.unitCost ? parseFloat(inventory.dataValues.unitCost.toString()) : undefined,
        location: inventory.dataValues.location,
        batchNumber: inventory.dataValues.batchNumber,
        expiryDate: inventory.dataValues.expiryDate,
        product: (inventory as any).product ? {
          id: (inventory as any).product.dataValues.id,
          name: (inventory as any).product.dataValues.name,
          sku: (inventory as any).product.dataValues.sku,
          barcode: (inventory as any).product.dataValues.barcode,
        } : undefined,
        isLowStock: parseFloat(inventory.dataValues.quantityAvailable.toString()) <= parseFloat(inventory.dataValues.reorderPoint.toString()),
        createdAt: inventory.dataValues.createdAt,
        updatedAt: inventory.dataValues.updatedAt,
      })) as InventoryWithProduct[];
    } catch (error) {
      logger.error('Error getting store inventory:', error);
      throw new Error('Failed to retrieve inventory');
    }
  }

  /**
   * Get inventory by product and store
   */
  static async getInventoryByProduct(productId: string, storeId: string, tenantId: string): Promise<InventoryWithProduct | null> {
    try {
      const inventory = await Inventory.findOne({
        where: { productId, storeId, tenantId },
        include: [
          {
            model: Product,
            as: 'product',
            required: true,
            attributes: ['id', 'name', 'sku', 'barcode'],
          },
        ],
      });

      if (!inventory) {
        return null;
      }

      return {
        id: inventory.dataValues.id,
        tenantId: inventory.dataValues.tenantId,
        storeId: inventory.dataValues.storeId,
        productId: inventory.dataValues.productId,
        quantityOnHand: parseFloat(inventory.dataValues.quantityOnHand.toString()),
        quantityReserved: parseFloat(inventory.dataValues.quantityReserved.toString()),
        quantityAvailable: parseFloat(inventory.dataValues.quantityAvailable.toString()),
        reorderPoint: parseFloat(inventory.dataValues.reorderPoint.toString()),
        reorderQuantity: parseFloat(inventory.dataValues.reorderQuantity.toString()),
        lastStockTakeDate: inventory.dataValues.lastStockTakeDate,
        lastStockTakeQuantity: inventory.dataValues.lastStockTakeQuantity ? parseFloat(inventory.dataValues.lastStockTakeQuantity.toString()) : undefined,
        unitCost: inventory.dataValues.unitCost ? parseFloat(inventory.dataValues.unitCost.toString()) : undefined,
        location: inventory.dataValues.location,
        batchNumber: inventory.dataValues.batchNumber,
        expiryDate: inventory.dataValues.expiryDate,
        product: (inventory as any).product ? {
          id: (inventory as any).product.dataValues.id,
          name: (inventory as any).product.dataValues.name,
          sku: (inventory as any).product.dataValues.sku,
          barcode: (inventory as any).product.dataValues.barcode,
        } : undefined,
        isLowStock: parseFloat(inventory.dataValues.quantityAvailable.toString()) <= parseFloat(inventory.dataValues.reorderPoint.toString()),
        createdAt: inventory.dataValues.createdAt,
        updatedAt: inventory.dataValues.updatedAt,
      } as InventoryWithProduct;
    } catch (error) {
      logger.error('Error getting inventory by product:', error);
      throw new Error('Failed to retrieve inventory');
    }
  }

  /**
   * Create or update inventory record
   */
  static async createOrUpdateInventory(inventoryData: CreateInventoryData): Promise<InventoryWithProduct> {
    try {
      // Check if product exists
      const product = await Product.findOne({
        where: { id: inventoryData.productId, tenantId: inventoryData.tenantId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const [inventory, created] = await Inventory.upsert({
        ...inventoryData,
        quantityOnHand: inventoryData.quantityOnHand || 0,
        quantityReserved: 0,
        quantityAvailable: inventoryData.quantityOnHand || 0,
        reorderPoint: inventoryData.reorderPoint || 0,
        reorderQuantity: inventoryData.reorderQuantity || 0,
      });

      logger.info(`Inventory ${created ? 'created' : 'updated'}: ${inventory.dataValues.id}`);
      const result = await this.getInventoryByProduct(inventory.dataValues.productId, inventory.dataValues.storeId, inventory.dataValues.tenantId);
      return result!;
    } catch (error: any) {
      logger.error('Error creating/updating inventory:', error);

      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error('Inventory record already exists for this product and store');
      }

      throw error;
    }
  }

  /**
   * Update inventory settings
   */
  static async updateInventory(productId: string, storeId: string, tenantId: string, updateData: UpdateInventoryData): Promise<InventoryWithProduct | null> {
    try {
      const [affectedRows] = await Inventory.update(updateData, {
        where: { productId, storeId, tenantId },
      });

      if (affectedRows === 0) {
        return null;
      }

      // Recalculate available quantity if on-hand quantity was updated
      if (updateData.quantityOnHand !== undefined) {
        const inventory = await Inventory.findOne({
          where: { productId, storeId, tenantId },
        });

        if (inventory) {
          const availableQuantity = parseFloat(inventory.dataValues.quantityOnHand.toString()) - parseFloat(inventory.dataValues.quantityReserved.toString());
          await Inventory.update(
            { quantityAvailable: availableQuantity },
            { where: { productId, storeId, tenantId } }
          );
        }
      }

      const updatedInventory = await this.getInventoryByProduct(productId, storeId, tenantId);
      logger.info(`Inventory updated: ${productId} in store ${storeId}`);
      return updatedInventory;
    } catch (error: any) {
      logger.error('Error updating inventory:', error);
      throw error;
    }
  }

  /**
   * Adjust inventory quantity (stock in/out)
   */
  static async adjustInventory(storeId: string, tenantId: string, adjustmentData: InventoryAdjustmentData): Promise<InventoryWithProduct> {
    const transaction = await Inventory.sequelize!.transaction();

    try {
      const inventory = await Inventory.findOne({
        where: { productId: adjustmentData.productId, storeId, tenantId },
        transaction,
        lock: Transaction.LOCK.UPDATE,
      });

      if (!inventory) {
        throw new Error('Inventory record not found');
      }

      const currentOnHand = parseFloat(inventory.dataValues.quantityOnHand.toString());
      const currentReserved = parseFloat(inventory.dataValues.quantityReserved.toString());
      const newOnHand = currentOnHand + adjustmentData.quantity;

      if (newOnHand < 0) {
        throw new Error('Insufficient inventory quantity');
      }

      const newAvailable = newOnHand - currentReserved;

      await Inventory.update(
        {
          quantityOnHand: newOnHand,
          quantityAvailable: newAvailable,
        },
        {
          where: { productId: adjustmentData.productId, storeId, tenantId },
          transaction,
        }
      );

      await transaction.commit();

      logger.info(`Inventory adjusted: ${adjustmentData.productId} by ${adjustmentData.quantity} (${adjustmentData.reason})`);
      const result = await this.getInventoryByProduct(adjustmentData.productId, storeId, tenantId);
      return result!;
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Error adjusting inventory:', error);
      throw error;
    }
  }

  /**
   * Reserve inventory for sale
   */
  static async reserveInventory(storeId: string, tenantId: string, productId: string, quantity: number): Promise<InventoryWithProduct> {
    const transaction = await Inventory.sequelize!.transaction();

    try {
      const inventory = await Inventory.findOne({
        where: { productId, storeId, tenantId },
        transaction,
        lock: Transaction.LOCK.UPDATE,
      });

      if (!inventory) {
        throw new Error('Inventory record not found');
      }

      const currentAvailable = parseFloat(inventory.dataValues.quantityAvailable.toString());

      if (currentAvailable < quantity) {
        throw new Error('Insufficient available inventory');
      }

      const newReserved = parseFloat(inventory.dataValues.quantityReserved.toString()) + quantity;
      const newAvailable = currentAvailable - quantity;

      await Inventory.update(
        {
          quantityReserved: newReserved,
          quantityAvailable: newAvailable,
        },
        {
          where: { productId, storeId, tenantId },
          transaction,
        }
      );

      await transaction.commit();

      logger.info(`Inventory reserved: ${productId} quantity ${quantity}`);
      const result = await this.getInventoryByProduct(productId, storeId, tenantId);
      return result!;
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Error reserving inventory:', error);
      throw error;
    }
  }

  /**
   * Release reserved inventory
   */
  static async releaseReservedInventory(storeId: string, tenantId: string, productId: string, quantity: number): Promise<InventoryWithProduct> {
    const transaction = await Inventory.sequelize!.transaction();

    try {
      const inventory = await Inventory.findOne({
        where: { productId, storeId, tenantId },
        transaction,
        lock: Transaction.LOCK.UPDATE,
      });

      if (!inventory) {
        throw new Error('Inventory record not found');
      }

      const currentReserved = parseFloat(inventory.dataValues.quantityReserved.toString());

      if (currentReserved < quantity) {
        throw new Error('Cannot release more than reserved quantity');
      }

      const newReserved = currentReserved - quantity;
      const newAvailable = parseFloat(inventory.dataValues.quantityAvailable.toString()) + quantity;

      await Inventory.update(
        {
          quantityReserved: newReserved,
          quantityAvailable: newAvailable,
        },
        {
          where: { productId, storeId, tenantId },
          transaction,
        }
      );

      await transaction.commit();

      logger.info(`Inventory reservation released: ${productId} quantity ${quantity}`);
      const result = await this.getInventoryByProduct(productId, storeId, tenantId);
      return result!;
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Error releasing reserved inventory:', error);
      throw error;
    }
  }

  /**
   * Perform stock take
   */
  static async performStockTake(storeId: string, tenantId: string, stockTakeData: StockTakeData): Promise<InventoryWithProduct> {
    const transaction = await Inventory.sequelize!.transaction();

    try {
      const inventory = await Inventory.findOne({
        where: { productId: stockTakeData.productId, storeId, tenantId },
        transaction,
        lock: Transaction.LOCK.UPDATE,
      });

      if (!inventory) {
        throw new Error('Inventory record not found');
      }

      const currentOnHand = parseFloat(inventory.dataValues.quantityOnHand.toString());
      const adjustment = stockTakeData.actualQuantity - currentOnHand;

      await Inventory.update(
        {
          quantityOnHand: stockTakeData.actualQuantity,
          quantityAvailable: stockTakeData.actualQuantity - parseFloat(inventory.dataValues.quantityReserved.toString()),
          lastStockTakeDate: new Date(),
          lastStockTakeQuantity: stockTakeData.actualQuantity,
        },
        {
          where: { productId: stockTakeData.productId, storeId, tenantId },
          transaction,
        }
      );

      await transaction.commit();

      logger.info(`Stock take performed: ${stockTakeData.productId} adjusted by ${adjustment}`);
      const result = await this.getInventoryByProduct(stockTakeData.productId, storeId, tenantId);
      return result!;
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Error performing stock take:', error);
      throw error;
    }
  }

  /**
   * Get low stock items
   */
  static async getLowStockItems(storeId: string, tenantId: string): Promise<InventoryWithProduct[]> {
    try {
      const inventories = await Inventory.findAll({
        where: {
          storeId,
          tenantId,
          [Op.and]: [
            Inventory.sequelize!.literal('quantity_available <= reorder_point'),
            Inventory.sequelize!.literal('quantity_available > 0'),
          ],
        },
        include: [
          {
            model: Product,
            as: 'product',
            required: true,
            attributes: ['id', 'name', 'sku', 'barcode'],
          },
        ],
        order: [
          ['quantityAvailable', 'ASC'],
          [{ model: Product, as: 'product' }, 'name', 'ASC'],
        ],
      });

      return inventories.map(inventory => ({
        id: inventory.dataValues.id,
        tenantId: inventory.dataValues.tenantId,
        storeId: inventory.dataValues.storeId,
        productId: inventory.dataValues.productId,
        quantityOnHand: parseFloat(inventory.dataValues.quantityOnHand.toString()),
        quantityReserved: parseFloat(inventory.dataValues.quantityReserved.toString()),
        quantityAvailable: parseFloat(inventory.dataValues.quantityAvailable.toString()),
        reorderPoint: parseFloat(inventory.dataValues.reorderPoint.toString()),
        reorderQuantity: parseFloat(inventory.dataValues.reorderQuantity.toString()),
        lastStockTakeDate: inventory.dataValues.lastStockTakeDate,
        lastStockTakeQuantity: inventory.dataValues.lastStockTakeQuantity ? parseFloat(inventory.dataValues.lastStockTakeQuantity.toString()) : undefined,
        unitCost: inventory.dataValues.unitCost ? parseFloat(inventory.dataValues.unitCost.toString()) : undefined,
        location: inventory.dataValues.location,
        batchNumber: inventory.dataValues.batchNumber,
        expiryDate: inventory.dataValues.expiryDate,
        product: (inventory as any).product ? {
          id: (inventory as any).product.dataValues.id,
          name: (inventory as any).product.dataValues.name,
          sku: (inventory as any).product.dataValues.sku,
          barcode: (inventory as any).product.dataValues.barcode,
        } : undefined,
        isLowStock: true,
        createdAt: inventory.dataValues.createdAt,
        updatedAt: inventory.dataValues.updatedAt,
      })) as InventoryWithProduct[];
    } catch (error) {
      logger.error('Error getting low stock items:', error);
      throw new Error('Failed to retrieve low stock items');
    }
  }

  /**
   * Get expiring items
   */
  static async getExpiringItems(storeId: string, tenantId: string, daysAhead: number = 30): Promise<InventoryWithProduct[]> {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysAhead);

      const inventories = await Inventory.findAll({
        where: {
          storeId,
          tenantId,
          expiryDate: {
            [Op.lte]: expiryDate,
            [Op.not]: null as any,
          },
          quantityOnHand: { [Op.gt]: 0 },
        },
        include: [
          {
            model: Product,
            as: 'product',
            required: true,
            attributes: ['id', 'name', 'sku', 'barcode'],
          },
        ],
        order: [
          ['expiryDate', 'ASC'],
          [{ model: Product, as: 'product' }, 'name', 'ASC'],
        ],
      });

      return inventories.map(inventory => ({
        id: inventory.dataValues.id,
        tenantId: inventory.dataValues.tenantId,
        storeId: inventory.dataValues.storeId,
        productId: inventory.dataValues.productId,
        quantityOnHand: parseFloat(inventory.dataValues.quantityOnHand.toString()),
        quantityReserved: parseFloat(inventory.dataValues.quantityReserved.toString()),
        quantityAvailable: parseFloat(inventory.dataValues.quantityAvailable.toString()),
        reorderPoint: parseFloat(inventory.dataValues.reorderPoint.toString()),
        reorderQuantity: parseFloat(inventory.dataValues.reorderQuantity.toString()),
        lastStockTakeDate: inventory.dataValues.lastStockTakeDate,
        lastStockTakeQuantity: inventory.dataValues.lastStockTakeQuantity ? parseFloat(inventory.dataValues.lastStockTakeQuantity.toString()) : undefined,
        unitCost: inventory.dataValues.unitCost ? parseFloat(inventory.dataValues.unitCost.toString()) : undefined,
        location: inventory.dataValues.location,
        batchNumber: inventory.dataValues.batchNumber,
        expiryDate: inventory.dataValues.expiryDate,
        product: (inventory as any).product ? {
          id: (inventory as any).product.dataValues.id,
          name: (inventory as any).product.dataValues.name,
          sku: (inventory as any).product.dataValues.sku,
          barcode: (inventory as any).product.dataValues.barcode,
        } : undefined,
        isLowStock: parseFloat(inventory.dataValues.quantityAvailable.toString()) <= parseFloat(inventory.dataValues.reorderPoint.toString()),
        createdAt: inventory.dataValues.createdAt,
        updatedAt: inventory.dataValues.updatedAt,
      })) as InventoryWithProduct[];
    } catch (error) {
      logger.error('Error getting expiring items:', error);
      throw new Error('Failed to retrieve expiring items');
    }
  }

  /**
   * Get inventory statistics
   */
  static async getInventoryStats(storeId: string, tenantId: string): Promise<any> {
    try {
      const totalItems = await Inventory.count({
        where: { storeId, tenantId },
      });

      const lowStockItems = await Inventory.count({
        where: {
          storeId,
          tenantId,
          [Op.and]: [
            Inventory.sequelize!.literal('quantity_available <= reorder_point'),
            Inventory.sequelize!.literal('quantity_available > 0'),
          ],
        },
      });

      const outOfStockItems = await Inventory.count({
        where: {
          storeId,
          tenantId,
          quantityAvailable: { [Op.lte]: 0 },
        },
      });

      const totalValue = await Inventory.sum('unitCost', {
        where: {
          storeId,
          tenantId,
          unitCost: { [Op.not]: null as any },
        },
      });

      const expiringSoon = await Inventory.count({
        where: {
          storeId,
          tenantId,
          expiryDate: {
            [Op.lte]: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            [Op.not]: null as any,
          },
          quantityOnHand: { [Op.gt]: 0 },
        },
      });

      return {
        totalItems,
        lowStockItems,
        outOfStockItems,
        totalValue: totalValue ? parseFloat(totalValue.toString()) : 0,
        expiringSoon,
      };
    } catch (error) {
      logger.error('Error getting inventory stats:', error);
      throw new Error('Failed to get inventory statistics');
    }
  }

  /**
   * Delete inventory record
   */
  static async deleteInventory(productId: string, storeId: string, tenantId: string): Promise<boolean> {
    try {
      const deletedRows = await Inventory.destroy({
        where: { productId, storeId, tenantId },
      });

      if (deletedRows > 0) {
        logger.info(`Inventory deleted: ${productId} in store ${storeId}`);
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('Error deleting inventory:', error);
      throw error;
    }
  }

  /**
   * Get inventory across all stores for a tenant (Centralized Inventory Visibility)
   */
  static async getTenantInventory(tenantId: string, filters?: {
    storeIds?: string[];
    productIds?: string[];
    includeInactive?: boolean;
    lowStockOnly?: boolean;
    categoryId?: string;
  }): Promise<InventoryWithProduct[]> {
    try {
      const whereClause: any = { tenantId };

      if (filters?.storeIds && filters.storeIds.length > 0) {
        whereClause.storeId = { [Op.in]: filters.storeIds };
      }

      if (filters?.productIds && filters.productIds.length > 0) {
        whereClause.productId = { [Op.in]: filters.productIds };
      }

      if (!filters?.includeInactive) {
        whereClause.quantityOnHand = { [Op.gt]: 0 };
      }

      if (filters?.lowStockOnly) {
        whereClause[Op.and] = [
          Inventory.sequelize!.literal('quantity_available <= reorder_point'),
          Inventory.sequelize!.literal('quantity_available > 0'),
        ];
      }

      let includeConditions: any[] = [
        {
          model: Product,
          as: 'product',
          required: true,
          attributes: ['id', 'name', 'sku', 'barcode'],
        },
      ];

      if (filters?.categoryId) {
        includeConditions[0].where = { categoryId: filters.categoryId };
        includeConditions[0].required = true;
      }

      const inventories = await Inventory.findAll({
        where: whereClause,
        include: includeConditions,
        order: [
          [{ model: Product, as: 'product' }, 'name', 'ASC'],
          ['storeId', 'ASC'],
        ],
      });

      return inventories.map(inventory => ({
        id: inventory.dataValues.id,
        tenantId: inventory.dataValues.tenantId,
        storeId: inventory.dataValues.storeId,
        productId: inventory.dataValues.productId,
        quantityOnHand: parseFloat(inventory.dataValues.quantityOnHand.toString()),
        quantityReserved: parseFloat(inventory.dataValues.quantityReserved.toString()),
        quantityAvailable: parseFloat(inventory.dataValues.quantityAvailable.toString()),
        reorderPoint: parseFloat(inventory.dataValues.reorderPoint.toString()),
        reorderQuantity: parseFloat(inventory.dataValues.reorderQuantity.toString()),
        lastStockTakeDate: inventory.dataValues.lastStockTakeDate,
        lastStockTakeQuantity: inventory.dataValues.lastStockTakeQuantity ? parseFloat(inventory.dataValues.lastStockTakeQuantity.toString()) : undefined,
        unitCost: inventory.dataValues.unitCost ? parseFloat(inventory.dataValues.unitCost.toString()) : undefined,
        location: inventory.dataValues.location,
        batchNumber: inventory.dataValues.batchNumber,
        expiryDate: inventory.dataValues.expiryDate,
        product: (inventory as any).product ? {
          id: (inventory as any).product.dataValues.id,
          name: (inventory as any).product.dataValues.name,
          sku: (inventory as any).product.dataValues.sku,
          barcode: (inventory as any).product.dataValues.barcode,
        } : undefined,
        isLowStock: parseFloat(inventory.dataValues.quantityAvailable.toString()) <= parseFloat(inventory.dataValues.reorderPoint.toString()),
        createdAt: inventory.dataValues.createdAt,
        updatedAt: inventory.dataValues.updatedAt,
      })) as InventoryWithProduct[];
    } catch (error) {
      logger.error('Error getting tenant inventory:', error);
      throw new Error('Failed to retrieve tenant inventory');
    }
  }

  /**
   * Get inventory by product across all stores
   */
  static async getProductInventoryAcrossStores(productId: string, tenantId: string): Promise<InventoryWithProduct[]> {
    try {
      const inventories = await Inventory.findAll({
        where: { productId, tenantId },
        include: [
          {
            model: Product,
            as: 'product',
            required: true,
            attributes: ['id', 'name', 'sku', 'barcode'],
          },
        ],
        order: [['storeId', 'ASC']],
      });

      return inventories.map(inventory => ({
        id: inventory.dataValues.id,
        tenantId: inventory.dataValues.tenantId,
        storeId: inventory.dataValues.storeId,
        productId: inventory.dataValues.productId,
        quantityOnHand: parseFloat(inventory.dataValues.quantityOnHand.toString()),
        quantityReserved: parseFloat(inventory.dataValues.quantityReserved.toString()),
        quantityAvailable: parseFloat(inventory.dataValues.quantityAvailable.toString()),
        reorderPoint: parseFloat(inventory.dataValues.reorderPoint.toString()),
        reorderQuantity: parseFloat(inventory.dataValues.reorderQuantity.toString()),
        lastStockTakeDate: inventory.dataValues.lastStockTakeDate,
        lastStockTakeQuantity: inventory.dataValues.lastStockTakeQuantity ? parseFloat(inventory.dataValues.lastStockTakeQuantity.toString()) : undefined,
        unitCost: inventory.dataValues.unitCost ? parseFloat(inventory.dataValues.unitCost.toString()) : undefined,
        location: inventory.dataValues.location,
        batchNumber: inventory.dataValues.batchNumber,
        expiryDate: inventory.dataValues.expiryDate,
        product: (inventory as any).product ? {
          id: (inventory as any).product.dataValues.id,
          name: (inventory as any).product.dataValues.name,
          sku: (inventory as any).product.dataValues.sku,
          barcode: (inventory as any).product.dataValues.barcode,
        } : undefined,
        isLowStock: parseFloat(inventory.dataValues.quantityAvailable.toString()) <= parseFloat(inventory.dataValues.reorderPoint.toString()),
        createdAt: inventory.dataValues.createdAt,
        updatedAt: inventory.dataValues.updatedAt,
      })) as InventoryWithProduct[];
    } catch (error) {
      logger.error('Error getting product inventory across stores:', error);
      throw new Error('Failed to retrieve product inventory across stores');
    }
  }

  /**
   * Get low stock items across all stores for a tenant
   */
  static async getTenantLowStockItems(tenantId: string, storeIds?: string[]): Promise<InventoryWithProduct[]> {
    try {
      const whereClause: any = {
        tenantId,
        [Op.and]: [
          Inventory.sequelize!.literal('quantity_available <= reorder_point'),
          Inventory.sequelize!.literal('quantity_available > 0'),
        ],
      };

      if (storeIds && storeIds.length > 0) {
        whereClause.storeId = { [Op.in]: storeIds };
      }

      const inventories = await Inventory.findAll({
        where: whereClause,
        include: [
          {
            model: Product,
            as: 'product',
            required: true,
            attributes: ['id', 'name', 'sku', 'barcode'],
          },
        ],
        order: [
          ['quantityAvailable', 'ASC'],
          [{ model: Product, as: 'product' }, 'name', 'ASC'],
          ['storeId', 'ASC'],
        ],
      });

      return inventories.map(inventory => ({
        id: inventory.dataValues.id,
        tenantId: inventory.dataValues.tenantId,
        storeId: inventory.dataValues.storeId,
        productId: inventory.dataValues.productId,
        quantityOnHand: parseFloat(inventory.dataValues.quantityOnHand.toString()),
        quantityReserved: parseFloat(inventory.dataValues.quantityReserved.toString()),
        quantityAvailable: parseFloat(inventory.dataValues.quantityAvailable.toString()),
        reorderPoint: parseFloat(inventory.dataValues.reorderPoint.toString()),
        reorderQuantity: parseFloat(inventory.dataValues.reorderQuantity.toString()),
        lastStockTakeDate: inventory.dataValues.lastStockTakeDate,
        lastStockTakeQuantity: inventory.dataValues.lastStockTakeQuantity ? parseFloat(inventory.dataValues.lastStockTakeQuantity.toString()) : undefined,
        unitCost: inventory.dataValues.unitCost ? parseFloat(inventory.dataValues.unitCost.toString()) : undefined,
        location: inventory.dataValues.location,
        batchNumber: inventory.dataValues.batchNumber,
        expiryDate: inventory.dataValues.expiryDate,
        product: (inventory as any).product ? {
          id: (inventory as any).product.dataValues.id,
          name: (inventory as any).product.dataValues.name,
          sku: (inventory as any).product.dataValues.sku,
          barcode: (inventory as any).product.dataValues.barcode,
        } : undefined,
        isLowStock: true,
        createdAt: inventory.dataValues.createdAt,
        updatedAt: inventory.dataValues.updatedAt,
      })) as InventoryWithProduct[];
    } catch (error) {
      logger.error('Error getting tenant low stock items:', error);
      throw new Error('Failed to retrieve tenant low stock items');
    }
  }

  /**
   * Get inventory statistics across all stores for a tenant
   */
  static async getTenantInventoryStats(tenantId: string, storeIds?: string[]): Promise<any> {
    try {
      const whereClause: any = { tenantId };
      if (storeIds && storeIds.length > 0) {
        whereClause.storeId = { [Op.in]: storeIds };
      }

      const totalItems = await Inventory.count({
        where: whereClause,
      });

      const lowStockItems = await Inventory.count({
        where: {
          ...whereClause,
          [Op.and]: [
            Inventory.sequelize!.literal('quantity_available <= reorder_point'),
            Inventory.sequelize!.literal('quantity_available > 0'),
          ],
        },
      });

      const outOfStockItems = await Inventory.count({
        where: {
          ...whereClause,
          quantityAvailable: { [Op.lte]: 0 },
        },
      });

      const totalValue = await Inventory.sum('unitCost', {
        where: {
          ...whereClause,
          unitCost: { [Op.not]: null as any },
        },
      });

      const expiringSoon = await Inventory.count({
        where: {
          ...whereClause,
          expiryDate: {
            [Op.lte]: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            [Op.not]: null as any,
          },
          quantityOnHand: { [Op.gt]: 0 },
        },
      });

      // Get per-store breakdown
      const storeStats = await Inventory.findAll({
        where: whereClause,
        attributes: [
          'storeId',
          [Inventory.sequelize!.fn('COUNT', Inventory.sequelize!.col('id')), 'itemCount'],
          [Inventory.sequelize!.fn('SUM', Inventory.sequelize!.col('quantity_on_hand')), 'totalQuantity'],
          [Inventory.sequelize!.fn('SUM', Inventory.sequelize!.literal('quantity_on_hand * unit_cost')), 'totalValue'],
        ],
        group: ['storeId'],
        raw: true,
      });

      return {
        totalItems,
        lowStockItems,
        outOfStockItems,
        totalValue: totalValue ? parseFloat(totalValue.toString()) : 0,
        expiringSoon,
        storeBreakdown: storeStats.map(stat => ({
          storeId: (stat as any).storeId,
          itemCount: parseInt((stat as any).itemCount as string),
          totalQuantity: parseFloat((stat as any).totalQuantity as string) || 0,
          totalValue: parseFloat((stat as any).totalValue as string) || 0,
        })),
      };
    } catch (error) {
      logger.error('Error getting tenant inventory stats:', error);
      throw new Error('Failed to get tenant inventory statistics');
    }
  }
}