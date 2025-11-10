import { Op, Transaction } from 'sequelize';
import { ReportTemplate } from '../db/models';
import { ReportService, ReportFilters } from './report.service';
import { AuditService } from './audit.service';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

export interface ReportTemplateCreationData {
  tenantId: string;
  name: string;
  description?: string;
  reportType: 'sales' | 'inventory' | 'customer' | 'product' | 'business' | 'compliance' | 'audit' | 'custom';
  filters: Record<string, any>;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    timezone: string;
  };
  delivery: {
    email?: {
      recipients: string[];
      subject: string;
      body?: string;
    };
    webhook?: {
      url: string;
      headers?: Record<string, string>;
      method: 'POST' | 'PUT';
    };
    export?: {
      format: 'pdf' | 'excel' | 'csv' | 'json';
      filename: string;
    };
  };
  createdById: string;
}

export interface ReportExecutionResult {
  templateId: string;
  reportData: any;
  executionTime: number;
  deliveredTo: string[];
  status: 'success' | 'partial_success' | 'failed';
  errors?: string[];
}

export class ReportTemplateService {
  /**
   * Create a new report template
   */
  static async createTemplate(data: ReportTemplateCreationData): Promise<ReportTemplate> {
    try {
      const template = await ReportTemplate.create({
        ...data,
        isActive: true,
        ...(data.schedule && { nextRunAt: this.calculateNextRun(data.schedule) }),
      });

      logger.info(`Created report template: ${template.dataValues.id} for tenant: ${data.tenantId}`);
      return template;
    } catch (error) {
      logger.error('Error creating report template:', error);
      throw new Error('Failed to create report template');
    }
  }

