import { Transaction, Op } from 'sequelize';
import sequelize from '../config/database';
import {
  AutomatedReorderRule,
  Inventory,
  Store,
  Product,
  Category,
  InventoryTransfer,
  Tenant,
} from '../db/models';
import logger from '../config/logger';

export interface CreateReorderRuleData {
  ruleName: string;
  description?: string;
  productId?: string;
  categoryId?: string;
  storeIds?: string[];
  regionId?: string;
  minStockLevel: number;
  maxStockLevel: number;
  reorderQuantity: number;
  reorderPoint: number;
  leadTimeDays: number;
  safetyStockDays: number;
  priority?: 'low' | 'normal' | 'high';
  checkFrequencyHours?: number;
}

export interface UpdateReorderRuleData {
  ruleName?: string;
  description?: string;
  productId?: string;
  categoryId?: string;
  storeIds?: string[];
  regionId?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderQuantity?: number;
  reorderPoint?: number;
  leadTimeDays?: number;
  safetyStockDays?: number;
  isActive?: boolean;
  priority?: 'low' | 'normal' | 'high';
  checkFrequencyHours?: number;
}

export interface ReorderTriggerResult {
  ruleId: string;
  ruleName: string;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  transferCreated: boolean;
  transferId?: string;
  error?: string;
}

export interface ReorderCheckResult {
  tenantId: string;
  rulesChecked: number;
  triggersFound: number;
  transfersCreated: number;
  errors: string[];
  results: ReorderTriggerResult[];
}

class AutomatedReorderRuleService {
  /**
   * Create a new automated reorder rule
   */
  static async createReorderRule(
    tenantId: string,
    userId: string,
    ruleData: CreateReorderRuleData
  ): Promise<AutomatedReorderRule> {
    const transaction = await sequelize.transaction();

    try {
      // Validate rule data
      await this.validateReorderRuleData(tenantId, ruleData, transaction);

      const createData: any = {
        tenantId,
        ruleName: ruleData.ruleName,
        minStockLevel: ruleData.minStockLevel,
        maxStockLevel: ruleData.maxStockLevel,
        reorderQuantity: ruleData.reorderQuantity,
        reorderPoint: ruleData.reorderPoint,
        leadTimeDays: ruleData.leadTimeDays,
        safetyStockDays: ruleData.safetyStockDays,
        isActive: true,
        priority: ruleData.priority || 'normal',
        checkFrequencyHours: ruleData.checkFrequencyHours || 24,
        createdBy: userId,
        nextCheckAt: new Date(Date.now() + (ruleData.checkFrequencyHours || 24) * 60 * 60 * 1000),
      };

      if (ruleData.description !== undefined) createData.description = ruleData.description;
      if (ruleData.productId !== undefined) createData.productId = ruleData.productId;
      if (ruleData.categoryId !== undefined) createData.categoryId = ruleData.categoryId;
      if (ruleData.storeIds !== undefined) createData.storeIds = ruleData.storeIds;
      if (ruleData.regionId !== undefined) createData.regionId = ruleData.regionId;

      const rule = await AutomatedReorderRule.create(createData, { transaction });

      await transaction.commit();

      logger.info(`Created automated reorder rule ${ruleData.ruleName} for tenant ${tenantId}`);

      return rule;
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Create reorder rule error:', error);
      throw new Error(error.message || 'Failed to create automated reorder rule');
    }
  }

