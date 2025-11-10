import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import ReportTemplateService, { ReportTemplateCreationData } from '../services/report-template.service';
import logger from '../config/logger';

export class ReportTemplateController {
  /**
   * Create a new report template
   */
  static async createTemplate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;

      const templateData: ReportTemplateCreationData = {
        ...req.body,
        tenantId,
        createdById: userId,
      };

      // Validate the template data
      const validation = ReportTemplateService.validateTemplateData(templateData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
        });
        return;
      }

      const template = await ReportTemplateService.createTemplate(templateData);

      res.status(201).json({
        success: true,
        message: 'Report template created successfully',
        data: template,
      });
    } catch (error) {
      logger.error('Error creating report template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create report template',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get report templates for the tenant
   */
  static async getTemplates(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { reportType, isActive, createdById } = req.query;

      const filters: any = {};
      if (reportType) filters.reportType = reportType;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (createdById) filters.createdById = createdById;

      const templates = await ReportTemplateService.getTemplates(tenantId, filters);

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      logger.error('Error getting report templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get report templates',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get a specific report template
   */
  static async getTemplate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { templateId } = req.params;

      if (!templateId) {
        res.status(400).json({
          success: false,
          message: 'Template ID is required',
        });
        return;
      }

      const template = await ReportTemplateService.getTemplate(templateId, tenantId);

      if (!template) {
        res.status(404).json({
          success: false,
          message: 'Report template not found',
        });
        return;
      }

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      logger.error('Error getting report template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get report template',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update a report template
   */
  static async updateTemplate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { templateId } = req.params;
      const updates = req.body;

      if (!templateId) {
        res.status(400).json({
          success: false,
          message: 'Template ID is required',
        });
        return;
      }

      // Validate the update data if provided
      if (Object.keys(updates).length > 0) {
        const validation = ReportTemplateService.validateTemplateData({
          ...updates,
          tenantId,
          createdById: req.user!.id,
        } as ReportTemplateCreationData);

        if (!validation.isValid) {
          res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validation.errors,
          });
          return;
        }
      }

      const template = await ReportTemplateService.updateTemplate(templateId, tenantId, updates);

      res.json({
        success: true,
        message: 'Report template updated successfully',
        data: template,
      });
    } catch (error) {
      logger.error('Error updating report template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update report template',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete a report template
   */
  static async deleteTemplate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { templateId } = req.params;

      if (!templateId) {
        res.status(400).json({
          success: false,
          message: 'Template ID is required',
        });
        return;
      }

      await ReportTemplateService.deleteTemplate(templateId, tenantId);

      res.json({
        success: true,
        message: 'Report template deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting report template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete report template',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Execute a report template manually
   */
  static async executeTemplate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { templateId } = req.params;

      if (!templateId) {
        res.status(400).json({
          success: false,
          message: 'Template ID is required',
        });
        return;
      }

      const result = await ReportTemplateService.executeTemplate(templateId, tenantId);

      res.json({
        success: true,
        message: 'Report template executed successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error executing report template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to execute report template',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get templates that are due for execution (admin only)
   */
  static async getDueTemplates(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Check if user has admin privileges (this would be implemented in middleware)
      const templates = await ReportTemplateService.getDueTemplates();

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      logger.error('Error getting due templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get due templates',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Execute all due templates (admin only, for scheduled execution)
   */
  static async executeDueTemplates(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Check if user has admin privileges (this would be implemented in middleware)
      const results = await ReportTemplateService.executeDueTemplates();

      const successCount = results.filter(r => r.status === 'success').length;
      const partialCount = results.filter(r => r.status === 'partial_success').length;
      const failedCount = results.filter(r => r.status === 'failed').length;

      res.json({
        success: true,
        message: `Executed ${results.length} templates: ${successCount} successful, ${partialCount} partial, ${failedCount} failed`,
        data: results,
      });
    } catch (error) {
      logger.error('Error executing due templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to execute due templates',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default ReportTemplateController;