  /**
   * Get report templates for a tenant
   */
  static async getTemplates(tenantId: string, filters?: {
    reportType?: string;
    isActive?: boolean;
    createdById?: string;
  }): Promise<ReportTemplate[]> {
    try {
      const where: any = { tenantId };

      if (filters?.reportType) {
        where.reportType = filters.reportType;
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters?.createdById) {
        where.createdById = filters.createdById;
      }

      const templates = await ReportTemplate.findAll({
        where,
        include: [
          {
            model: require('../db/models').User,
            as: 'createdBy',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return templates;
    } catch (error) {
      logger.error('Error getting report templates:', error);
      throw new Error('Failed to get report templates');
    }
  }

  /**
   * Get a specific report template
   */
  static async getTemplate(templateId: string, tenantId: string): Promise<ReportTemplate | null> {
    try {
      const template = await ReportTemplate.findOne({
        where: { id: templateId, tenantId },
        include: [
          {
            model: require('../db/models').User,
            as: 'createdBy',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      });

      return template;
    } catch (error) {
      logger.error('Error getting report template:', error);
      throw new Error('Failed to get report template');
    }
  }

  /**
   * Update a report template
   */
  static async updateTemplate(
    templateId: string,
    tenantId: string,
    updates: Partial<ReportTemplateCreationData>
  ): Promise<ReportTemplate> {
    try {
      const template = await ReportTemplate.findOne({
        where: { id: templateId, tenantId },
      });

      if (!template) {
        throw new Error('Report template not found');
      }

      const updateData: any = { ...updates };
      if (updates.schedule) {
        updateData.nextRunAt = this.calculateNextRun(updates.schedule);
      }

      await template.update(updateData);

      logger.info(`Updated report template: ${templateId}`);
      return template;
    } catch (error) {
      logger.error('Error updating report template:', error);
      throw new Error('Failed to update report template');
    }
  }

  /**
   * Delete a report template
   */
  static async deleteTemplate(templateId: string, tenantId: string): Promise<void> {
    try {
      const deletedCount = await ReportTemplate.destroy({
        where: { id: templateId, tenantId },
      });

      if (deletedCount === 0) {
        throw new Error('Report template not found');
      }

      logger.info(`Deleted report template: ${templateId}`);
    } catch (error) {
      logger.error('Error deleting report template:', error);
      throw new Error('Failed to delete report template');
    }
  }

  /**
   * Execute a report template
   */
  static async executeTemplate(templateId: string, tenantId: string): Promise<ReportExecutionResult> {
    const startTime = Date.now();

    try {
      const template = await this.getTemplate(templateId, tenantId);
      if (!template) {
        throw new Error('Report template not found');
      }

      if (!template.dataValues.isActive) {
        throw new Error('Report template is not active');
      }

      // Generate report based on type
      let reportData: any;
      const filters: ReportFilters = {
        ...template.dataValues.filters,
      };

      if (template.dataValues.filters.startDate) {
        filters.startDate = new Date(template.dataValues.filters.startDate);
      }

      if (template.dataValues.filters.endDate) {
        filters.endDate = new Date(template.dataValues.filters.endDate);
      }

      switch (template.dataValues.reportType) {
        case 'sales':
          reportData = await ReportService.generateSalesReport(tenantId, filters);
          break;
        case 'inventory':
          reportData = await ReportService.generateInventoryReport(tenantId, filters);
          break;
        case 'customer':
          reportData = await ReportService.generateCustomerReport(tenantId, filters);
          break;
        case 'product':
          reportData = await ReportService.generateProductReport(tenantId, filters);
          break;
        case 'business':
          reportData = await ReportService.generateBusinessReport(tenantId, filters);
          break;
        case 'compliance':
          reportData = await AuditService.generateComplianceReport({
            tenantId,
            reportType: template.dataValues.filters.reportType || 'user_activity',
            dateFrom: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            dateTo: filters.endDate || new Date(),
            storeIds: template.dataValues.filters.storeIds,
            userIds: template.dataValues.filters.userIds,
          });
          break;
        case 'audit':
          reportData = await AuditService.getAuditStatistics(tenantId, template.dataValues.filters.days || 30);
          break;
        default:
          throw new Error(`Unsupported report type: ${template.dataValues.reportType}`);
      }

      const executionTime = Date.now() - startTime;

      // Deliver report
      const deliveryResult = await this.deliverReport(template, reportData);

      // Update template metadata
      const updateData: any = {
        lastRunAt: new Date(),
      };

      if (template.dataValues.schedule) {
        updateData.nextRunAt = this.calculateNextRun(template.dataValues.schedule);
      }

      await template.update(updateData);

      logger.info(`Executed report template: ${templateId}, execution time: ${executionTime}ms`);

      return {
        templateId,
        reportData,
        executionTime,
        deliveredTo: deliveryResult.deliveredTo,
        status: deliveryResult.errors.length > 0 ? 'partial_success' : 'success',
        ...(deliveryResult.errors.length > 0 && { errors: deliveryResult.errors }),
      };
    } catch (error) {
      logger.error('Error executing report template:', error);
      return {
        templateId,
        reportData: null,
        executionTime: Date.now() - startTime,
        deliveredTo: [],
        status: 'failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Get templates that are due for execution
   */
  static async getDueTemplates(): Promise<ReportTemplate[]> {
    try {
      const now = new Date();

      const templates = await ReportTemplate.findAll({
        where: {
          isActive: true,
          nextRunAt: {
            [Op.lte]: now,
          },
        },
        include: [
          {
            model: require('../db/models').Tenant,
            as: 'tenant',
            attributes: ['id', 'name'],
          },
        ],
      });

      return templates;
    } catch (error) {
      logger.error('Error getting due templates:', error);
      throw new Error('Failed to get due templates');
    }
  }

  /**
   * Execute due templates (for scheduled execution)
   */
  static async executeDueTemplates(): Promise<ReportExecutionResult[]> {
    try {
      const dueTemplates = await this.getDueTemplates();
      const results: ReportExecutionResult[] = [];

      for (const template of dueTemplates) {
        try {
          const result = await this.executeTemplate(template.dataValues.id, template.dataValues.tenantId);
          results.push(result);
        } catch (error) {
          logger.error(`Failed to execute template ${template.dataValues.id}:`, error);
          results.push({
            templateId: template.dataValues.id,
            reportData: null,
            executionTime: 0,
            deliveredTo: [],
            status: 'failed',
            errors: [error instanceof Error ? error.message : 'Unknown error'],
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Error executing due templates:', error);
      throw new Error('Failed to execute due templates');
    }
  }

  /**
   * Calculate next run time based on schedule
   */
  private static calculateNextRun(schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    timezone: string;
  }): Date {
    const now = new Date();
    const timeParts = schedule.time.split(':');
    if (timeParts.length !== 2) {
      throw new Error('Invalid time format. Expected HH:MM');
    }
    const hours = parseInt(timeParts[0]!, 10);
    const minutes = parseInt(timeParts[1]!, 10);

    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    switch (schedule.frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case 'weekly':
        const targetDayOfWeek = schedule.dayOfWeek ?? 1; // Default to Monday
        const currentDayOfWeek = nextRun.getDay();
        let daysToAdd = targetDayOfWeek - currentDayOfWeek;

        if (daysToAdd <= 0) {
          daysToAdd += 7;
        }

        if (daysToAdd === 0 && nextRun <= now) {
          daysToAdd = 7;
        }

        nextRun.setDate(nextRun.getDate() + daysToAdd);
        break;

      case 'monthly':
        const targetDayOfMonth = schedule.dayOfMonth ?? 1;
        nextRun.setDate(targetDayOfMonth);

        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
          nextRun.setDate(targetDayOfMonth);
        }
        break;

      case 'quarterly':
        const currentMonth = nextRun.getMonth();
        const targetQuarterMonth = Math.floor(currentMonth / 3) * 3;
        nextRun.setMonth(targetQuarterMonth, schedule.dayOfMonth ?? 1);

        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 3);
          nextRun.setDate(schedule.dayOfMonth ?? 1);
        }
        break;
    }

    return nextRun;
  }

  /**
   * Deliver report via configured methods
   */
  private static async deliverReport(
    template: ReportTemplate,
    reportData: any
  ): Promise<{ deliveredTo: string[]; errors: string[] }> {
    const deliveredTo: string[] = [];
    const errors: string[] = [];

    try {
      // Email delivery
      if (template.dataValues.delivery.email) {
        try {
          await this.deliverViaEmail(template, reportData);
          deliveredTo.push(...template.dataValues.delivery.email.recipients);
        } catch (error) {
          errors.push(`Email delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Webhook delivery
      if (template.dataValues.delivery.webhook) {
        try {
          await this.deliverViaWebhook(template, reportData);
          deliveredTo.push(template.dataValues.delivery.webhook.url);
        } catch (error) {
          errors.push(`Webhook delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Export delivery (would typically save to storage)
      if (template.dataValues.delivery.export) {
        try {
          await this.deliverViaExport(template, reportData);
          deliveredTo.push(`export:${template.dataValues.delivery.export.filename}`);
        } catch (error) {
          errors.push(`Export delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      errors.push(`General delivery error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { deliveredTo, errors };
  }

  /**
   * Deliver report via email (placeholder - would integrate with email service)
   */
  private static async deliverViaEmail(template: ReportTemplate, reportData: any): Promise<void> {
    // Placeholder for email service integration
    // In a real implementation, this would use a service like SendGrid, SES, etc.
    logger.info(`Email delivery for template ${template.dataValues.id} to ${template.dataValues.delivery.email?.recipients.join(', ')}`);

    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Deliver report via webhook
   */
  private static async deliverViaWebhook(template: ReportTemplate, reportData: any): Promise<void> {
    if (!template.dataValues.delivery.webhook) {
      throw new Error('Webhook configuration missing');
    }

    const { url, headers = {}, method } = template.dataValues.delivery.webhook;

    const payload = {
      templateId: template.dataValues.id,
      templateName: template.dataValues.name,
      reportType: template.dataValues.reportType,
      generatedAt: new Date().toISOString(),
      reportData,
    };

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook delivery failed with status ${response.status}`);
    }

    logger.info(`Webhook delivery successful for template ${template.dataValues.id} to ${url}`);
  }

  /**
   * Deliver report via export (placeholder - would save to storage)
   */
  private static async deliverViaExport(template: ReportTemplate, reportData: any): Promise<void> {
    // Placeholder for export service integration
    // In a real implementation, this would generate and save files
    logger.info(`Export delivery for template ${template.dataValues.id} as ${template.dataValues.delivery.export?.format}`);

    // Simulate file generation
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Validate report template data
   */
  static validateTemplateData(data: ReportTemplateCreationData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!data.reportType) {
      errors.push('Report type is required');
    }

    if (!data.delivery) {
      errors.push('Delivery configuration is required');
    } else {
      const hasDeliveryMethod = data.delivery.email || data.delivery.webhook || data.delivery.export;
      if (!hasDeliveryMethod) {
        errors.push('At least one delivery method (email, webhook, or export) must be configured');
      }

      if (data.delivery.email) {
        if (!data.delivery.email.recipients || data.delivery.email.recipients.length === 0) {
          errors.push('Email recipients are required when using email delivery');
        }
        if (!data.delivery.email.subject) {
          errors.push('Email subject is required when using email delivery');
        }
      }

      if (data.delivery.webhook) {
        if (!data.delivery.webhook.url) {
          errors.push('Webhook URL is required when using webhook delivery');
        }
      }

      if (data.delivery.export) {
        if (!data.delivery.export.filename) {
          errors.push('Export filename is required when using export delivery');
        }
      }
    }

    if (data.schedule) {
      if (!data.schedule.frequency) {
        errors.push('Schedule frequency is required when scheduling is enabled');
      }
      if (!data.schedule.time || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.schedule.time)) {
        errors.push('Schedule time must be in HH:MM format');
      }
      if (!data.schedule.timezone) {
        errors.push('Schedule timezone is required when scheduling is enabled');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default ReportTemplateService;