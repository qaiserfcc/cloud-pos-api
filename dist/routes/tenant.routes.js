"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tenant_controller_1 = require("../controllers/tenant.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requirePermission)('tenant:read'), tenant_controller_1.TenantController.getAllTenants);
router.get('/:id', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requirePermission)('tenant:read'), tenant_controller_1.TenantController.getTenantById);
router.post('/', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requirePermission)('tenant:create'), tenant_controller_1.TenantController.createTenant);
router.put('/:id', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requirePermission)('tenant:update'), tenant_controller_1.TenantController.updateTenant);
router.delete('/:id', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requirePermission)('tenant:delete'), tenant_controller_1.TenantController.deleteTenant);
router.get('/:id/stats', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requirePermission)('tenant:read'), tenant_controller_1.TenantController.getTenantStats);
router.get('/check-domain/:domain', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requirePermission)('tenant:read'), tenant_controller_1.TenantController.checkDomainAvailability);
exports.default = router;
//# sourceMappingURL=tenant.routes.js.map