  /**
   * Update an automated reorder rule
   */
  static async updateReorderRule(
    ruleId: string,
    tenantId: string,
    userId: string,
    updateData: UpdateReorderRuleData
  ): Promise<AutomatedReorderRule> {
    const transaction = await sequelize.transaction();

    try {
      const rule = await AutomatedReorderRule.findOne({
        where: { id: ruleId, tenantId },
        transaction,
      });

      if (!rule) {
        throw new Error('Automated reorder rule not found');
      }

      // Validate updated data
      await this.validateReorderRuleData(tenantId, updateData, transaction, ruleId);

      const updatedData: any = {};
      if (updateData.ruleName !== undefined) updatedData.ruleName = updateData.ruleName;
      if (updateData.description !== undefined) updatedData.description = updateData.description;
      if (updateData.productId !== undefined) updatedData.productId = updateData.productId;
      if (updateData.categoryId !== undefined) updatedData.categoryId = updateData.categoryId;
      if (updateData.storeIds !== undefined) updatedData.storeIds = updateData.storeIds;
      if (updateData.regionId !== undefined) updatedData.regionId = updateData.regionId;
      if (updateData.minStockLevel !== undefined) updatedData.minStockLevel = updateData.minStockLevel;
      if (updateData.maxStockLevel !== undefined) updatedData.maxStockLevel = updateData.maxStockLevel;
      if (updateData.reorderQuantity !== undefined) updatedData.reorderQuantity = updateData.reorderQuantity;
      if (updateData.reorderPoint !== undefined) updatedData.reorderPoint = updateData.reorderPoint;
      if (updateData.leadTimeDays !== undefined) updatedData.leadTimeDays = updateData.leadTimeDays;
      if (updateData.safetyStockDays !== undefined) updatedData.safetyStockDays = updateData.safetyStockDays;
      if (updateData.isActive !== undefined) updatedData.isActive = updateData.isActive;
      if (updateData.priority !== undefined) updatedData.priority = updateData.priority;
      if (updateData.checkFrequencyHours !== undefined) {
        updatedData.checkFrequencyHours = updateData.checkFrequencyHours;
        updatedData.nextCheckAt = new Date(Date.now() + updateData.checkFrequencyHours * 60 * 60 * 1000);
      }

      await rule.update(updatedData, { transaction });

      await transaction.commit();

      logger.info(`Updated automated reorder rule ${rule.dataValues.ruleName}`);

      return rule;
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Update reorder rule error:', error);
      throw new Error(error.message || 'Failed to update automated reorder rule');
    }
  }

  /**
   * Delete an automated reorder rule
   */
  static async deleteReorderRule(
    ruleId: string,
    tenantId: string,
    userId: string
  ): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      const rule = await AutomatedReorderRule.findOne({
        where: { id: ruleId, tenantId },
        transaction,
      });

      if (!rule) {
        throw new Error('Automated reorder rule not found');
      }

      await rule.destroy({ transaction });

      await transaction.commit();

