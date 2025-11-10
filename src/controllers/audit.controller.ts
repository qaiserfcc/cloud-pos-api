import { Request, Response, NextFunction } from 'express';
import AuditService, { AuditLogQueryOptions, ComplianceReportOptions } from '../services/audit.service';
import logger from '../config/logger';

export class AuditController {
  /**
   * Query audit logs with filtering and pagination
   */
  static async queryAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        tenantId,
        storeId,
        userId,
        objectTable,
        objectId,
        action,
        dateFrom,
        dateTo,
        limit,
        offset,
        includeDetails,
      } = req.query;

      const options: AuditLogQueryOptions = {
        tenantId: tenantId as string,
        storeId: storeId as string,
        userId: userId as string,
        objectTable: objectTable as string,
        objectId: objectId as string,
        action: action as 'INSERT' | 'UPDATE' | 'DELETE',
        includeDetails: includeDetails === 'true',
      };

      if (dateFrom) {
        options.dateFrom = new Date(dateFrom as string);
      }

      if (dateTo) {
        options.dateTo = new Date(dateTo as string);
      }

      if (limit) {
        options.limit = parseInt(limit as string, 10);
      }

      if (offset) {
        options.offset = parseInt(offset as string, 10);
      }

      const result = await AuditService.queryAuditLogs(options);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error in queryAuditLogs:', error);
      next(error);
    }
  }

  /**
   * Get audit trail for a specific object
   */
  static async getObjectAuditTrail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, objectTable, objectId } = req.params;
      const { includeDetails } = req.query;

      if (!tenantId || !objectTable || !objectId) {
        return next(new Error('Missing required parameters: tenantId, objectTable, objectId'));
      }

      const logs = await AuditService.getObjectAuditTrail(
        tenantId,
        objectTable,
        objectId,
        includeDetails === 'true'
      );

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      logger.error('Error in getObjectAuditTrail:', error);
      next(error);
    }
  }

  /**
   * Get inter-store transaction audit trail
   */
  static async getInterStoreTransactionAudit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.params;
      const { dateFrom, dateTo, storeIds } = req.query;

      if (!tenantId || !dateFrom || !dateTo) {
        return next(new Error('Missing required parameters: tenantId, dateFrom, dateTo'));
      }

      const storeIdsArray = storeIds ? (storeIds as string).split(',') : undefined;

      const logs = await AuditService.getInterStoreTransactionAudit(
        tenantId,
        new Date(dateFrom as string),
        new Date(dateTo as string),
        storeIdsArray
      );

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      logger.error('Error in getInterStoreTransactionAudit:', error);
      next(error);
    }
  }

  /**
   * Generate compliance report
   */
  static async generateComplianceReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.params;
      const {
        reportType,
        dateFrom,
        dateTo,
        storeIds,
        userIds,
      } = req.body;

      if (!tenantId || !reportType || !dateFrom || !dateTo) {
        return next(new Error('Missing required parameters: tenantId, reportType, dateFrom, dateTo'));
      }

      const options: ComplianceReportOptions = {
        tenantId,
        reportType,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        storeIds: storeIds ? storeIds.split(',') : undefined,
        userIds: userIds ? userIds.split(',') : undefined,
      };

      const report = await AuditService.generateComplianceReport(options);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      logger.error('Error in generateComplianceReport:', error);
      next(error);
    }
  }

  /**
   * Get audit statistics for dashboard
   */
  static async getAuditStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.params;
      const { days } = req.query;

      if (!tenantId) {
        return next(new Error('Missing required parameter: tenantId'));
      }

      const daysNum = days ? parseInt(days as string, 10) : 30;

      const statistics = await AuditService.getAuditStatistics(tenantId, daysNum);

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      logger.error('Error in getAuditStatistics:', error);
      next(error);
    }
  }

  /**
   * Create a manual audit log entry (for testing/admin purposes)
   */
  static async createAuditLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId, action, objectTable, objectId, data, storeId } = req.body;

      if (!tenantId || !userId || !action || !objectTable) {
        return next(new Error('Missing required parameters: tenantId, userId, action, objectTable'));
      }

      const auditLog = await AuditService.createAuditLog(
        tenantId,
        userId,
        action,
        objectTable,
        objectId,
        data,
        storeId
      );

      res.status(201).json({
        success: true,
        data: auditLog,
      });
    } catch (error) {
      logger.error('Error in createAuditLog:', error);
      next(error);
    }
  }

  /**
   * Clean up old audit logs (admin only)
   */
  static async cleanupOldAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { retentionDays } = req.body;

      const days = retentionDays ? parseInt(retentionDays, 10) : 365;

      const deletedCount = await AuditService.cleanupOldAuditLogs(days);

      res.json({
        success: true,
        data: {
          deletedCount,
          retentionDays: days,
        },
      });
    } catch (error) {
      logger.error('Error in cleanupOldAuditLogs:', error);
      next(error);
    }
  }

  /**
   * Get audit log by ID
   */
  static async getAuditLogById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { includeDetails } = req.query;

      if (!id) {
        return next(new Error('Missing required parameter: id'));
      }

      const options: AuditLogQueryOptions = {
        includeDetails: includeDetails === 'true',
      };

      // Get single log by ID
      const result = await AuditService.queryAuditLogs({
        ...options,
        limit: 1,
        offset: 0,
      });

      const auditLog = result.logs.find(log => log.id === id);

      if (!auditLog) {
        return next(new Error('Audit log not found'));
      }

      res.json({
        success: true,
        data: auditLog,
      });
    } catch (error) {
      logger.error('Error in getAuditLogById:', error);
      next(error);
    }
  }
}

export default AuditController;