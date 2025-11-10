import { Transaction, Op } from 'sequelize';
import sequelize from '@/config/database';
import {
  BulkInventoryTransfer,
  BulkInventoryTransferItem,
  InventoryTransfer,
  Inventory,
  Product,
  Store,
  User
} from '../db/models';
import logger from '../config/logger';

export interface BulkTransferItemData {
  productId: string;
  quantity: number;
  unitCost?: number;
  notes?: string;
}

export interface CreateBulkTransferData {
  sourceStoreId: string;
  destinationStoreId: string;
  title: string;
  description?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  transferType?: 'replenishment' | 'allocation' | 'return' | 'adjustment' | 'emergency';
  scheduledShipDate?: Date;
  scheduledReceiveDate?: Date;
  items: BulkTransferItemData[];
  notes?: string;
  reference?: string;
}

export interface BulkTransferWithItems extends BulkInventoryTransfer {
  transferItems?: BulkInventoryTransferItem[];
  individualTransfers?: InventoryTransfer[];
}

class BulkInventoryTransferService {
  /**
   * Generate a unique bulk transfer number
   */
  private static async generateBulkTransferNumber(tenantId: string): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = date.getTime().toString().slice(-4);

    let counter = 1;
    let transferNumber: string;

    do {
      transferNumber = `BT-${dateStr}-${timestamp}-${counter.toString().padStart(3, '0')}`;
      const existing = await BulkInventoryTransfer.findOne({
        where: { bulkTransferNumber: transferNumber, tenantId }
      });
      if (!existing) break;
      counter++;
    } while (counter < 1000);

