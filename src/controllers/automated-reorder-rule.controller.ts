import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import AutomatedReorderRuleService, {
  CreateReorderRuleData,
  UpdateReorderRuleData,
} from '../services/automated-reorder-rule.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';

export class AutomatedReorderRuleController {
  /**
   * Create a new automated reorder rule
   */
  static async createReorderRule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const tenantId = req.tenantId!;
      const userId = req.user!.id;

      const ruleData: CreateReorderRuleData = {
        ruleName: req.body.ruleName,
        description: req.body.description,
        productId: req.body.productId,
        categoryId: req.body.categoryId,
        storeIds: req.body.storeIds,
        regionId: req.body.regionId,
        minStockLevel: req.body.minStockLevel,
        maxStockLevel: req.body.maxStockLevel,
        reorderQuantity: req.body.reorderQuantity,
        reorderPoint: req.body.reorderPoint,
        leadTimeDays: req.body.leadTimeDays,
        safetyStockDays: req.body.safetyStockDays,
        priority: req.body.priority,
        checkFrequencyHours: req.body.checkFrequencyHours,
      };

      const rule = await AutomatedReorderRuleService.createReorderRule(
        tenantId,
        userId,
        ruleData
      );

      res.status(201).json({
        success: true,
        message: 'Automated reorder rule created successfully',
        data: rule,
      });
    } catch (error: any) {
      logger.error('Create reorder rule error:', error);
      next(error);
    }
  }

  /**
   * Update an automated reorder rule
   */
  static async updateReorderRule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const { ruleId } = req.params;
      if (!ruleId) {
        res.status(400).json({
          success: false,
          message: 'Rule ID is required',
        });
        return;
      }

      const tenantId = req.tenantId!;
      const userId = req.user!.id;

      const updateData: UpdateReorderRuleData = {};
      if (req.body.ruleName !== undefined) updateData.ruleName = req.body.ruleName;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.productId !== undefined) updateData.productId = req.body.productId;
      if (req.body.categoryId !== undefined) updateData.categoryId = req.body.categoryId;
      if (req.body.storeIds !== undefined) updateData.storeIds = req.body.storeIds;
      if (req.body.regionId !== undefined) updateData.regionId = req.body.regionId;
      if (req.body.minStockLevel !== undefined) updateData.minStockLevel = req.body.minStockLevel;
      if (req.body.maxStockLevel !== undefined) updateData.maxStockLevel = req.body.maxStockLevel;
      if (req.body.reorderQuantity !== undefined) updateData.reorderQuantity = req.body.reorderQuantity;
      if (req.body.reorderPoint !== undefined) updateData.reorderPoint = req.body.reorderPoint;
      if (req.body.leadTimeDays !== undefined) updateData.leadTimeDays = req.body.leadTimeDays;
      if (req.body.safetyStockDays !== undefined) updateData.safetyStockDays = req.body.safetyStockDays;
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
      if (req.body.priority !== undefined) updateData.priority = req.body.priority;
      if (req.body.checkFrequencyHours !== undefined) updateData.checkFrequencyHours = req.body.checkFrequencyHours;

      const rule = await AutomatedReorderRuleService.updateReorderRule(
        ruleId,
        tenantId,
        userId,
        updateData
      );

      res.json({
        success: true,
        message: 'Automated reorder rule updated successfully',
        data: rule,
      });
    } catch (error: any) {
      logger.error('Update reorder rule error:', error);
      next(error);
    }
  }

  /**
   * Delete an automated reorder rule
   */
  static async deleteReorderRule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ruleId } = req.params;
      if (!ruleId) {
        res.status(400).json({
          success: false,
          message: 'Rule ID is required',
        });
        return;
      }

      const tenantId = req.tenantId!;
      const userId = req.user!.id;

      await AutomatedReorderRuleService.deleteReorderRule(ruleId, tenantId, userId);

      res.json({
        success: true,
        message: 'Automated reorder rule deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete reorder rule error:', error);
      next(error);
    }
  }

  /**
   * Get reorder rules with filtering
   */
  static async getReorderRules(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;

      const filters: any = {};
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }
      if (req.query.productId) {
        filters.productId = req.query.productId as string;
      }
      if (req.query.categoryId) {
        filters.categoryId = req.query.categoryId as string;
      }
      if (req.query.regionId) {
        filters.regionId = req.query.regionId as string;
      }
      if (req.query.priority) {
        filters.priority = req.query.priority as 'low' | 'normal' | 'high';
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

      if (limit !== undefined) filters.limit = limit;
      if (offset !== undefined) filters.offset = offset;

      const { rules, total } = await AutomatedReorderRuleService.getReorderRules(
        tenantId,
        filters
      );

      res.json({
        success: true,
        data: {
          rules,
          total,
          limit,
          offset,
        },
      });
    } catch (error: any) {
      logger.error('Get reorder rules error:', error);
      next(error);
    }
  }

  /**
   * Get reorder rule by ID
   */
  static async getReorderRuleById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ruleId } = req.params;
      if (!ruleId) {
        res.status(400).json({
          success: false,
          message: 'Rule ID is required',
        });
        return;
      }

      const tenantId = req.tenantId!;

      const rule = await AutomatedReorderRuleService.getReorderRuleById(ruleId, tenantId);

      if (!rule) {
        res.status(404).json({
          success: false,
          message: 'Automated reorder rule not found',
        });
        return;
      }

      res.json({
        success: true,
        data: rule,
      });
    } catch (error: any) {
      logger.error('Get reorder rule by ID error:', error);
      next(error);
    }
  }

  /**
   * Check and execute automated reorder rules
   */
  static async checkAndExecuteReorderRules(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;

      const options: any = {};
      if (req.body.forceCheck !== undefined) options.forceCheck = req.body.forceCheck;
      if (req.body.maxTransfersPerRule !== undefined) options.maxTransfersPerRule = req.body.maxTransfersPerRule;
      if (req.body.dryRun !== undefined) options.dryRun = req.body.dryRun;

      const result = await AutomatedReorderRuleService.checkAndExecuteReorderRules(
        tenantId,
        options
      );

      res.json({
        success: true,
        message: 'Automated reorder check completed',
        data: result,
      });
    } catch (error: any) {
      logger.error('Check and execute reorder rules error:', error);
      next(error);
    }
  }

  /**
   * Get reorder rule statistics
   */
  static async getReorderRuleStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;

      const stats = await AutomatedReorderRuleService.getReorderRuleStats(tenantId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get reorder rule stats error:', error);
      next(error);
    }
  }
}

