"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_1 = require("../utils/validation");
const router = (0, express_1.Router)();
router.post('/login', validation_1.validateLogin, validation_1.handleValidationErrors, auth_controller_1.AuthController.login);
router.post('/register', validation_1.validateRegister, validation_1.handleValidationErrors, auth_controller_1.AuthController.register);
router.post('/refresh', validation_1.validateRefreshToken, validation_1.handleValidationErrors, auth_controller_1.AuthController.refreshToken);
router.post('/logout', auth_middleware_1.authenticateToken, auth_controller_1.AuthController.logout);
router.get('/profile', auth_middleware_1.authenticateToken, auth_controller_1.AuthController.getProfile);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map