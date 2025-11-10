import { Router } from 'express';
import AuditController from '../controllers/audit.controller';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// All audit routes require authentication
router.use(authenticateToken);

// Query audit logs with filtering and pagination
// Requires 'audit.view' permission
router.get('/logs',
  requirePermission('audit.view'),
  AuditController.queryAuditLogs
);

// Get audit trail for a specific object
// Requires 'audit.view' permission
router.get('/objects/:tenantId/:objectTable/:objectId',
  requirePermission('audit.view'),
  AuditController.getObjectAuditTrail
);

// Get inter-store transaction audit trail
// Requires 'audit.view' permission
router.get('/inter-store/:tenantId',
  requirePermission('audit.view'),
  AuditController.getInterStoreTransactionAudit
);

// Generate compliance report
// Requires 'audit.compliance' permission
router.post('/reports/compliance/:tenantId',
  requirePermission('audit.compliance'),
  AuditController.generateComplianceReport
);

// Get audit statistics for dashboard
// Requires 'audit.view' permission
router.get('/statistics/:tenantId',
  requirePermission('audit.view'),
  AuditController.getAuditStatistics
);

// Get specific audit log by ID
// Requires 'audit.view' permission
router.get('/logs/:id',
  requirePermission('audit.view'),
  AuditController.getAuditLogById
);

// Create manual audit log entry (admin/testing)
// Requires 'audit.manage' permission
router.post('/logs',
  requirePermission('audit.manage'),
  AuditController.createAuditLog
);

// Clean up old audit logs (admin only)
// Requires 'audit.manage' permission
router.post('/cleanup',
  requirePermission('audit.manage'),
  AuditController.cleanupOldAuditLogs
);

export default router;