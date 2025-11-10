import { InventoryTransfer, Inventory, Store, Product, User, Tenant } from '../db/models';
import { Op, Transaction } from 'sequelize';
import { InventoryService } from './inventory.service';
import logger from '../config/logger';

export interface CreateTransferData {
  tenantId: string;
  sourceStoreId: string;
  destinationStoreId: string;
  productId: string;
  quantity: number;
  notes?: string;
  reference?: string;
}

export interface TransferWithDetails {
  id: string;
  tenantId: string;
  transferNumber: string;
  sourceStoreId: string;
  destinationStoreId: string;
  productId: string;
  quantity: number;
  unitCost?: number;
  status: 'pending' | 'approved' | 'rejected' | 'in_transit' | 'completed' | 'cancelled';
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  shippedAt?: Date;
  receivedAt?: Date;
  notes?: string;
  reference?: string;
  sourceStore?: {
    id: string;
    name: string;
  };
  destinationStore?: {
    id: string;
    name: string;
  };
  product?: {
    id: string;
    name: string;
    sku?: string;
  };
  requester?: {
    id: string;
    name: string;
    email: string;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class InventoryTransferService {
  /**
   * Generate a unique transfer number
   */
  private static async generateTransferNumber(tenantId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Get the next sequence number for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastTransfer = await InventoryTransfer.findOne({
      where: {
        tenantId,
        createdAt: {
          [Op.gte]: today,
        },
      },
      order: [['createdAt', 'DESC']],
    });

    let sequence = 1;
    if (lastTransfer) {
      const lastNumber = lastTransfer.transferNumber;
      const parts = lastNumber.split('-');
      if (parts.length === 2 && parts[1]) {
        sequence = parseInt(parts[1]) + 1;
      }
    }

    return `TRF-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Create a new inventory transfer request
   */
  static async createTransfer(requestedBy: string, transferData: CreateTransferData): Promise<TransferWithDetails> {
    const transaction = await InventoryTransfer.sequelize!.transaction();

    try {
      // Validate stores exist and belong to tenant
      const [sourceStore, destinationStore] = await Promise.all([
        Store.findOne({
          where: { id: transferData.sourceStoreId, tenantId: transferData.tenantId },
          transaction,
        }),
        Store.findOne({
          where: { id: transferData.destinationStoreId, tenantId: transferData.tenantId },
          transaction,
        }),
      ]);

      if (!sourceStore) {
        throw new Error('Source store not found');
      }

      if (!destinationStore) {
        throw new Error('Destination store not found');
      }

      if (transferData.sourceStoreId === transferData.destinationStoreId) {
        throw new Error('Source and destination stores cannot be the same');
      }

      // Validate product exists
      const product = await Product.findOne({
        where: { id: transferData.productId, tenantId: transferData.tenantId },
        transaction,
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // Check if source store has sufficient inventory
      const sourceInventory = await Inventory.findOne({
        where: {
          productId: transferData.productId,
          storeId: transferData.sourceStoreId,
          tenantId: transferData.tenantId,
        },
        transaction,
      });

      if (!sourceInventory) {
        throw new Error('Product not available in source store');
      }

      const availableQuantity = parseFloat(sourceInventory.quantityAvailable.toString());
      if (availableQuantity < transferData.quantity) {
        throw new Error(`Insufficient inventory. Available: ${availableQuantity}, Requested: ${transferData.quantity}`);
      }

      // Get unit cost from source inventory
      const unitCost = sourceInventory.unitCost ? parseFloat(sourceInventory.unitCost.toString()) : undefined;

      // Generate transfer number
      const transferNumber = await this.generateTransferNumber(transferData.tenantId);

      // Create transfer record
      const transferDataWithCost = unitCost !== undefined ? { ...transferData, unitCost } : transferData;
      const transfer = await InventoryTransfer.create({
        ...transferDataWithCost,
        transferNumber,
        requestedBy,
        status: 'pending',
      }, { transaction });

      await transaction.commit();

      logger.info(`Inventory transfer created: ${transferNumber} from store ${transferData.sourceStoreId} to ${transferData.destinationStoreId}`);

      // Return transfer with details
      return await this.getTransferById(transfer.id, transferData.tenantId);
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Error creating inventory transfer:', error);
      throw error;
    }
  }

  /**
   * Approve a transfer request
   */
  static async approveTransfer(transferId: string, tenantId: string, approvedBy: string): Promise<TransferWithDetails> {
    const transaction = await InventoryTransfer.sequelize!.transaction();

    try {
      const transfer = await InventoryTransfer.findOne({
        where: { id: transferId, tenantId, status: 'pending' },
        transaction,
        lock: Transaction.LOCK.UPDATE,
      });

      if (!transfer) {
        throw new Error('Transfer not found or not in pending status');
      }

      // Reserve inventory in source store
      await InventoryService.reserveInventory(
        transfer.sourceStoreId,
        tenantId,
        transfer.productId,
        parseFloat(transfer.quantity.toString())
      );

      // Update transfer status
      await InventoryTransfer.update(
        {
          status: 'approved',
          approvedBy,
          approvedAt: new Date(),
        },
        {
          where: { id: transferId, tenantId },
          transaction,
        }
      );

      await transaction.commit();

      logger.info(`Inventory transfer approved: ${transfer.transferNumber}`);

      return await this.getTransferById(transferId, tenantId);
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Error approving inventory transfer:', error);
      throw error;
    }
  }

  /**
   * Reject a transfer request
   */
  static async rejectTransfer(transferId: string, tenantId: string, approvedBy: string, notes?: string): Promise<TransferWithDetails> {
    try {
      const [affectedRows] = await InventoryTransfer.update(
        {
          status: 'rejected',
          approvedBy,
          approvedAt: new Date(),
          notes: notes || 'Transfer rejected',
        },
        {
          where: { id: transferId, tenantId, status: 'pending' },
        }
      );

      if (affectedRows === 0) {
        throw new Error('Transfer not found or not in pending status');
      }

      logger.info(`Inventory transfer rejected: ${transferId}`);

      return await this.getTransferById(transferId, tenantId);
    } catch (error: any) {
      logger.error('Error rejecting inventory transfer:', error);
      throw error;
    }
  }

  /**
   * Mark transfer as shipped
   */
  static async shipTransfer(transferId: string, tenantId: string, userId: string): Promise<TransferWithDetails> {
    try {
      const [affectedRows] = await InventoryTransfer.update(
        {
          status: 'in_transit',
          shippedAt: new Date(),
        },
        {
          where: { id: transferId, tenantId, status: 'approved' },
        }
      );

      if (affectedRows === 0) {
        throw new Error('Transfer not found or not in approved status');
      }

      logger.info(`Inventory transfer shipped: ${transferId}`);

      return await this.getTransferById(transferId, tenantId);
    } catch (error: any) {
      logger.error('Error shipping inventory transfer:', error);
      throw error;
    }
  }

  /**
   * Complete transfer (receive at destination)
   */
  static async completeTransfer(transferId: string, tenantId: string, userId: string): Promise<TransferWithDetails> {
    const transaction = await InventoryTransfer.sequelize!.transaction();

    try {
      const transfer = await InventoryTransfer.findOne({
        where: { id: transferId, tenantId, status: 'in_transit' },
        transaction,
        lock: Transaction.LOCK.UPDATE,
      });

      if (!transfer) {
        throw new Error('Transfer not found or not in transit status');
      }

      const quantity = parseFloat(transfer.quantity.toString());

      // Reduce inventory from source store
      await InventoryService.adjustInventory(
        transfer.sourceStoreId,
        tenantId,
        {
          productId: transfer.productId,
          quantity: -quantity, // Reduce quantity
          reason: 'transfer',
          reference: transfer.transferNumber,
        }
      );

      // Add inventory to destination store
      const destinationInventory = await Inventory.findOne({
        where: {
          productId: transfer.productId,
          storeId: transfer.destinationStoreId,
          tenantId,
        },
        transaction,
      });

      if (destinationInventory) {
        // Update existing inventory
        await InventoryService.adjustInventory(
          transfer.destinationStoreId,
          tenantId,
          {
            productId: transfer.productId,
            quantity: quantity, // Add quantity
            reason: 'transfer',
            reference: transfer.transferNumber,
          }
        );
      } else {
        // Create new inventory record
        const inventoryData: any = {
          tenantId,
          storeId: transfer.destinationStoreId,
          productId: transfer.productId,
          quantityOnHand: quantity,
        };
        if (transfer.unitCost !== undefined) {
          inventoryData.unitCost = transfer.unitCost;
        }
        await InventoryService.createOrUpdateInventory(inventoryData);
      }

      // Update transfer status
      await InventoryTransfer.update(
        {
          status: 'completed',
          receivedAt: new Date(),
        },
        {
          where: { id: transferId, tenantId },
          transaction,
        }
      );

      await transaction.commit();

      logger.info(`Inventory transfer completed: ${transfer.transferNumber}`);

      return await this.getTransferById(transferId, tenantId);
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Error completing inventory transfer:', error);
      throw error;
    }
  }

  /**
   * Cancel a transfer
   */
  static async cancelTransfer(transferId: string, tenantId: string, userId: string, notes?: string): Promise<TransferWithDetails> {
    const transaction = await InventoryTransfer.sequelize!.transaction();

    try {
      const transfer = await InventoryTransfer.findOne({
        where: { id: transferId, tenantId, status: { [Op.in]: ['pending', 'approved'] } },
        transaction,
        lock: Transaction.LOCK.UPDATE,
      });

      if (!transfer) {
        throw new Error('Transfer not found or cannot be cancelled');
      }

      // If approved, release reserved inventory
      if (transfer.status === 'approved') {
        await InventoryService.releaseReservedInventory(
          transfer.sourceStoreId,
          tenantId,
          transfer.productId,
          parseFloat(transfer.quantity.toString())
        );
      }

      // Update transfer status
      const updateData: any = {
        status: 'cancelled',
      };
      if (notes || transfer.notes) {
        updateData.notes = notes || transfer.notes;
      }
      await InventoryTransfer.update(
        updateData,
        {
          where: { id: transferId, tenantId },
          transaction,
        }
      );

      await transaction.commit();

      logger.info(`Inventory transfer cancelled: ${transferId}`);

      return await this.getTransferById(transferId, tenantId);
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Error cancelling inventory transfer:', error);
      throw error;
    }
  }

  /**
   * Get transfer by ID with full details
   */
  static async getTransferById(transferId: string, tenantId: string): Promise<TransferWithDetails> {
    try {
      const transfer = await InventoryTransfer.findOne({
        where: { id: transferId, tenantId },
        include: [
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
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku'],
          },
          {
            model: User,
            as: 'requester',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: User,
            as: 'approver',
            attributes: ['id', 'name', 'email'],
          },
        ],
      });

      if (!transfer) {
        throw new Error('Transfer not found');
      }

      return {
        id: transfer.id,
        tenantId: transfer.tenantId,
        transferNumber: transfer.transferNumber,
        sourceStoreId: transfer.sourceStoreId,
        destinationStoreId: transfer.destinationStoreId,
        productId: transfer.productId,
        quantity: parseFloat(transfer.quantity.toString()),
        unitCost: transfer.unitCost ? parseFloat(transfer.unitCost.toString()) : undefined,
        status: transfer.status,
        requestedBy: transfer.requestedBy,
        approvedBy: transfer.approvedBy,
        approvedAt: transfer.approvedAt,
        shippedAt: transfer.shippedAt,
        receivedAt: transfer.receivedAt,
        notes: transfer.notes,
        reference: transfer.reference,
        sourceStore: transfer.sourceStore ? {
          id: transfer.sourceStore.id,
          name: transfer.sourceStore.name,
        } : undefined,
        destinationStore: transfer.destinationStore ? {
          id: transfer.destinationStore.id,
          name: transfer.destinationStore.name,
        } : undefined,
        product: transfer.product ? {
          id: transfer.product.id,
          name: transfer.product.name,
          sku: transfer.product.sku,
        } : undefined,
        requester: transfer.requester ? {
          id: transfer.requester.id,
          name: transfer.requester.name,
          email: transfer.requester.email,
        } : undefined,
        approver: transfer.approver ? {
          id: transfer.approver.id,
          name: transfer.approver.name,
          email: transfer.approver.email,
        } : undefined,
        createdAt: transfer.createdAt,
        updatedAt: transfer.updatedAt,
      } as TransferWithDetails;
    } catch (error) {
      logger.error('Error getting transfer by ID:', error);
      throw new Error('Failed to retrieve transfer');
    }
  }

  /**
   * Get transfers with filtering
   */
  static async getTransfers(
    tenantId: string,
    filters: {
      status?: string[];
      sourceStoreId?: string;
      destinationStoreId?: string;
      productId?: string;
      requestedBy?: string;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ transfers: TransferWithDetails[]; total: number }> {
    try {
      const whereClause: any = { tenantId };

      if (filters.status && filters.status.length > 0) {
        whereClause.status = { [Op.in]: filters.status };
      }

      if (filters.sourceStoreId) {
        whereClause.sourceStoreId = filters.sourceStoreId;
      }

      if (filters.destinationStoreId) {
        whereClause.destinationStoreId = filters.destinationStoreId;
      }

      if (filters.productId) {
        whereClause.productId = filters.productId;
      }

      if (filters.requestedBy) {
        whereClause.requestedBy = filters.requestedBy;
      }

      if (filters.dateFrom || filters.dateTo) {
        whereClause.createdAt = {};
        if (filters.dateFrom) {
          whereClause.createdAt[Op.gte] = filters.dateFrom;
        }
        if (filters.dateTo) {
          whereClause.createdAt[Op.lte] = filters.dateTo;
        }
      }

      const { count: total, rows: transfers } = await InventoryTransfer.findAndCountAll({
        where: whereClause,
        include: [
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
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku'],
          },
          {
            model: User,
            as: 'requester',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: User,
            as: 'approver',
            attributes: ['id', 'name', 'email'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      });

      const transferDetails = transfers.map(transfer => ({
        id: transfer.id,
        tenantId: transfer.tenantId,
        transferNumber: transfer.transferNumber,
        sourceStoreId: transfer.sourceStoreId,
        destinationStoreId: transfer.destinationStoreId,
        productId: transfer.productId,
        quantity: parseFloat(transfer.quantity.toString()),
        unitCost: transfer.unitCost ? parseFloat(transfer.unitCost.toString()) : undefined,
        status: transfer.status,
        requestedBy: transfer.requestedBy,
        approvedBy: transfer.approvedBy,
        approvedAt: transfer.approvedAt,
        shippedAt: transfer.shippedAt,
        receivedAt: transfer.receivedAt,
        notes: transfer.notes,
        reference: transfer.reference,
        sourceStore: transfer.sourceStore ? {
          id: transfer.sourceStore.id,
          name: transfer.sourceStore.name,
        } : undefined,
        destinationStore: transfer.destinationStore ? {
          id: transfer.destinationStore.id,
          name: transfer.destinationStore.name,
        } : undefined,
        product: transfer.product ? {
          id: transfer.product.id,
          name: transfer.product.name,
          sku: transfer.product.sku,
        } : undefined,
        requester: transfer.requester ? {
          id: transfer.requester.id,
          name: transfer.requester.name,
          email: transfer.requester.email,
        } : undefined,
        approver: transfer.approver ? {
          id: transfer.approver.id,
          name: transfer.approver.name,
          email: transfer.approver.email,
        } : undefined,
        createdAt: transfer.createdAt,
        updatedAt: transfer.updatedAt,
      })) as TransferWithDetails[];

      return { transfers: transferDetails, total };
    } catch (error) {
      logger.error('Error getting transfers:', error);
      throw new Error('Failed to retrieve transfers');
    }
  }

  /**
   * Get transfer statistics for a tenant
   */
  static async getTransferStats(tenantId: string): Promise<any> {
    try {
      const stats = await InventoryTransfer.findAll({
        where: { tenantId },
        attributes: [
          'status',
          [InventoryTransfer.sequelize!.fn('COUNT', InventoryTransfer.sequelize!.col('id')), 'count'],
          [InventoryTransfer.sequelize!.fn('SUM', InventoryTransfer.sequelize!.col('quantity')), 'totalQuantity'],
        ],
        group: ['status'],
        raw: true,
      });

      const result = {
        totalTransfers: 0,
        pendingTransfers: 0,
        approvedTransfers: 0,
        inTransitTransfers: 0,
        completedTransfers: 0,
        cancelledTransfers: 0,
        rejectedTransfers: 0,
        totalQuantityTransferred: 0,
      };

      stats.forEach((stat: any) => {
        const count = parseInt(stat.count);
        const quantity = parseFloat(stat.totalQuantity || 0);

        result.totalTransfers += count;

        switch (stat.status) {
          case 'pending':
            result.pendingTransfers = count;
            break;
          case 'approved':
            result.approvedTransfers = count;
            break;
          case 'in_transit':
            result.inTransitTransfers = count;
            break;
          case 'completed':
            result.completedTransfers = count;
            result.totalQuantityTransferred += quantity;
            break;
          case 'cancelled':
            result.cancelledTransfers = count;
            break;
          case 'rejected':
            result.rejectedTransfers = count;
            break;
        }
      });

      return result;
    } catch (error) {
      logger.error('Error getting transfer stats:', error);
      throw new Error('Failed to get transfer statistics');
    }
  }
}