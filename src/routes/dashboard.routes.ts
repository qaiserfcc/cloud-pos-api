import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateToken, requireTenantAccess, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// All dashboard routes require authentication and tenant access
router.use(authenticateToken);
router.use(requireTenantAccess);

// GET /api/v1/dashboard/available-widgets - Get available widgets for user
router.get('/available-widgets', requirePermission('dashboard:read'), DashboardController.getAvailableWidgets);

// GET /api/v1/dashboard - Get user's dashboard with all widget data
router.get('/', requirePermission('dashboard:read'), DashboardController.getUserDashboard);

// POST /api/v1/dashboard/widgets - Configure a widget
router.post('/widgets', requirePermission('dashboard:update'), DashboardController.configureWidget);

// GET /api/v1/dashboard/widgets - Get all widget configurations
router.get('/widgets', requirePermission('dashboard:read'), DashboardController.getWidgetConfigs);

// PUT /api/v1/dashboard/widgets/:widgetId - Update widget configuration
router.put('/widgets/:widgetId', requirePermission('dashboard:update'), DashboardController.updateWidgetConfig);

// DELETE /api/v1/dashboard/widgets/:widgetId - Remove widget configuration
router.delete('/widgets/:widgetId', requirePermission('dashboard:update'), DashboardController.removeWidget);

export default router;