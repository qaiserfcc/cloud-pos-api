import { Transaction, Op, fn, col, literal } from 'sequelize';
import { ApprovalRule, ApprovalRequest, User } from '../db/models';
import type { ApprovalRuleConditions } from '../db/models/ApprovalRule';
import logger from '../config/logger';
import { AuditService } from './audit.service';
// Use dynamic import for inventory-transfer.service only when needed to avoid circular deps

export interface CreateApprovalRequestData {
  tenantId: string;
  storeId?: string;
  requestedById: string;
  objectType: 'inventory_transfer' | 'inventory_adjustment' | 'sale' | 'refund';
  objectId: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  approvalData: {
    amount?: number;
    currency?: string;
    details?: any;
    metadata?: Record<string, any>;
  };
}

export interface ApprovalDecision {
  approverId: string;
  decision: 'approved' | 'rejected';
  comments?: string;
}

export class ApprovalService {
  // No instance needed since we use static AuditService methods

  /**
   * Create a new approval request based on business rules
   */
  async createApprovalRequest(data: CreateApprovalRequestData, transaction?: Transaction): Promise<ApprovalRequest> {
    try {
      // Find applicable approval rule
      const rule = await this.findApplicableRule(data.tenantId, data.objectType, data.approvalData, data.storeId);

      if (!rule || !rule.conditions.requiresApproval) {
        // Auto-approve if no rule requires approval
        return await this.createAutoApprovedRequest(data, transaction);
      }

      // Create approval request with rule
      const requestData: any = {
        ...data,
        approvalRuleId: rule.id,
        currentLevel: 1,
        totalLevels: rule.conditions.approvalLevels.length,
        requiredApprovals: rule.conditions.approvalLevels[0]?.minApprovals || 1,
        approvedCount: 0,
        rejectedCount: 0,
        approvals: [],
        status: 'pending',
        priority: data.priority || 'medium',
      };

      const expiryDate = this.calculateExpiryDate(rule.conditions);
      if (expiryDate) {
        requestData.expiresAt = expiryDate;
      }

      const request = await ApprovalRequest.create(requestData, transaction ? { transaction } : {});

      // Audit the approval request creation
      await AuditService.createAuditLog(
        data.tenantId,
        data.requestedById,
        'INSERT',
        'approval_request',
        request.id,
        {
          objectType: data.objectType,
          objectId: data.objectId,
          ruleId: rule.id,
          priority: data.priority,
        },
        data.storeId,
        transaction
      );

      logger.info(`Approval request created: ${request.id} for ${data.objectType}:${data.objectId}`);
      return request;
    } catch (error) {
      logger.error('Error creating approval request:', error);
      throw error;
    }
  }

