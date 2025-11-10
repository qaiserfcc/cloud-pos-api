import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateToken, requireTenantAccess, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// All report routes require authentication and tenant access
router.use(authenticateToken);
router.use(requireTenantAccess);

// GET /api/v1/reports/sales - Generate sales report
router.get('/sales', requirePermission('reports:read'), ReportController.generateSalesReport);

// GET /api/v1/reports/inventory - Generate inventory report
router.get('/inventory', requirePermission('reports:read'), ReportController.generateInventoryReport);

// GET /api/v1/reports/customers - Generate customer report
router.get('/customers', requirePermission('reports:read'), ReportController.generateCustomerReport);

// GET /api/v1/reports/products - Generate product report
router.get('/products', requirePermission('reports:read'), ReportController.generateProductReport);

// GET /api/v1/reports/business - Generate business intelligence report
router.get('/business', requirePermission('reports:read'), ReportController.generateBusinessReport);

export default router;