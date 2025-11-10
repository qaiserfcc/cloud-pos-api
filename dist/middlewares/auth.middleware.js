"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireStoreAccess = exports.requireTenantAccess = exports.requireRole = exports.requirePermission = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const role_model_1 = require("../models/role.model");
const permission_model_1 = require("../models/permission.model");
const logger_1 = __importDefault(require("../config/logger"));
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Access token required',
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await user_model_1.User.findByPk(decoded.id, {
            include: [
                {
                    model: role_model_1.Role,
                    as: 'roles',
                    required: false,
                    include: [
                        {
                            model: permission_model_1.Permission,
                            as: 'permissions',
                            required: false,
                            attributes: ['id', 'resource', 'action'],
                        },
                    ],
                },
            ],
        });
        if (!user) {
            res.status(401).json({
                success: false,
                error: 'User not found',
            });
            return;
        }
        if (!user.isActive) {
            res.status(401).json({
                success: false,
                error: 'User account is deactivated',
            });
            return;
        }
        const roles = user.roles?.map((role) => role.name) || [];
        const permissions = user.roles?.flatMap((role) => role.permissions?.map((perm) => `${perm.resource}:${perm.action}`) || []) || [];
        const userContext = {
            id: user.id,
            tenantId: user.tenantId,
            roles: roles,
            permissions: permissions,
        };
        if (user.defaultStoreId) {
            userContext.storeId = user.defaultStoreId;
        }
        req.user = userContext;
        req.tenantId = user.tenantId;
        req.userRoles = roles;
        req.userPermissions = permissions;
        const storeId = req.headers['x-store-id'];
        if (storeId) {
            req.storeId = storeId;
            if (req.user) {
                req.user.storeId = storeId;
            }
        }
        else if (user.defaultStoreId) {
            req.storeId = user.defaultStoreId;
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Authentication error:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid token',
        });
    }
};
exports.authenticateToken = authenticateToken;
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (req.userRoles?.includes('Super Admin')) {
            return next();
        }
        if (!req.userPermissions?.includes(permission)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
            });
            return;
        }
        next();
    };
};
exports.requirePermission = requirePermission;
const requireRole = (role) => {
    return (req, res, next) => {
        if (req.userRoles?.includes('Super Admin')) {
            return next();
        }
        if (!req.userRoles?.includes(role)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient role permissions',
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
const requireTenantAccess = (req, res, next) => {
    if (req.userRoles?.includes('Super Admin')) {
        return next();
    }
    if (!req.tenantId) {
        res.status(400).json({
            success: false,
            error: 'Tenant context required',
        });
        return;
    }
    next();
};
exports.requireTenantAccess = requireTenantAccess;
const requireStoreAccess = (req, res, next) => {
    if (req.userRoles?.includes('Super Admin')) {
        return next();
    }
    if (!req.storeId) {
        res.status(400).json({
            success: false,
            error: 'Store context required',
        });
        return;
    }
    next();
};
exports.requireStoreAccess = requireStoreAccess;
//# sourceMappingURL=auth.middleware.js.map