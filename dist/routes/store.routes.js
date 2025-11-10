"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const store_controller_1 = require("../controllers/store.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const storeController = new store_controller_1.StoreController();
router.use(auth_middleware_1.authenticateToken);
router.get('/', (0, auth_middleware_1.requirePermission)('store:read'), storeController.getAllStores.bind(storeController));
router.get('/:id', (0, auth_middleware_1.requirePermission)('store:read'), storeController.getStoreById.bind(storeController));
router.post('/', (0, auth_middleware_1.requirePermission)('store:create'), storeController.createStore.bind(storeController));
router.put('/:id', (0, auth_middleware_1.requirePermission)('store:update'), storeController.updateStore.bind(storeController));
router.delete('/:id', (0, auth_middleware_1.requirePermission)('store:delete'), storeController.deleteStore.bind(storeController));
router.get('/:id/stats', (0, auth_middleware_1.requirePermission)('store:read'), storeController.getStoreStats.bind(storeController));
router.get('/check-code/:code', (0, auth_middleware_1.requirePermission)('store:create'), storeController.checkStoreCode.bind(storeController));
exports.default = router;
//# sourceMappingURL=store.routes.js.map