    return transferNumber;
  }

  /**
   * Create a bulk inventory transfer
   */
  static async createBulkTransfer(
    tenantId: string,
    userId: string,
    transferData: CreateBulkTransferData
  ): Promise<BulkTransferWithItems> {
    const transaction = await sequelize.transaction();

    try {
      // Validate stores exist and belong to tenant
      const [sourceStore, destinationStore] = await Promise.all([
        Store.findOne({ where: { id: transferData.sourceStoreId, tenantId } }),
        Store.findOne({ where: { id: transferData.destinationStoreId, tenantId } })
      ]);

      if (!sourceStore || !destinationStore) {
        throw new Error('Source or destination store not found');
      }

      if (transferData.sourceStoreId === transferData.destinationStoreId) {
        throw new Error('Source and destination stores cannot be the same');
      }

      // Validate products and check inventory availability
      const productIds = transferData.items.map(item => item.productId);
      const products = await Product.findAll({
        where: { id: { [Op.in]: productIds }, tenantId }
      });

      if (products.length !== productIds.length) {
        throw new Error('One or more products not found');
      }

      // Check inventory availability for source store
      for (const item of transferData.items) {
        const inventory = await Inventory.findOne({
          where: {
            storeId: transferData.sourceStoreId,
            productId: item.productId,
            tenantId
          }
        });

        if (!inventory || parseFloat(inventory.dataValues.quantityAvailable.toString()) < item.quantity) {
          throw new Error(`Insufficient inventory for product ${item.productId} in source store`);
        }
      }

      // Generate bulk transfer number
      const bulkTransferNumber = await this.generateBulkTransferNumber(tenantId);

      // Calculate totals
      const totalItems = transferData.items.length;
      const totalQuantity = transferData.items.reduce((sum, item) => sum + item.quantity, 0);
      const totalValue = transferData.items.reduce((sum, item) => {
        return sum + (item.unitCost || 0) * item.quantity;
      }, 0);

      // Create bulk transfer
      const createData: any = {
        tenantId,
        bulkTransferNumber,
        sourceStoreId: transferData.sourceStoreId,
        destinationStoreId: transferData.destinationStoreId,
        title: transferData.title,
        status: 'draft',
        priority: transferData.priority || 'normal',
        transferType: transferData.transferType || 'replenishment',
        requestedBy: userId,
        totalItems,
        totalQuantity,
      };

      if (transferData.description !== undefined) createData.description = transferData.description;
      if (transferData.scheduledShipDate !== undefined) createData.scheduledShipDate = transferData.scheduledShipDate;
      if (transferData.scheduledReceiveDate !== undefined) createData.scheduledReceiveDate = transferData.scheduledReceiveDate;
      if (totalValue !== undefined) createData.totalValue = totalValue;
      if (transferData.notes !== undefined) createData.notes = transferData.notes;
      if (transferData.reference !== undefined) createData.reference = transferData.reference;

      const bulkTransfer = await BulkInventoryTransfer.create(createData, { transaction });

      // Create bulk transfer items
      const transferItems = await Promise.all(
        transferData.items.map(item => {
          const itemData: any = {
            bulkTransferId: bulkTransfer.dataValues.id,
            productId: item.productId,
            quantity: item.quantity,
          };

          if (item.unitCost !== undefined) itemData.unitCost = item.unitCost;
          if (item.unitCost !== undefined) itemData.lineTotal = item.unitCost * item.quantity;
          if (item.notes !== undefined) itemData.notes = item.notes;

          return BulkInventoryTransferItem.create(itemData, { transaction });
        })
      );

      await transaction.commit();

      logger.info(`Created bulk transfer ${bulkTransferNumber} with ${totalItems} items for tenant ${tenantId}`);

      return bulkTransfer;
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Create bulk transfer error:', error);
      throw new Error(error.message || 'Failed to create bulk transfer');
    }
  }

  /**
   * Submit bulk transfer for approval
   */
  static async submitBulkTransfer(
    bulkTransferId: string,
    tenantId: string,
    userId: string
  ): Promise<BulkInventoryTransfer> {
    const transaction = await sequelize.transaction();

    try {
      const bulkTransfer = await BulkInventoryTransfer.findOne({
        where: { id: bulkTransferId, tenantId },
        transaction
      });

      if (!bulkTransfer) {
        throw new Error('Bulk transfer not found');
      }

      if (bulkTransfer.dataValues.status !== 'draft') {
        throw new Error('Only draft transfers can be submitted for approval');
      }

      // Update status to pending
      await bulkTransfer.update({ status: 'pending' }, { transaction });

      await transaction.commit();

      logger.info(`Submitted bulk transfer ${bulkTransfer.dataValues.bulkTransferNumber} for approval`);

      return bulkTransfer;
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Submit bulk transfer error:', error);
      throw new Error(error.message || 'Failed to submit bulk transfer');
    }
  }

  /**
   * Approve bulk transfer and create individual transfers
   */
  static async approveBulkTransfer(
    bulkTransferId: string,
    tenantId: string,
    userId: string,
    notes?: string
  ): Promise<BulkTransferWithItems> {
    const transaction = await sequelize.transaction();

    try {
      const bulkTransfer = await BulkInventoryTransfer.findOne({
        where: { id: bulkTransferId, tenantId },
        include: [{ model: BulkInventoryTransferItem, as: 'transferItems' }],
        transaction
      });

      if (!bulkTransfer) {
        throw new Error('Bulk transfer not found');
      }

      if (bulkTransfer.dataValues.status !== 'pending') {
        throw new Error('Only pending transfers can be approved');
      }

      // Update bulk transfer status
      const updateData: any = {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
      };

      if (notes !== undefined) updateData.notes = notes || bulkTransfer.dataValues.notes;

      await bulkTransfer.update(updateData, { transaction });

      // Create individual inventory transfers
      const individualTransfers = await Promise.all(
        (bulkTransfer as any).transferItems!.map(async (item: BulkInventoryTransferItem) => {
          const transferNumber = await this.generateTransferNumber(tenantId);

          const transferData: any = {
            tenantId,
            transferNumber,
            sourceStoreId: bulkTransfer.dataValues.sourceStoreId,
            destinationStoreId: bulkTransfer.dataValues.destinationStoreId,
            productId: item.dataValues.productId,
            quantity: item.dataValues.quantity,
            status: 'approved',
            requestedBy: bulkTransfer.dataValues.requestedBy,
            approvedBy: userId,
            approvedAt: new Date(),
            notes: `Part of bulk transfer ${bulkTransfer.dataValues.bulkTransferNumber}: ${item.dataValues.notes || ''}`,
          };

          if (item.dataValues.unitCost !== undefined) transferData.unitCost = item.dataValues.unitCost;
          if (bulkTransfer.dataValues.reference !== undefined) transferData.reference = bulkTransfer.dataValues.reference;

          return InventoryTransfer.create(transferData, { transaction });
        })
      );

      await transaction.commit();

      logger.info(`Approved bulk transfer ${bulkTransfer.dataValues.bulkTransferNumber} and created ${individualTransfers.length} individual transfers`);

      return {
        ...bulkTransfer,
        individualTransfers,
      } as BulkTransferWithItems;
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Approve bulk transfer error:', error);
      throw new Error(error.message || 'Failed to approve bulk transfer');
    }
  }

  /**
   * Generate a unique transfer number for individual transfers
   */
  private static async generateTransferNumber(tenantId: string): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = date.getTime().toString().slice(-4);

    let counter = 1;
    let transferNumber: string;

    do {
      transferNumber = `IT-${dateStr}-${timestamp}-${counter.toString().padStart(3, '0')}`;
      const existing = await InventoryTransfer.findOne({
        where: { transferNumber, tenantId }
      });
      if (!existing) break;
      counter++;
    } while (counter < 1000);

    return transferNumber;
  }

  /**
   * Get bulk transfers with filtering
   */
  static async getBulkTransfers(
    tenantId: string,
    filters?: {
      status?: string[];
      sourceStoreId?: string;
      destinationStoreId?: string;
      transferType?: string[];
      priority?: string[];
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ transfers: BulkTransferWithItems[]; total: number }> {
    try {
      const whereClause: any = { tenantId };

      if (filters?.status && filters.status.length > 0) {
        whereClause.status = { [Op.in]: filters.status };
      }

      if (filters?.sourceStoreId) {
        whereClause.sourceStoreId = filters.sourceStoreId;
      }

      if (filters?.destinationStoreId) {
        whereClause.destinationStoreId = filters.destinationStoreId;
      }

      if (filters?.transferType && filters.transferType.length > 0) {
        whereClause.transferType = { [Op.in]: filters.transferType };
      }

      if (filters?.priority && filters.priority.length > 0) {
        whereClause.priority = { [Op.in]: filters.priority };
      }

      if (filters?.startDate || filters?.endDate) {
        whereClause.createdAt = {};
        if (filters.startDate) whereClause.createdAt[Op.gte] = filters.startDate;
        if (filters.endDate) whereClause.createdAt[Op.lte] = filters.endDate;
      }

      const { count: total, rows: transfers } = await BulkInventoryTransfer.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: BulkInventoryTransferItem,
            as: 'transferItems',
            required: false,
          },
          {
            model: Store,
            as: 'sourceStore',
            attributes: ['id', 'name'],
          },
          {
            model: Store,
            as: 'destinationStore',
            attributes: ['id', 'name'],
          },
          {
            model: User,
            as: 'requester',
            attributes: ['id', 'firstName', 'lastName'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
      });

      return { transfers, total };
    } catch (error) {
      logger.error('Get bulk transfers error:', error);
      throw new Error('Failed to retrieve bulk transfers');
    }
  }

  /**
   * Get bulk transfer by ID with full details
   */
  static async getBulkTransferById(
    bulkTransferId: string,
    tenantId: string
  ): Promise<BulkTransferWithItems | null> {
    try {
      const bulkTransfer = await BulkInventoryTransfer.findOne({
        where: { id: bulkTransferId, tenantId },
        include: [
          {
            model: BulkInventoryTransferItem,
            as: 'transferItems',
            include: [{
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku'],
            }],
          },
          {
            model: InventoryTransfer,
            as: 'individualTransfers',
            required: false,
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'sku'],
              },
            ],
          },
          {
            model: Store,
            as: 'sourceStore',
            attributes: ['id', 'name'],
          },
          {
            model: Store,
            as: 'destinationStore',
            attributes: ['id', 'name'],
          },
          {
            model: User,
            as: 'requester',
            attributes: ['id', 'firstName', 'lastName'],
          },
          {
            model: User,
            as: 'approver',
            attributes: ['id', 'firstName', 'lastName'],
            required: false,
          },
        ],
      });

      return bulkTransfer;
    } catch (error) {
      logger.error('Get bulk transfer by ID error:', error);
      throw new Error('Failed to retrieve bulk transfer');
    }
  }

  /**
   * Cancel bulk transfer
   */
  static async cancelBulkTransfer(
    bulkTransferId: string,
    tenantId: string,
    userId: string,
    reason?: string
  ): Promise<BulkInventoryTransfer> {
    const transaction = await sequelize.transaction();

    try {
      const bulkTransfer = await BulkInventoryTransfer.findOne({
        where: { id: bulkTransferId, tenantId },
        transaction
      });

      if (!bulkTransfer) {
        throw new Error('Bulk transfer not found');
      }

      if (!['draft', 'pending', 'approved'].includes(bulkTransfer.dataValues.status)) {
        throw new Error('Transfer cannot be cancelled at this stage');
      }

      // Update bulk transfer status
      const updateData: any = {
        status: 'cancelled',
      };

      if (reason !== undefined) {
        updateData.notes = reason ? `${bulkTransfer.dataValues.notes || ''}\nCancellation reason: ${reason}` : bulkTransfer.dataValues.notes;
      }

      await bulkTransfer.update(updateData, { transaction });

      // Cancel any individual transfers that were created
      if (bulkTransfer.dataValues.status === 'approved') {
        await InventoryTransfer.update(
          { status: 'cancelled' },
          {
            where: {
              tenantId,
              reference: bulkTransfer.dataValues.bulkTransferNumber,
              status: { [Op.in]: ['approved', 'pending'] }
            },
            transaction
          }
        );
      }

      await transaction.commit();

      logger.info(`Cancelled bulk transfer ${bulkTransfer.dataValues.bulkTransferNumber}`);

      return bulkTransfer;
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Cancel bulk transfer error:', error);
      throw new Error(error.message || 'Failed to cancel bulk transfer');
    }
  }
}

export default BulkInventoryTransferService;