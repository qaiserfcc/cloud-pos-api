"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.use(auth_middleware_1.requireTenantAccess);
router.get('/', (0, auth_middleware_1.requirePermission)('user:read'), user_controller_1.UserController.getAllUsers);
router.get('/stats', (0, auth_middleware_1.requirePermission)('user:read'), user_controller_1.UserController.getUserStats);
router.get('/check-email/:email', user_controller_1.UserController.checkEmailAvailability);
router.get('/:id', (0, auth_middleware_1.requirePermission)('user:read'), user_controller_1.UserController.getUserById);
router.post('/', (0, auth_middleware_1.requirePermission)('user:create'), user_controller_1.UserController.createUser);
router.put('/:id', (0, auth_middleware_1.requirePermission)('user:update'), user_controller_1.UserController.updateUser);
router.delete('/:id', (0, auth_middleware_1.requirePermission)('user:delete'), user_controller_1.UserController.deleteUser);
router.put('/:id/change-password', user_controller_1.UserController.changePassword);
router.put('/:id/reset-password', (0, auth_middleware_1.requirePermission)('user:update'), user_controller_1.UserController.resetPassword);
exports.default = router;
//# sourceMappingURL=user.routes.js.map