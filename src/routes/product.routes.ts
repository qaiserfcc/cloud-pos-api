import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticateToken, requireTenantAccess, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// All product routes require authentication and tenant access
router.use(authenticateToken);
router.use(requireTenantAccess);

// GET /api/v1/products - Get all products for tenant
router.get('/', requirePermission('product:read'), ProductController.getAllProducts);

// GET /api/v1/products/stats - Get product statistics
router.get('/stats', requirePermission('product:read'), ProductController.getProductStats);

// GET /api/v1/products/search - Search products
router.get('/search', requirePermission('product:read'), ProductController.searchProducts);

// GET /api/v1/products/:id - Get product by ID
router.get('/:id', requirePermission('product:read'), ProductController.getProductById);

// POST /api/v1/products - Create new product
router.post('/', requirePermission('product:create'), ProductController.createProduct);

// PUT /api/v1/products/:id - Update product
router.put('/:id', requirePermission('product:update'), ProductController.updateProduct);

// DELETE /api/v1/products/:id - Delete product
router.delete('/:id', requirePermission('product:delete'), ProductController.deleteProduct);

export default router;