// Validation middleware
export const createReorderRuleValidators = [
  body('ruleName')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Rule name must be between 1 and 200 characters'),
  body('productId')
    .optional()
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),
  body('storeIds')
    .optional()
    .isArray()
    .withMessage('Store IDs must be an array'),
  body('storeIds.*')
    .optional()
    .isUUID()
    .withMessage('Each store ID must be a valid UUID'),
  body('regionId')
    .optional()
    .isUUID()
    .withMessage('Region ID must be a valid UUID'),
  body('minStockLevel')
    .isFloat({ min: 0 })
    .withMessage('Minimum stock level must be a non-negative number'),
  body('maxStockLevel')
    .isFloat({ min: 0 })
    .withMessage('Maximum stock level must be a non-negative number'),
  body('reorderQuantity')
    .isFloat({ min: 0.001 })
    .withMessage('Reorder quantity must be greater than 0'),
  body('reorderPoint')
    .isFloat({ min: 0 })
    .withMessage('Reorder point must be a non-negative number'),
  body('leadTimeDays')
    .isInt({ min: 1 })
    .withMessage('Lead time days must be at least 1'),
  body('safetyStockDays')
    .isInt({ min: 0 })
    .withMessage('Safety stock days must be non-negative'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high'])
    .withMessage('Priority must be low, normal, or high'),
  body('checkFrequencyHours')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Check frequency hours must be between 1 and 168'),
];

export const updateReorderRuleValidators = [
  param('ruleId')
    .isUUID()
    .withMessage('Rule ID must be a valid UUID'),
  body('ruleName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Rule name must be between 1 and 200 characters'),
  body('productId')
    .optional()
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),
  body('storeIds')
    .optional()
    .isArray()
    .withMessage('Store IDs must be an array'),
  body('storeIds.*')
    .optional()
    .isUUID()
    .withMessage('Each store ID must be a valid UUID'),
  body('regionId')
    .optional()
    .isUUID()
    .withMessage('Region ID must be a valid UUID'),
  body('minStockLevel')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum stock level must be a non-negative number'),
  body('maxStockLevel')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum stock level must be a non-negative number'),
  body('reorderQuantity')
    .optional()
    .isFloat({ min: 0.001 })
    .withMessage('Reorder quantity must be greater than 0'),
  body('reorderPoint')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Reorder point must be a non-negative number'),
  body('leadTimeDays')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Lead time days must be at least 1'),
  body('safetyStockDays')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Safety stock days must be non-negative'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high'])
    .withMessage('Priority must be low, normal, or high'),
  body('checkFrequencyHours')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Check frequency hours must be between 1 and 168'),
];

export const getReorderRuleValidators = [
  param('ruleId')
    .isUUID()
    .withMessage('Rule ID must be a valid UUID'),
];

export const deleteReorderRuleValidators = [
  param('ruleId')
    .isUUID()
    .withMessage('Rule ID must be a valid UUID'),
];

export const checkReorderRulesValidators = [
  body('forceCheck')
    .optional()
    .isBoolean()
    .withMessage('Force check must be a boolean'),
  body('maxTransfersPerRule')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max transfers per rule must be between 1 and 100'),
  body('dryRun')
    .optional()
    .isBoolean()
    .withMessage('Dry run must be a boolean'),
];

export default AutomatedReorderRuleController;