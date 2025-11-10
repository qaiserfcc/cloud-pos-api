import { Router } from 'express';
import { StoreController } from '../controllers/store.controller';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();
const storeController = new StoreController();

// All store routes require authentication
router.use(authenticateToken);

// GET /api/stores - Get all stores for tenant
router.get('/', requirePermission('store:read'), storeController.getAllStores.bind(storeController));

// GET /api/stores/:id - Get store by ID
router.get('/:id', requirePermission('store:read'), storeController.getStoreById.bind(storeController));

// POST /api/stores - Create new store
router.post('/', requirePermission('store:create'), storeController.createStore.bind(storeController));

// PUT /api/stores/:id - Update store
router.put('/:id', requirePermission('store:update'), storeController.updateStore.bind(storeController));

// DELETE /api/stores/:id - Delete store
router.delete('/:id', requirePermission('store:delete'), storeController.deleteStore.bind(storeController));

// GET /api/stores/:id/stats - Get store statistics
router.get('/:id/stats', requirePermission('store:read'), storeController.getStoreStats.bind(storeController));

// GET /api/stores/check-code/:code - Check store code availability
router.get('/check-code/:code', requirePermission('store:create'), storeController.checkStoreCode.bind(storeController));

export default router;