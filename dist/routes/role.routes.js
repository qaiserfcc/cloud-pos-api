"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_controller_1 = require("../controllers/role.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.use(auth_middleware_1.requireTenantAccess);
router.get('/', (0, auth_middleware_1.requirePermission)('role:read'), role_controller_1.RoleController.getAllRoles);
router.get('/stats', (0, auth_middleware_1.requirePermission)('role:read'), role_controller_1.RoleController.getRoleStats);
router.get('/check-name/:name', role_controller_1.RoleController.checkRoleNameAvailability);
router.get('/:id', (0, auth_middleware_1.requirePermission)('role:read'), role_controller_1.RoleController.getRoleById);
router.post('/', (0, auth_middleware_1.requirePermission)('role:create'), role_controller_1.RoleController.createRole);
router.put('/:id', (0, auth_middleware_1.requirePermission)('role:update'), role_controller_1.RoleController.updateRole);
router.delete('/:id', (0, auth_middleware_1.requirePermission)('role:delete'), role_controller_1.RoleController.deleteRole);
exports.default = router;
//# sourceMappingURL=role.routes.js.map