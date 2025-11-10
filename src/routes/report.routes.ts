import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateToken, requireTenantAccess, requireStoreAccess, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// All report routes require authentication and tenant access
router.use(authenticateToken);
router.use(requireTenantAccess);

// Store-specific routes (require store access)
const storeRouter = Router();
storeRouter.use(requireStoreAccess);

// GET /api/v1/reports/sales - Generate sales report
storeRouter.get('/sales', requirePermission('reports:read'), ReportController.generateSalesReport);

// GET /api/v1/reports/inventory - Generate inventory report
storeRouter.get('/inventory', requirePermission('reports:read'), ReportController.generateInventoryReport);

// GET /api/v1/reports/customers - Generate customer report
storeRouter.get('/customers', requirePermission('reports:read'), ReportController.generateCustomerReport);

// GET /api/v1/reports/products - Generate product report
storeRouter.get('/products', requirePermission('reports:read'), ReportController.generateProductReport);

// GET /api/v1/reports/business - Generate business intelligence report
storeRouter.get('/business', requirePermission('reports:read'), ReportController.generateBusinessReport);

// Mount store routes
router.use('/', storeRouter);

// Regional dashboard routes (tenant-wide operations - no store access required)
router.use(requirePermission('analytics:tenant_wide'));

// GET /api/v1/reports/regional/sales - Generate regional sales dashboard
router.get('/regional/sales', ReportController.generateRegionalSalesDashboard);

// GET /api/v1/reports/regional/inventory - Generate regional inventory dashboard
router.get('/regional/inventory', ReportController.generateRegionalInventoryDashboard);

// GET /api/v1/reports/regional/performance - Generate regional performance dashboard
router.get('/regional/performance', ReportController.generateRegionalPerformanceDashboard);

export default router;