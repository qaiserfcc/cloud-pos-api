import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middlewares/auth.middleware';
import ApprovalService, { CreateApprovalRequestData, ApprovalDecision } from '../services/approval.service';
import logger from '../config/logger';
import { ApprovalRule, ApprovalRequest } from '../db/models';

export class ApprovalController {
  private approvalService: ApprovalService;

  constructor() {
    this.approvalService = new ApprovalService();
  }

  /**
   * Create a new approval request
   */
  createApprovalRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      const { tenantId, storeId } = req.user;
      const { objectType, objectId, title, description, priority, approvalData } = req.body;

      const request = await this.approvalService.createApprovalRequest({
        tenantId,
        ...(storeId && { storeId }),
        requestedById: req.user.id,
        objectType,
        objectId,
        title,
        description,
        priority,
        approvalData,
      });

      res.status(201).json({
        success: true,
        message: 'Approval request created successfully',
        data: request,
      });
    } catch (error) {
      logger.error('Error creating approval request:', error);
      next(error);
    }
  };

  /**
   * Process an approval decision
   */
  processApproval = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

      const { requestId } = req.params;
      if (!requestId) {
        res.status(400).json({
          success: false,
          message: 'Request ID is required',
        });
        return;
      }

      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      const { decision, comments } = req.body;
      const approverId = req.user.id;

      const request = await this.approvalService.processApproval(requestId, {
        approverId,
        decision,
        comments,
      });

      res.json({
        success: true,
        message: `Approval request ${decision}`,
        data: request,
      });
    } catch (error) {
      logger.error('Error processing approval:', error);
      next(error);
    }
  };

  /**
   * Get pending approvals for current user
   */
  getPendingApprovals = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      const { tenantId } = req.user;
      const userId = req.user.id;

      const requests = await this.approvalService.getPendingApprovalsForUser(userId, tenantId);

      res.json({
        success: true,
        data: requests,
        count: requests.length,
      });
    } catch (error) {
      logger.error('Error getting pending approvals:', error);
      next(error);
    }
  };

  /**
   * Get approval request by ID
   */
  getApprovalRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { requestId } = req.params;
      const { tenantId } = req.user as any;

      const request = await ApprovalRequest.findOne({
        where: { id: requestId, tenantId },
        include: [
          {
            model: ApprovalRule,
            as: 'approvalRule',
          },
        ],
      });

      if (!request) {
        res.status(404).json({
          success: false,
          message: 'Approval request not found',
        });
        return;
      }

      res.json({
        success: true,
        data: request,
      });
    } catch (error) {
      logger.error('Error getting approval request:', error);
      next(error);
    }
  };

  /**
   * Cancel an approval request
   */
  cancelApprovalRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { requestId } = req.params;
      if (!requestId) {
        res.status(400).json({
          success: false,
          message: 'Request ID is required',
        });
        return;
      }

      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      const { reason } = req.body;
      const cancelledById = req.user.id;

      const request = await this.approvalService.cancelApprovalRequest(requestId, cancelledById, reason);

      res.json({
        success: true,
        message: 'Approval request cancelled successfully',
        data: request,
      });
    } catch (error) {
      logger.error('Error cancelling approval request:', error);
      next(error);
    }
  };

  /**
   * Get approval statistics
   */
  getApprovalStatistics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.user as any;
      const { startDate, endDate } = req.query;

      const dateRange = startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      } : undefined;

      const stats = await this.approvalService.getApprovalStatistics(tenantId, dateRange);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting approval statistics:', error);
      next(error);
    }
  };

  /**
   * Check if approval is required for an operation
   */
  checkApprovalRequired = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, storeId } = req.user as any;
      const { objectType, approvalData } = req.body;

      const required = await this.approvalService.isApprovalRequired(
        tenantId,
        objectType,
        approvalData,
        storeId
      );

      res.json({
        success: true,
        data: { required },
      });
    } catch (error) {
      logger.error('Error checking approval requirement:', error);
      next(error);
    }
  };

  /**
   * Create or update approval rule
   */
  createApprovalRule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

      const { tenantId } = req.user as any;
      const ruleData = { ...req.body, tenantId };

      const rule = await ApprovalRule.create(ruleData);

      res.status(201).json({
        success: true,
        message: 'Approval rule created successfully',
        data: rule,
      });
    } catch (error) {
      logger.error('Error creating approval rule:', error);
      next(error);
    }
  };

  /**
   * Get approval rules for tenant
   */
  getApprovalRules = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.user as any;
      const { objectType, isActive } = req.query;

      const whereClause: any = { tenantId };
      if (objectType) whereClause.objectType = objectType;
      if (isActive !== undefined) whereClause.isActive = isActive === 'true';

      const rules = await ApprovalRule.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
      });

      res.json({
        success: true,
        data: rules,
        count: rules.length,
      });
    } catch (error) {
      logger.error('Error getting approval rules:', error);
      next(error);
    }
  };

  /**
   * Update approval rule
   */
  updateApprovalRule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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
      const { tenantId } = req.user as any;

      const rule = await ApprovalRule.findOne({
        where: { id: ruleId, tenantId },
      });

      if (!rule) {
        res.status(404).json({
          success: false,
          message: 'Approval rule not found',
        });
        return;
      }

      await rule.update(req.body);

      res.json({
        success: true,
        message: 'Approval rule updated successfully',
        data: rule,
      });
    } catch (error) {
      logger.error('Error updating approval rule:', error);
      next(error);
    }
  };

  /**
   * Delete approval rule
   */
  deleteApprovalRule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ruleId } = req.params;
      const { tenantId } = req.user as any;

      const rule = await ApprovalRule.findOne({
        where: { id: ruleId, tenantId },
      });

      if (!rule) {
        res.status(404).json({
          success: false,
          message: 'Approval rule not found',
        });
        return;
      }

      await rule.destroy();

      res.json({
        success: true,
        message: 'Approval rule deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting approval rule:', error);
      next(error);
    }
  };
}

export default ApprovalController;