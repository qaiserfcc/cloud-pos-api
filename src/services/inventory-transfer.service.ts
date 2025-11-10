import { InventoryTransfer, Inventory, Store, Product, User, Tenant } from '../db/models';
import { Op, Transaction } from 'sequelize';
import { InventoryService } from './inventory.service';
import ApprovalService from './approval.service';
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
  private static approvalService = new ApprovalService();
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
      const lastNumber = lastTransfer.dataValues.transferNumber;
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

      const availableQuantity = parseFloat(sourceInventory.dataValues.quantityAvailable.toString());
      if (availableQuantity < transferData.quantity) {
        throw new Error(`Insufficient inventory. Available: ${availableQuantity}, Requested: ${transferData.quantity}`);
      }

      // Get unit cost from source inventory
      const unitCost = sourceInventory.dataValues.unitCost ? parseFloat(sourceInventory.dataValues.unitCost.toString()) : undefined;

      // Check if approval is required for this transfer
      const approvalData: any = {
        amount: unitCost ? unitCost * transferData.quantity : 0,
        currency: 'USD', // Default currency, could be made configurable
        details: {
          sourceStoreId: transferData.sourceStoreId,
          destinationStoreId: transferData.destinationStoreId,
          productId: transferData.productId,
          quantity: transferData.quantity,
          unitCost,
          productName: product.dataValues.name,
          sourceStoreName: sourceStore.dataValues.name,
          destinationStoreName: destinationStore.dataValues.name,
        },
        metadata: {
          transferType: 'inventory_transfer',
          productSku: product.dataValues.sku,
        },
      };

      const approvalRequired = await this.approvalService.isApprovalRequired(
        transferData.tenantId,
        'inventory_transfer',
        approvalData,
        transferData.sourceStoreId
      );

      // Generate transfer number
      const transferNumber = await this.generateTransferNumber(transferData.tenantId);

      // Create transfer record
      const transferDataWithCost = unitCost !== undefined ? { ...transferData, unitCost } : transferData;
      const transfer = await InventoryTransfer.create({
        ...transferDataWithCost,
        transferNumber,
        requestedBy,
        status: approvalRequired ? 'pending' : 'approved', // Auto-approve if no approval required
      }, { transaction });

      // Create approval request if required
      if (approvalRequired) {
        await this.approvalService.createApprovalRequest({
          tenantId: transferData.tenantId,
          storeId: transferData.sourceStoreId,
          requestedById: requestedBy,
          objectType: 'inventory_transfer',
          objectId: transfer.dataValues.id,
          title: `Inventory Transfer Request: ${product.dataValues.name}`,
          description: `Transfer ${transferData.quantity} units of ${product.dataValues.name} from ${sourceStore.dataValues.name} to ${destinationStore.dataValues.name}`,
          priority: 'medium',
          approvalData,
        });
      }

      await transaction.commit();

      logger.info(`Inventory transfer created: ${transferNumber} from store ${transferData.sourceStoreId} to ${transferData.destinationStoreId}${approvalRequired ? ' (approval required)' : ' (auto-approved)'}`);

      // Return transfer with details
      return await this.getTransferById(transfer.dataValues.id, transferData.tenantId);
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Error creating inventory transfer:', error);
      throw error;
    }
  }

  /**
   * Handle approval decision for inventory transfer
   */
  static async handleApprovalDecision(transferId: string, tenantId: string, decision: 'approved' | 'rejected', approverId: string, comments?: string): Promise<TransferWithDetails> {
    if (decision === 'approved') {
      return await this.approveTransfer(transferId, tenantId, approverId);
    } else {
      return await this.rejectTransfer(transferId, tenantId, approverId, comments || 'Rejected via approval workflow');
    }
  }
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
        transfer.dataValues.sourceStoreId,
        tenantId,
        transfer.dataValues.productId,
        parseFloat(transfer.dataValues.quantity.toString())
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

      logger.info(`Inventory transfer approved: ${transfer.dataValues.transferNumber}`);

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

      const quantity = parseFloat(transfer.dataValues.quantity.toString());

      // Reduce inventory from source store
      await InventoryService.adjustInventory(
        transfer.dataValues.sourceStoreId,
        tenantId,
        {
          productId: transfer.dataValues.productId,
          quantity: -quantity, // Reduce quantity
          reason: 'transfer',
          reference: transfer.dataValues.transferNumber,
        }
      );

        // Add inventory to destination store
        const destinationInventory = await Inventory.findOne({
          where: {
            productId: transfer.dataValues.productId,
            storeId: transfer.dataValues.destinationStoreId,
            tenantId,
          },
          transaction,
        });

        if (destinationInventory) {
          // Update existing inventory
          await InventoryService.adjustInventory(
            transfer.dataValues.destinationStoreId,
            tenantId,
            {
              productId: transfer.dataValues.productId,
              quantity: quantity, // Add quantity
              reason: 'transfer',
              reference: transfer.dataValues.transferNumber,
            }
          );
        } else {
          // Create new inventory record
          const inventoryData: any = {
            tenantId,
            storeId: transfer.dataValues.destinationStoreId,
            productId: transfer.dataValues.productId,
            quantityOnHand: quantity,
          };
          if (transfer.dataValues.unitCost !== undefined) {
            inventoryData.unitCost = transfer.dataValues.unitCost;
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

      logger.info(`Inventory transfer completed: ${transfer.dataValues.transferNumber}`);

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
      if (transfer.dataValues.status === 'approved') {
        await InventoryService.releaseReservedInventory(
          transfer.dataValues.sourceStoreId,
          tenantId,
          transfer.dataValues.productId,
          parseFloat(transfer.dataValues.quantity.toString())
        );
      }

      // Update transfer status
      const updateData: any = {
        status: 'cancelled',
      };
      if (notes || transfer.dataValues.notes) {
        updateData.notes = notes || transfer.dataValues.notes;
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
        id: transfer.dataValues.id,
        tenantId: transfer.dataValues.tenantId,
        transferNumber: transfer.dataValues.transferNumber,
        sourceStoreId: transfer.dataValues.sourceStoreId,
        destinationStoreId: transfer.dataValues.destinationStoreId,
        productId: transfer.dataValues.productId,
        quantity: parseFloat(transfer.dataValues.quantity.toString()),
        unitCost: transfer.dataValues.unitCost ? parseFloat(transfer.dataValues.unitCost.toString()) : undefined,
        status: transfer.dataValues.status,
        requestedBy: transfer.dataValues.requestedBy,
        approvedBy: transfer.dataValues.approvedBy,
        approvedAt: transfer.dataValues.approvedAt,
        shippedAt: transfer.dataValues.shippedAt,
        receivedAt: transfer.dataValues.receivedAt,
        notes: transfer.dataValues.notes,
        reference: transfer.dataValues.reference,
        sourceStore: (transfer as any).sourceStore ? {
          id: (transfer as any).sourceStore.dataValues.id,
          name: (transfer as any).sourceStore.dataValues.name,
        } : undefined,
        destinationStore: (transfer as any).destinationStore ? {
          id: (transfer as any).destinationStore.dataValues.id,
          name: (transfer as any).destinationStore.dataValues.name,
        } : undefined,
        product: (transfer as any).product ? {
          id: (transfer as any).product.dataValues.id,
          name: (transfer as any).product.dataValues.name,
          sku: (transfer as any).product.dataValues.sku,
        } : undefined,
        requester: (transfer as any).requester ? {
          id: (transfer as any).requester.dataValues.id,
          name: (transfer as any).requester.dataValues.name,
          email: (transfer as any).requester.dataValues.email,
        } : undefined,
        approver: (transfer as any).approver ? {
          id: (transfer as any).approver.dataValues.id,
          name: (transfer as any).approver.dataValues.name,
          email: (transfer as any).approver.dataValues.email,
        } : undefined,
        createdAt: transfer.dataValues.createdAt,
        updatedAt: transfer.dataValues.updatedAt,
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
        id: transfer.dataValues.id,
        tenantId: transfer.dataValues.tenantId,
        transferNumber: transfer.dataValues.transferNumber,
        sourceStoreId: transfer.dataValues.sourceStoreId,
        destinationStoreId: transfer.dataValues.destinationStoreId,
        productId: transfer.dataValues.productId,
        quantity: parseFloat(transfer.dataValues.quantity.toString()),
        unitCost: transfer.dataValues.unitCost ? parseFloat(transfer.dataValues.unitCost.toString()) : undefined,
        status: transfer.dataValues.status,
        requestedBy: transfer.dataValues.requestedBy,
        approvedBy: transfer.dataValues.approvedBy,
        approvedAt: transfer.dataValues.approvedAt,
        shippedAt: transfer.dataValues.shippedAt,
        receivedAt: transfer.dataValues.receivedAt,
        notes: transfer.dataValues.notes,
        reference: transfer.dataValues.reference,
        sourceStore: (transfer as any).sourceStore ? {
          id: (transfer as any).sourceStore.dataValues.id,
          name: (transfer as any).sourceStore.dataValues.name,
        } : undefined,
        destinationStore: (transfer as any).destinationStore ? {
          id: (transfer as any).destinationStore.dataValues.id,
          name: (transfer as any).destinationStore.dataValues.name,
        } : undefined,
        product: (transfer as any).product ? {
          id: (transfer as any).product.dataValues.id,
          name: (transfer as any).product.dataValues.name,
          sku: (transfer as any).product.dataValues.sku,
        } : undefined,
        requester: (transfer as any).requester ? {
          id: (transfer as any).requester.dataValues.id,
          name: (transfer as any).requester.dataValues.name,
          email: (transfer as any).requester.dataValues.email,
        } : undefined,
        approver: (transfer as any).approver ? {
          id: (transfer as any).approver.dataValues.id,
          name: (transfer as any).approver.dataValues.name,
          email: (transfer as any).approver.dataValues.email,
        } : undefined,
        createdAt: transfer.dataValues.createdAt,
        updatedAt: transfer.dataValues.updatedAt,
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