import { Router } from 'express';
import ReportTemplateController from '../controllers/report-template.controller';
import { authenticateToken, requireTenantAccess, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(requireTenantAccess);

// Create a new report template
router.post(
  '/',
  requirePermission('report_template:create'),
  ReportTemplateController.createTemplate
);

// Get all report templates for the tenant
router.get(
  '/',
  requirePermission('report_template:read'),
  ReportTemplateController.getTemplates
);

// Get a specific report template
router.get(
  '/:templateId',
  requirePermission('report_template:read'),
  ReportTemplateController.getTemplate
);

// Update a report template
router.put(
  '/:templateId',
  requirePermission('report_template:update'),
  ReportTemplateController.updateTemplate
);

// Delete a report template
router.delete(
  '/:templateId',
  requirePermission('report_template:delete'),
  ReportTemplateController.deleteTemplate
);

// Execute a report template manually
router.post(
  '/:templateId/execute',
  requirePermission('report_template:execute'),
  ReportTemplateController.executeTemplate
);

// Admin routes for scheduled execution (would require admin middleware)
router.get(
  '/admin/due',
  requirePermission('report_template:admin'),
  ReportTemplateController.getDueTemplates
);

router.post(
  '/admin/execute-due',
  requirePermission('report_template:admin'),
  ReportTemplateController.executeDueTemplates
);

export default router;