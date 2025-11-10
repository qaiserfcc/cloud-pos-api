"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const jwt_1 = require("../utils/jwt");
const logger_1 = __importDefault(require("../config/logger"));
class AuthController {
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_1.AuthService.authenticateUser(email, password);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Login error:', error);
            if (error.message === 'Invalid credentials' || error.message.includes('locked')) {
                res.status(401).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            next(error);
        }
    }
    static async register(req, res, next) {
        try {
            const { email, password, firstName, lastName, tenantId } = req.body;
            const result = await auth_service_1.AuthService.registerUser(email, password, firstName, lastName, tenantId || req.user?.tenantId);
            res.status(201).json({
                success: true,
                data: result,
                message: 'User registered successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Registration error:', error);
            if (error.message === 'User with this email already exists') {
                res.status(409).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            next(error);
        }
    }
    static async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    error: 'Refresh token is required',
                });
                return;
            }
            const decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
            const userProfile = await auth_service_1.AuthService.getUserProfile(decoded.id);
            const { generateToken, generateRefreshToken } = await Promise.resolve().then(() => __importStar(require('../utils/jwt')));
            const tokenPayload = {
                id: userProfile.id,
                email: userProfile.email,
                tenantId: userProfile.tenant?.id,
                storeId: userProfile.defaultStore?.id,
                roles: userProfile.roles,
                permissions: userProfile.permissions,
            };
            const accessToken = generateToken(tokenPayload);
            const newRefreshToken = generateRefreshToken({ id: userProfile.id });
            logger_1.default.info(`Token refreshed for user: ${userProfile.email}`, {
                userId: userProfile.id,
            });
            res.json({
                success: true,
                data: {
                    tokens: {
                        accessToken,
                        refreshToken: newRefreshToken,
                        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Token refresh error:', error);
            res.status(401).json({
                success: false,
                error: 'Invalid refresh token',
            });
        }
    }
    static async logout(req, res, next) {
        try {
            const userId = req.user?.id;
            if (userId) {
                logger_1.default.info(`User logged out`, { userId });
            }
            res.json({
                success: true,
                message: 'Logged out successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Logout error:', error);
            next(error);
        }
    }
    static async getProfile(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                });
                return;
            }
            const userProfile = await auth_service_1.AuthService.getUserProfile(userId);
            res.json({
                success: true,
                data: {
                    user: userProfile,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Get profile error:', error);
            if (error.message === 'User not found') {
                res.status(404).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            next(error);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map