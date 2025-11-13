import { Op, WhereOptions, IncludeOptions, Transaction } from 'sequelize';
import { AuditLog, Tenant, Store, User } from '../db/models';
import logger from '../config/logger';

export interface AuditLogQueryOptions {
  tenantId?: string;
  storeId?: string;
  userId?: string;
  objectTable?: string;
  objectId?: string;
  action?: 'INSERT' | 'UPDATE' | 'DELETE';
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  includeDetails?: boolean;
}

export interface ComplianceReportOptions {
  tenantId: string;
  reportType: 'inventory_transfers' | 'user_activity' | 'financial_transactions' | 'data_changes';
  dateFrom: Date;
  dateTo: Date;
  storeIds?: string[];
  userIds?: string[];
}

export interface ComplianceReport {
  reportType: string;
  generatedAt: Date;
  dateRange: {
    from: Date;
    to: Date;
  };
  tenantId: string;
  summary: {
    totalRecords: number;
    criticalActions: number;
    storesAffected: number;
    usersInvolved: number;
  };
  details: any[];
  compliance: {
    status: 'compliant' | 'warning' | 'non_compliant';
    issues: string[];
    recommendations: string[];
  };
}

type AuditLogWithRelations = AuditLog & {
  user?: any;
  store?: any;
  tenant?: any;
};

export class AuditService {
  /**
   * Query audit logs with filtering and pagination
   */
  static async queryAuditLogs(options: AuditLogQueryOptions): Promise<{
    logs: AuditLog[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const where: WhereOptions = {};

      if (options.tenantId) {
        where.tenantId = options.tenantId;
      }

      if (options.storeId) {
        where.storeId = options.storeId;
      }

      if (options.userId) {
        where.userId = options.userId;
      }

      if (options.objectTable) {
        where.objectTable = options.objectTable;
      }

      if (options.objectId) {
        where.objectId = options.objectId;
      }

      if (options.action) {
        where.action = options.action;
      }

      if (options.dateFrom || options.dateTo) {
        where.changedAt = {};
        if (options.dateFrom) {
          (where.changedAt as any)[Op.gte] = options.dateFrom;
        }
        if (options.dateTo) {
          (where.changedAt as any)[Op.lte] = options.dateTo;
        }
      }

      const include: IncludeOptions[] = [];
      if (options.includeDetails) {
        include.push(
          {
            model: Tenant,
            as: 'tenant',
            attributes: ['id', 'name'],
          },
          {
            model: Store,
            as: 'store',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          }
        );
      }

      const limit = Math.min(options.limit || 50, 1000); // Max 1000 records
      const offset = options.offset || 0;

      const { rows: logs, count: total } = await AuditLog.findAndCountAll({
        where,
        include,
        limit: limit + 1, // Get one extra to check if there are more
        offset,
        order: [['changedAt', 'DESC']],
      });

      const hasMore = logs.length > limit;
      if (hasMore) {
        logs.pop(); // Remove the extra record
      }

      return {
        logs,
        total,
        hasMore,
      };
    } catch (error) {
      logger.error('Error querying audit logs:', error);
      throw new Error('Failed to query audit logs');
    }
  }