      logger.info(`Deleted automated reorder rule ${rule.dataValues.ruleName}`);
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Delete reorder rule error:', error);
      throw new Error(error.message || 'Failed to delete automated reorder rule');
    }
  }

  /**
   * Get reorder rules with filtering
   */
  static async getReorderRules(
    tenantId: string,
    filters?: {
      isActive?: boolean;
      productId?: string;
      categoryId?: string;
      regionId?: string;
      priority?: 'low' | 'normal' | 'high';
      limit?: number;
      offset?: number;
    }
  ): Promise<{ rules: AutomatedReorderRule[]; total: number }> {
    try {
      const whereClause: any = { tenantId };

      if (filters?.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }

      if (filters?.productId) {
        whereClause.productId = filters.productId;
      }

      if (filters?.categoryId) {
        whereClause.categoryId = filters.categoryId;
      }

      if (filters?.regionId) {
        whereClause.regionId = filters.regionId;
      }

      if (filters?.priority) {
        whereClause.priority = filters.priority;
      }

      const { count: total, rows: rules } = await AutomatedReorderRule.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku'],
            required: false,
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name'],
            required: false,
          },
        ],
        order: [
          ['priority', 'DESC'],
          ['createdAt', 'DESC'],
        ],
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
      });

      return { rules, total };
    } catch (error) {
      logger.error('Get reorder rules error:', error);
      throw new Error('Failed to retrieve automated reorder rules');
    }
  }

  /**
   * Get reorder rule by ID
   */
  static async getReorderRuleById(
    ruleId: string,
    tenantId: string
  ): Promise<AutomatedReorderRule | null> {
    try {
      const rule = await AutomatedReorderRule.findOne({
        where: { id: ruleId, tenantId },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku'],
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name'],
          },
        ],
      });

      return rule;
    } catch (error) {
      logger.error('Get reorder rule by ID error:', error);
      throw new Error('Failed to retrieve automated reorder rule');
    }
  }

  /**
   * Check and execute automated reorder rules for a tenant
   */
  static async checkAndExecuteReorderRules(
    tenantId: string,
    options?: {
      forceCheck?: boolean; // ignore nextCheckAt timing
      maxTransfersPerRule?: number; // limit transfers per rule execution
      dryRun?: boolean; // don't actually create transfers
    }
  ): Promise<ReorderCheckResult> {
    const result: ReorderCheckResult = {
      tenantId,
      rulesChecked: 0,
      triggersFound: 0,
      transfersCreated: 0,
      errors: [],
      results: [],
    };

    try {
      // Get active rules that are due for checking
      const whereClause: any = {
        tenantId,
        isActive: true,
      };

      if (!options?.forceCheck) {
        whereClause.nextCheckAt = {
          [Op.lte]: new Date(),
        };
      }

      const rules = await AutomatedReorderRule.findAll({
        where: whereClause,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku'],
            required: false,
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name'],
            required: false,
          },
        ],
        order: [['priority', 'DESC']],
      });

      result.rulesChecked = rules.length;

      for (const rule of rules) {
        try {
          const ruleResults = await this.checkSingleRule(rule, options);
          result.results.push(...ruleResults);
          result.triggersFound += ruleResults.filter(r => r.transferCreated || r.error).length;
          result.transfersCreated += ruleResults.filter(r => r.transferCreated).length;

          // Update rule's last triggered time and next check time
          if (!options?.dryRun) {
            await rule.update({
              lastTriggeredAt: new Date(),
              nextCheckAt: new Date(Date.now() + rule.dataValues.checkFrequencyHours * 60 * 60 * 1000),
            });
          }
        } catch (error: any) {
          result.errors.push(`Rule ${rule.dataValues.ruleName}: ${error.message}`);
          logger.error(`Error checking rule ${rule.dataValues.id}:`, error);
        }
      }

      logger.info(`Automated reorder check completed for tenant ${tenantId}: ${result.triggersFound} triggers, ${result.transfersCreated} transfers created`);
    } catch (error: any) {
      result.errors.push(`General error: ${error.message}`);
      logger.error('Check and execute reorder rules error:', error);
    }

    return result;
  }

  /**
   * Check a single reorder rule and create transfers if needed
   */
  private static async checkSingleRule(
    rule: AutomatedReorderRule,
    options?: {
      maxTransfersPerRule?: number;
      dryRun?: boolean;
    }
  ): Promise<ReorderTriggerResult[]> {
    const results: ReorderTriggerResult[] = [];

    try {
      // Get applicable stores for this rule
      const applicableStores = await this.getApplicableStoresForRule(rule);

      // Get applicable products for this rule
      const applicableProducts = await this.getApplicableProductsForRule(rule);

      let transfersCreated = 0;
      const maxTransfers = options?.maxTransfersPerRule || 10;

      for (const store of applicableStores) {
        for (const product of applicableProducts) {
          if (transfersCreated >= maxTransfers) break;

          try {
            // Check current inventory
            const inventory = await Inventory.findOne({
              where: {
                tenantId: rule.dataValues.tenantId,
                storeId: store.dataValues.id,
                productId: product.dataValues.id,
              },
            });

            const currentStock = inventory ? parseFloat(inventory.dataValues.quantityAvailable.toString()) : 0;
            const reorderPoint = parseFloat(rule.dataValues.reorderPoint.toString());

            const result: ReorderTriggerResult = {
              ruleId: rule.dataValues.id,
              ruleName: rule.dataValues.ruleName,
              productId: product.dataValues.id,
              productName: product.dataValues.name,
              storeId: store.dataValues.id,
              storeName: store.dataValues.name,
              currentStock,
              reorderPoint,
              reorderQuantity: parseFloat(rule.dataValues.reorderQuantity.toString()),
              transferCreated: false,
            };

            // Check if reorder is needed
            if (currentStock <= reorderPoint) {
              if (!options?.dryRun) {
                try {
                  // Find source store with sufficient inventory
                  const sourceStore = await this.findSourceStoreForReorder(
                    rule.dataValues.tenantId,
                    product.dataValues.id,
                    store.dataValues.id,
                    result.reorderQuantity
                  );

                  if (sourceStore) {
                    // Create inventory transfer
                    const transferNumber = `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
                    const transfer = await InventoryTransfer.create({
                      tenantId: rule.dataValues.tenantId,
                      transferNumber,
                      sourceStoreId: sourceStore.dataValues.id,
                      destinationStoreId: store.dataValues.id,
                      productId: product.dataValues.id,
                      quantity: result.reorderQuantity,
                      status: 'pending',
                      requestedBy: rule.dataValues.createdBy, // Use rule creator as requester
                      notes: `Automated reorder triggered by rule: ${rule.dataValues.ruleName}`,
                    });

                    result.transferCreated = true;
                    result.transferId = transfer.dataValues.id;
                    transfersCreated++;
                  } else {
                    result.error = 'No source store with sufficient inventory found';
                  }
                } catch (transferError: any) {
                  result.error = `Failed to create transfer: ${transferError.message}`;
                }
              } else {
                // Dry run - just mark as would create transfer
                result.transferCreated = true;
              }
            }

            results.push(result);
          } catch (productError: any) {
            results.push({
              ruleId: rule.dataValues.id,
              ruleName: rule.dataValues.ruleName,
              productId: product.dataValues.id,
              productName: product.dataValues.name,
              storeId: store.dataValues.id,
              storeName: store.dataValues.name,
              currentStock: 0,
              reorderPoint: parseFloat(rule.dataValues.reorderPoint.toString()),
              reorderQuantity: parseFloat(rule.dataValues.reorderQuantity.toString()),
              transferCreated: false,
              error: productError.message,
            });
          }
        }
      }
    } catch (error: any) {
      logger.error(`Error checking rule ${rule.dataValues.id}:`, error);
    }

    return results;
  }

  /**
   * Get applicable stores for a reorder rule
   */
  private static async getApplicableStoresForRule(rule: AutomatedReorderRule): Promise<Store[]> {
    let storeIds: string[] = [];

    if (rule.dataValues.storeIds && rule.dataValues.storeIds.length > 0) {
      // Specific stores
      storeIds = rule.dataValues.storeIds;
    } else if (rule.dataValues.regionId) {
      // All stores in the region
      const region = await AutomatedReorderRule.findByPk(rule.dataValues.regionId, {
        include: [{
          model: Store,
          as: 'stores',
          attributes: ['id'],
        }],
      });

      if (region && (region as any).stores) {
        storeIds = (region as any).stores.map((store: any) => store.dataValues.id);
      }
    } else {
      // All stores for the tenant
      const stores = await Store.findAll({
        where: { tenantId: rule.dataValues.tenantId },
        attributes: ['id'],
      });
      storeIds = stores.map(store => store.dataValues.id);
    }

    // Fetch full store details
    const stores = await Store.findAll({
      where: {
        id: { [Op.in]: storeIds },
        tenantId: rule.dataValues.tenantId,
      },
      attributes: ['id', 'name'],
    });

    return stores;
  }

  /**
   * Get applicable products for a reorder rule
   */
  private static async getApplicableProductsForRule(rule: AutomatedReorderRule): Promise<Product[]> {
    let productIds: string[] = [];

    if (rule.dataValues.productId) {
      // Specific product
      productIds = [rule.dataValues.productId];
    } else if (rule.dataValues.categoryId) {
      // All products in the category
      const products = await Product.findAll({
        where: {
          tenantId: rule.dataValues.tenantId,
          categoryId: rule.dataValues.categoryId,
        },
        attributes: ['id'],
      });
      productIds = products.map(product => product.dataValues.id);
    } else {
      // All products for the tenant
      const products = await Product.findAll({
        where: { tenantId: rule.dataValues.tenantId },
        attributes: ['id'],
      });
      productIds = products.map(product => product.dataValues.id);
    }

    // Fetch full product details
    const products = await Product.findAll({
      where: {
        id: { [Op.in]: productIds },
        tenantId: rule.dataValues.tenantId,
      },
      attributes: ['id', 'name', 'sku'],
    });

    return products;
  }

  /**
   * Find a source store with sufficient inventory for reorder
   */
  private static async findSourceStoreForReorder(
    tenantId: string,
    productId: string,
    destinationStoreId: string,
    requiredQuantity: number
  ): Promise<Store | null> {
    try {
      // Find stores with sufficient inventory, excluding destination store
      const inventories = await Inventory.findAll({
        where: {
          tenantId,
          productId,
          storeId: { [Op.ne]: destinationStoreId },
          quantityAvailable: { [Op.gte]: requiredQuantity },
        },
        include: [{
          model: Store,
          as: 'store',
          attributes: ['id', 'name'],
        }],
        order: [['quantityAvailable', 'DESC']], // Prefer stores with more inventory
      });

      const inventoryWithStore = inventories.find(inv => (inv as any).store);
      return inventoryWithStore ? (inventoryWithStore as any).store : null;
    } catch (error) {
      logger.error('Find source store for reorder error:', error);
      return null;
    }
  }

  /**
   * Validate reorder rule data
   */
  private static async validateReorderRuleData(
    tenantId: string,
    ruleData: Partial<CreateReorderRuleData>,
    transaction: Transaction,
    excludeRuleId?: string
  ): Promise<void> {
    // Validate rule name uniqueness
    if (ruleData.ruleName) {
      const whereClause: any = {
        tenantId,
        ruleName: ruleData.ruleName,
      };

      if (excludeRuleId) {
        whereClause.id = { [Op.ne]: excludeRuleId };
      }

      const existingRule = await AutomatedReorderRule.findOne({
        where: whereClause,
        transaction,
      });

      if (existingRule) {
        throw new Error('Rule name already exists');
      }
    }

    // Validate product exists
    if (ruleData.productId) {
      const product = await Product.findOne({
        where: { id: ruleData.productId, tenantId },
        transaction,
      });

      if (!product) {
        throw new Error('Product not found');
      }
    }

    // Validate category exists
    if (ruleData.categoryId) {
      const category = await Category.findOne({
        where: { id: ruleData.categoryId, tenantId },
        transaction,
      });

      if (!category) {
        throw new Error('Category not found');
      }
    }

    // Validate stores exist
    if (ruleData.storeIds && ruleData.storeIds.length > 0) {
      const stores = await Store.findAll({
        where: {
          id: { [Op.in]: ruleData.storeIds },
          tenantId,
        },
        transaction,
      });

      if (stores.length !== ruleData.storeIds.length) {
        throw new Error('One or more stores not found');
      }
    }

    // Validate region exists
    if (ruleData.regionId) {
      const region = await AutomatedReorderRule.findOne({
        where: { id: ruleData.regionId, tenantId },
        transaction,
      });

      if (!region) {
        throw new Error('Inventory region not found');
      }
    }

    // Validate numeric constraints
    if (ruleData.minStockLevel !== undefined && ruleData.maxStockLevel !== undefined) {
      if (ruleData.minStockLevel >= ruleData.maxStockLevel) {
        throw new Error('Minimum stock level must be less than maximum stock level');
      }
    }

    if (ruleData.reorderPoint !== undefined && ruleData.minStockLevel !== undefined) {
      if (ruleData.reorderPoint >= ruleData.minStockLevel) {
        throw new Error('Reorder point should be less than minimum stock level');
      }
    }
  }

  /**
   * Get reorder rule statistics
   */
  static async getReorderRuleStats(tenantId: string): Promise<{
    totalRules: number;
    activeRules: number;
    rulesTriggeredToday: number;
    transfersCreatedToday: number;
    pendingTransfers: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [totalRules, activeRules, rulesTriggeredToday] = await Promise.all([
        AutomatedReorderRule.count({ where: { tenantId } }),
        AutomatedReorderRule.count({ where: { tenantId, isActive: true } }),
        AutomatedReorderRule.count({
          where: {
            tenantId,
            lastTriggeredAt: {
              [Op.gte]: today,
              [Op.lt]: tomorrow,
            },
          },
        }),
      ]);

      // Count transfers created today by automated reorder
      const transfersCreatedToday = await InventoryTransfer.count({
        where: {
          tenantId,
          notes: { [Op.like]: 'Automated reorder triggered%' },
          createdAt: {
            [Op.gte]: today,
            [Op.lt]: tomorrow,
          },
        },
      });

      // Count pending transfers from automated reorder
      const pendingTransfers = await InventoryTransfer.count({
        where: {
          tenantId,
          notes: { [Op.like]: 'Automated reorder triggered%' },
          status: 'pending',
        },
      });

      return {
        totalRules,
        activeRules,
        rulesTriggeredToday,
        transfersCreatedToday,
        pendingTransfers,
      };
    } catch (error) {
      logger.error('Get reorder rule stats error:', error);
      throw new Error('Failed to retrieve reorder rule statistics');
    }
  }
}

export default AutomatedReorderRuleService;