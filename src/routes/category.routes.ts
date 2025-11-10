import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticateToken, requireTenantAccess, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// All category routes require authentication and tenant access
router.use(authenticateToken);
router.use(requireTenantAccess);

// GET /api/v1/categories - Get all categories for tenant (hierarchical)
router.get('/', requirePermission('category:read'), CategoryController.getAllCategories);

// GET /api/v1/categories/stats - Get category statistics
router.get('/stats', requirePermission('category:read'), CategoryController.getCategoryStats);

// GET /api/v1/categories/search - Search categories
router.get('/search', requirePermission('category:read'), CategoryController.searchCategories);

// GET /api/v1/categories/:id - Get category by ID
router.get('/:id', requirePermission('category:read'), CategoryController.getCategoryById);

// POST /api/v1/categories - Create new category
router.post('/', requirePermission('category:create'), CategoryController.createCategory);

// PUT /api/v1/categories/:id - Update category
router.put('/:id', requirePermission('category:update'), CategoryController.updateCategory);

// PUT /api/v1/categories/sort-orders - Update category sort orders
router.put('/sort-orders', requirePermission('category:update'), CategoryController.updateCategorySortOrders);

// DELETE /api/v1/categories/:id - Delete category
router.delete('/:id', requirePermission('category:delete'), CategoryController.deleteCategory);

export default router;