  /**
   * Get audit trail for a specific object
   */
  static async getObjectAuditTrail(
    tenantId: string,
    objectTable: string,
    objectId: string,
    includeDetails: boolean = true
  ): Promise<AuditLog[]> {
    try {
      const include: IncludeOptions[] = [];
      if (includeDetails) {
        include.push(
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          }
        );
      }

      const logs = await AuditLog.findAll({
        where: {
          tenantId,
          objectTable,
          objectId,
        },
        include,
        order: [['changedAt', 'ASC']],
      });

      return logs;
    } catch (error) {
      logger.error('Error getting object audit trail:', error);
      throw new Error('Failed to get object audit trail');
    }
  }

  /**
   * Get inter-store transaction audit trail
   */
  static async getInterStoreTransactionAudit(
    tenantId: string,
    dateFrom: Date,
    dateTo: Date,
    storeIds?: string[]
  ): Promise<AuditLog[]> {
    try {
      const where: WhereOptions = {
        tenantId,
        objectTable: 'inventory_transfers',
        changedAt: {
          [Op.between]: [dateFrom, dateTo],
        },
      };

      if (storeIds && storeIds.length > 0) {
        where.storeId = { [Op.in]: storeIds };
      }

      const logs = await AuditLog.findAll({
        where,
        include: [
          {
            model: Store,
            as: 'store',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
        order: [['changedAt', 'ASC']],
      });

      return logs;
    } catch (error) {
      logger.error('Error getting inter-store transaction audit:', error);
      throw new Error('Failed to get inter-store transaction audit');
    }
  }

  /**
   * Generate compliance report
   */
  static async generateComplianceReport(options: ComplianceReportOptions): Promise<ComplianceReport> {
    try {
      const { tenantId, reportType, dateFrom, dateTo, storeIds, userIds } = options;

      let logs: AuditLog[] = [];
      let summary = {
        totalRecords: 0,
        criticalActions: 0,
        storesAffected: 0,
        usersInvolved: 0,
      };

      const baseWhere: WhereOptions = {
        tenantId,
        changedAt: {
          [Op.between]: [dateFrom, dateTo],
        },
      };

      if (storeIds && storeIds.length > 0) {
        baseWhere.storeId = { [Op.in]: storeIds };
      }

      if (userIds && userIds.length > 0) {
        baseWhere.userId = { [Op.in]: userIds };
      }

      switch (reportType) {
        case 'inventory_transfers':
          logs = await AuditLog.findAll({
            where: {
              ...baseWhere,
              objectTable: 'inventory_transfers',
            },
            include: [
              {
                model: Store,
                as: 'store',
                attributes: ['id', 'name', 'code'],
              },
              {
                model: User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'email'],
              },
            ],
            order: [['changedAt', 'ASC']],
          });
          break;

        case 'user_activity':
          logs = await AuditLog.findAll({
            where: baseWhere,
            include: [
              {
                model: Store,
                as: 'store',
                attributes: ['id', 'name', 'code'],
              },
              {
                model: User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'email'],
              },
            ],
            order: [['changedAt', 'ASC']],
          });
          break;

        case 'financial_transactions':
          logs = await AuditLog.findAll({
            where: {
              ...baseWhere,
              objectTable: { [Op.in]: ['orders', 'payments', 'refunds'] },
            },
            include: [
              {
                model: Store,
                as: 'store',
                attributes: ['id', 'name', 'code'],
              },
              {
                model: User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'email'],
              },
            ],
            order: [['changedAt', 'ASC']],
          });
          break;

        case 'data_changes':
          logs = await AuditLog.findAll({
            where: {
              ...baseWhere,
              action: { [Op.in]: ['INSERT', 'UPDATE', 'DELETE'] },
            },
            include: [
              {
                model: Store,
                as: 'store',
                attributes: ['id', 'name', 'code'],
              },
              {
                model: User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'email'],
              },
            ],
            order: [['changedAt', 'ASC']],
          });
          break;

        default:
          throw new Error(`Unsupported report type: ${reportType}`);
      }

      // Calculate summary statistics
      summary.totalRecords = logs.length;
      summary.criticalActions = logs.filter(log =>
        this.isCriticalAction(log.action, log.objectTable)
      ).length;

      const uniqueStores = new Set(logs.map(log => log.storeId).filter(Boolean));
      summary.storesAffected = uniqueStores.size;

      const uniqueUsers = new Set(logs.map(log => log.userId).filter(Boolean));
      summary.usersInvolved = uniqueUsers.size;

      // Generate compliance assessment
      const compliance = this.assessCompliance(logs, reportType);

      return {
        reportType,
        generatedAt: new Date(),
        dateRange: {
          from: dateFrom,
          to: dateTo,
        },
        tenantId,
        summary,
        details: logs.map(log => {
          const logWithRelations = log as AuditLogWithRelations;

          return {
            id: log.id,
            timestamp: log.changedAt,
            action: log.action,
            objectTable: log.objectTable,
            objectId: log.objectId,
            user: logWithRelations.user ? {
              id: logWithRelations.user.id,
              name: `${logWithRelations.user.firstName} ${logWithRelations.user.lastName}`,
              email: logWithRelations.user.email,
            } : null,
            store: logWithRelations.store ? {
              id: logWithRelations.store.id,
              name: logWithRelations.store.name,
            } : null,
            data: logWithRelations.data,
          };
        }),
        compliance,
      };
    } catch (error) {
      logger.error('Error generating compliance report:', error);
      throw new Error('Failed to generate compliance report');
    }
  }

  /**
   * Get audit statistics for dashboard
   */
  static async getAuditStatistics(tenantId: string, days: number = 30): Promise<{
    totalLogs: number;
    criticalActions: number;
    topUsers: Array<{ userId: string; userName: string; actionCount: number }>;
    topTables: Array<{ table: string; actionCount: number }>;
    recentActivity: AuditLog[];
  }> {
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      const logs = await AuditLog.findAll({
        where: {
          tenantId,
          changedAt: {
            [Op.gte]: dateFrom,
          },
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
        order: [['changedAt', 'DESC']],
        limit: 100,
      });

      const totalLogs = logs.length;
      const criticalActions = logs.filter(log =>
        this.isCriticalAction(log.action, log.objectTable)
      ).length;

      // Top users by activity
      const userActivity = new Map<string, { userId: string; userName: string; count: number }>();
      logs.forEach(log => {
        const logWithRelations = log as AuditLogWithRelations;

        if (log.userId && logWithRelations.user) {
          const key = log.userId;
          const existing = userActivity.get(key);
          if (existing) {
            existing.count++;
          } else {
            userActivity.set(key, {
              userId: log.userId,
              userName: `${logWithRelations.user.firstName} ${logWithRelations.user.lastName}`,
              count: 1,
            });
          }
        }
      });

      const topUsers = Array.from(userActivity.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(item => ({
          userId: item.userId,
          userName: item.userName,
          actionCount: item.count,
        }));

      // Top tables by activity
      const tableActivity = new Map<string, number>();
      logs.forEach(log => {
        const key = log.objectTable;
        tableActivity.set(key, (tableActivity.get(key) || 0) + 1);
      });

      const topTables = Array.from(tableActivity.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([table, actionCount]) => ({ table, actionCount }));

      return {
        totalLogs,
        criticalActions,
        topUsers,
        topTables,
        recentActivity: logs.slice(0, 20),
      };
    } catch (error) {
      logger.error('Error getting audit statistics:', error);
      throw new Error('Failed to get audit statistics');
    }
  }

  /**
   * Check if an action is considered critical for compliance
   */
  private static isCriticalAction(action: string, objectTable: string): boolean {
    // DELETE operations are always critical
    if (action === 'DELETE') return true;

    // Critical tables for compliance
    const criticalTables = [
      'inventory_transfers',
      'payments',
      'refunds',
      'inventory',
      'system_users',
      'roles',
      'permissions',
    ];

    return criticalTables.includes(objectTable);
  }

  /**
   * Assess compliance status based on audit logs
   */
  private static assessCompliance(logs: AuditLog[], reportType: string): {
    status: 'compliant' | 'warning' | 'non_compliant';
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for unauthorized deletions
    const deletions = logs.filter(log => log.action === 'DELETE');
    if (deletions.length > 0) {
      issues.push(`${deletions.length} deletion operations detected`);
      recommendations.push('Review deletion operations for authorization and necessity');
    }

    // Check for large inventory transfers (potential compliance issue)
    if (reportType === 'inventory_transfers') {
      const largeTransfers = logs.filter(log => {
        const data = log.data;
        return data && data.quantity && Math.abs(data.quantity) > 1000; // Arbitrary threshold
      });
      if (largeTransfers.length > 0) {
        issues.push(`${largeTransfers.length} large inventory transfers detected`);
        recommendations.push('Verify approval process for large inventory transfers');
      }
    }

    // Check for frequent changes to sensitive data
    const sensitiveTables = ['system_users', 'roles', 'permissions'];
    const sensitiveChanges = logs.filter(log => sensitiveTables.includes(log.objectTable));
    if (sensitiveChanges.length > 10) { // Arbitrary threshold
      issues.push('High frequency of changes to sensitive data');
      recommendations.push('Implement additional approval workflows for sensitive data changes');
    }

    // Determine overall status
    let status: 'compliant' | 'warning' | 'non_compliant' = 'compliant';
    if (issues.length > 0) {
      status = issues.length > 3 ? 'non_compliant' : 'warning';
    }

    return {
      status,
      issues,
      recommendations,
    };
  }

  /**
   * Create a manual audit log entry
   */
  static async createAuditLog(
    tenantId: string,
    userId: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    objectTable: string,
    objectId?: string,
    data?: any,
    storeId?: string,
    transaction?: Transaction
  ): Promise<AuditLog> {
    try {
      const auditData: any = {
        tenantId,
        userId,
        objectTable,
        action,
        data,
        changedAt: new Date(),
      };

      if (storeId) {
        auditData.storeId = storeId;
      }

      if (objectId) {
        auditData.objectId = objectId;
      }

      const auditLog = await AuditLog.create(auditData, transaction ? { transaction } : {});

      return auditLog;
    } catch (error) {
      logger.error('Error creating audit log:', error);
      throw new Error('Failed to create audit log');
    }
  }

  /**
   * Clean up old audit logs (retention policy)
   */
  static async cleanupOldAuditLogs(retentionDays: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const deletedCount = await AuditLog.destroy({
        where: {
          changedAt: {
            [Op.lt]: cutoffDate,
          },
        },
      });

      logger.info(`Cleaned up ${deletedCount} old audit log entries`);
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old audit logs:', error);
      throw new Error('Failed to cleanup old audit logs');
    }
  }
}

export default AuditService;