  /**
   * Process an approval decision
   */
  async processApproval(requestId: string, decision: ApprovalDecision, transaction?: Transaction): Promise<ApprovalRequest> {
    try {
      const request = await ApprovalRequest.findByPk(requestId, transaction ? { transaction } : {});
      if (!request) {
        throw new Error('Approval request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Approval request is not in pending status');
      }

      // Check if approver is authorized for current level
      await this.validateApprover(request, decision.approverId);

      // Record the approval
      const approvalRecord = {
        level: request.currentLevel,
        approverId: decision.approverId,
        approverRole: await this.getUserRole(decision.approverId),
        decision: decision.decision,
        comments: decision.comments || '',
        approvedAt: new Date(),
      };

      const updatedApprovals = [...request.approvals, approvalRecord];
      const updatedApprovedCount = decision.decision === 'approved' ? request.approvedCount + 1 : request.approvedCount;
      const updatedRejectedCount = decision.decision === 'rejected' ? request.rejectedCount + 1 : request.rejectedCount;

      // Determine next status
      let newStatus: 'pending' | 'approved' | 'rejected' = request.status;
      let newCurrentLevel = request.currentLevel;
      let approvedAt: Date | undefined;
      let rejectedAt: Date | undefined;

      if (decision.decision === 'rejected') {
        newStatus = 'rejected';
        rejectedAt = new Date();
      } else if (updatedApprovedCount >= request.requiredApprovals) {
        // Check if we need to move to next level
        if (request.currentLevel < request.totalLevels) {
          newCurrentLevel = request.currentLevel + 1;
          const rule = await ApprovalRule.findByPk(request.approvalRuleId);
          const nextLevel = rule?.conditions.approvalLevels.find(l => l.level === newCurrentLevel);
          if (nextLevel) {
            // Reset counts for new level
            await request.update(
              {
                approvals: updatedApprovals,
                approvedCount: 0,
                rejectedCount: 0,
                currentLevel: newCurrentLevel,
                requiredApprovals: nextLevel.minApprovals,
              },
              transaction ? { transaction } : {}
            );
          }
        } else {
          // All levels approved
          newStatus = 'approved';
          approvedAt = new Date();
        }
      }

      // Update the request
      const updateData: any = {
        approvals: updatedApprovals,
        approvedCount: updatedApprovedCount,
        rejectedCount: updatedRejectedCount,
        status: newStatus,
        currentLevel: newCurrentLevel,
      };

      if (approvedAt) updateData.approvedAt = approvedAt;
      if (rejectedAt) updateData.rejectedAt = rejectedAt;

      await request.update(updateData, transaction ? { transaction } : {});

      // Handle specific object type actions after approval decision
      if (newStatus === 'approved' || newStatus === 'rejected') {
        if (request.objectType === 'inventory_transfer' && request.objectId) {
          try {
            const { InventoryTransferService } = await import('./inventory-transfer.service');
            await InventoryTransferService.handleApprovalDecision(
              request.objectId,
              request.tenantId,
              newStatus,
              decision.approverId,
              decision.comments
            );
            logger.info(`Inventory transfer approval decision processed: ${request.objectId} - ${newStatus}`);
          } catch (error) {
            logger.error('Error processing inventory transfer approval decision:', error);
            // Don't fail the approval process if the downstream action fails
          }
        }
      }

      // Audit the approval decision
      await AuditService.createAuditLog(
        request.tenantId,
        decision.approverId,
        decision.decision === 'approved' ? 'UPDATE' : 'DELETE',
        'approval_request',
        request.id,
        {
          level: request.currentLevel,
          comments: decision.comments,
          newStatus,
        },
        request.storeId,
        transaction
      );

      logger.info(`Approval decision processed: ${request.id} - ${decision.decision} by ${decision.approverId}`);
      return request;
    } catch (error) {
      logger.error('Error processing approval:', error);
      throw error;
    }
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovalsForUser(userId: string, tenantId: string): Promise<ApprovalRequest[]> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's roles
      const userRoles = user.roles || [];

      // Find all pending requests where user can approve
      const requests = await ApprovalRequest.findAll({
        where: {
          tenantId,
          status: 'pending',
        },
        include: [
          {
            model: ApprovalRule,
            as: 'approvalRule',
            where: {
              isActive: true,
            },
            required: false,
          },
        ],
      });

      // Filter requests where user has approval rights for current level
      const approvableRequests = [];
      for (const request of requests) {
        if (await this.canUserApprove(request, userId, userRoles)) {
          approvableRequests.push(request);
        }
      }

      return approvableRequests;
    } catch (error) {
      logger.error('Error getting pending approvals:', error);
      throw error;
    }
  }

  /**
   * Check if approval is required for an operation
   */
  async isApprovalRequired(
    tenantId: string,
    objectType: 'inventory_transfer' | 'inventory_adjustment' | 'sale' | 'refund',
    approvalData: any,
    storeId?: string
  ): Promise<boolean> {
    try {
      const rule = await this.findApplicableRule(tenantId, objectType, approvalData, storeId);
      return rule?.conditions.requiresApproval || false;
    } catch (error) {
      logger.error('Error checking approval requirement:', error);
      return false;
    }
  }

  /**
   * Cancel an approval request
   */
  async cancelApprovalRequest(requestId: string, cancelledById: string, reason?: string, transaction?: Transaction): Promise<ApprovalRequest> {
    try {
      const request = await ApprovalRequest.findByPk(requestId, transaction ? { transaction } : {});
      if (!request) {
        throw new Error('Approval request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Only pending requests can be cancelled');
      }

      if (request.requestedById !== cancelledById) {
        // Check if user has permission to cancel others' requests
        const user = await User.findByPk(cancelledById);
        if (!user?.roles?.includes('admin') && !user?.roles?.includes('manager')) {
          throw new Error('Unauthorized to cancel this request');
        }
      }

      await request.update({
        status: 'cancelled',
        cancelledAt: new Date(),
      }, transaction ? { transaction } : {});

      // Audit the cancellation
      await AuditService.createAuditLog(
        request.tenantId,
        cancelledById,
        'DELETE',
        'approval_request',
        request.id,
        { reason },
        request.storeId,
        transaction
      );

      logger.info(`Approval request cancelled: ${request.id}`);
      return request;
    } catch (error) {
      logger.error('Error cancelling approval request:', error);
      throw error;
    }
  }

  /**
   * Get approval statistics for a tenant
   */
  async getApprovalStatistics(tenantId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const whereClause: any = { tenantId };
      if (dateRange) {
        whereClause.createdAt = {
          [Op.between]: [dateRange.start, dateRange.end],
        };
      }

      const [stats] = await ApprovalRequest.findAll({
        where: whereClause,
        attributes: [
          [
            fn('COUNT', col('id')),
            'totalRequests',
          ],
          [
            fn('COUNT',
              literal('CASE WHEN status = \'approved\' THEN 1 END')
            ),
            'approvedRequests',
          ],
          [
            fn('COUNT',
              literal('CASE WHEN status = \'rejected\' THEN 1 END')
            ),
            'rejectedRequests',
          ],
          [
            fn('COUNT',
              literal('CASE WHEN status = \'pending\' THEN 1 END')
            ),
            'pendingRequests',
          ],
          [
            fn('AVG',
              literal('EXTRACT(EPOCH FROM (approved_at - created_at))/3600')
            ),
            'avgApprovalTimeHours',
          ],
        ],
        raw: true,
      });

      return stats;
    } catch (error) {
      logger.error('Error getting approval statistics:', error);
      throw error;
    }
  }

  // Private helper methods

  private async findApplicableRule(
    tenantId: string,
    objectType: string,
    approvalData: any,
    storeId?: string
  ): Promise<ApprovalRule | null> {
    const rules = await ApprovalRule.findAll({
      where: {
        tenantId,
        objectType,
        isActive: true,
      },
      order: [['createdAt', 'DESC']],
    });

    // Find the most specific rule that matches
    for (const rule of rules) {
      if (this.matchesRuleConditions(rule, approvalData, storeId)) {
        return rule;
      }
    }

    return null;
  }

  private matchesRuleConditions(rule: ApprovalRule, approvalData: any, storeId?: string): boolean {
    const conditions = rule.conditions;

    // If no conditions defined, rule doesn't match
    if (!conditions) {
      return false;
    }

    // Check amount conditions
    if (conditions.minAmount !== undefined && approvalData.amount < conditions.minAmount) {
      return false;
    }
    if (conditions.maxAmount !== undefined && approvalData.amount > conditions.maxAmount) {
      return false;
    }

    // Check store conditions
    if (conditions.storeIds && conditions.storeIds.length > 0 && storeId) {
      if (!conditions.storeIds.includes(storeId)) {
        return false;
      }
    }

    return true;
  }

  private async createAutoApprovedRequest(data: CreateApprovalRequestData, transaction?: Transaction): Promise<ApprovalRequest> {
    return await ApprovalRequest.create({
      ...data,
      status: 'approved',
      approvedAt: new Date(),
      currentLevel: 1,
      totalLevels: 1,
      requiredApprovals: 0,
      approvedCount: 1,
      rejectedCount: 0,
      priority: data.priority || 'medium',
      approvals: [{
        level: 1,
        approverId: data.requestedById,
        approverRole: 'system',
        decision: 'approved',
        comments: 'Auto-approved - no rule required approval',
        approvedAt: new Date(),
      }],
    }, transaction ? { transaction } : {});
  }

  private calculateExpiryDate(conditions: ApprovalRuleConditions): Date | undefined {
    // Default 7 days expiry
    const expiryHours = conditions.expiryHours || conditions.expiresInHours || 168; // 7 days
    return new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  }

  private async validateApprover(request: ApprovalRequest, approverId: string): Promise<void> {
    if (!request.approvalRuleId) {
      throw new Error('No approval rule associated with request');
    }

    const rule = await ApprovalRule.findByPk(request.approvalRuleId);
    if (!rule) {
      throw new Error('Approval rule not found');
    }

    const currentLevel = rule.conditions.approvalLevels.find(l => l.level === request.currentLevel);
    if (!currentLevel) {
      throw new Error('Invalid approval level');
    }

    const user = await User.findByPk(approverId);
    if (!user) {
      throw new Error('Approver not found');
    }

  const userRoles = user.roles || [];
  const approverRoles = currentLevel.approverRoles || currentLevel.roles || [];
  const hasRequiredRole = approverRoles.some((role: string) => userRoles.includes(role));

    if (!hasRequiredRole) {
      throw new Error('User does not have required role for this approval level');
    }
  }

  private async canUserApprove(request: ApprovalRequest, userId: string, userRoles: string[]): Promise<boolean> {
    if (!request.approvalRuleId) {
      return false;
    }

    const rule = await ApprovalRule.findByPk(request.approvalRuleId);
    if (!rule) {
      return false;
    }

    const currentLevel = rule.conditions.approvalLevels.find(l => l.level === request.currentLevel);
    if (!currentLevel) {
      return false;
    }

  const approverRoles = currentLevel.approverRoles || currentLevel.roles || [];
  return approverRoles.some((role: string) => userRoles.includes(role));
  }

  private async getUserRole(userId: string): Promise<string> {
    const user = await User.findByPk(userId);
    return user?.roles?.[0] || 'user';
  }
}

export default ApprovalService;