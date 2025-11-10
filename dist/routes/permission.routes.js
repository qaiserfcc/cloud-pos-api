"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const permission_controller_1 = require("../controllers/permission.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.use(auth_middleware_1.requireTenantAccess);
router.get('/', (0, auth_middleware_1.requirePermission)('role:read'), permission_controller_1.PermissionController.getAllPermissions);
router.get('/stats', (0, auth_middleware_1.requirePermission)('role:read'), permission_controller_1.PermissionController.getPermissionStats);
router.get('/check-name/:name', permission_controller_1.PermissionController.checkPermissionNameAvailability);
router.get('/check-resource-action/:resource/:action', permission_controller_1.PermissionController.checkResourceActionAvailability);
router.get('/resource/:resource', (0, auth_middleware_1.requirePermission)('role:read'), permission_controller_1.PermissionController.getPermissionsByResource);
router.get('/:id', (0, auth_middleware_1.requirePermission)('role:read'), permission_controller_1.PermissionController.getPermissionById);
router.post('/', (0, auth_middleware_1.requirePermission)('role:create'), permission_controller_1.PermissionController.createPermission);
router.put('/:id', (0, auth_middleware_1.requirePermission)('role:update'), permission_controller_1.PermissionController.updatePermission);
router.delete('/:id', (0, auth_middleware_1.requirePermission)('role:delete'), permission_controller_1.PermissionController.deletePermission);
exports.default = router;
//# sourceMappingURL=permission.routes.js.map