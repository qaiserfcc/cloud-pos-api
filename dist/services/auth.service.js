"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const user_model_1 = require("../models/user.model");
const tenant_model_1 = require("../models/tenant.model");
const store_model_1 = require("../models/store.model");
const role_model_1 = require("../models/role.model");
const permission_model_1 = require("../models/permission.model");
const jwt_1 = require("../utils/jwt");
const logger_1 = __importDefault(require("../config/logger"));
class AuthService {
    static async authenticateUser(email, password) {
        const user = await user_model_1.User.findOne({
            where: { email, isActive: true },
            include: [
                {
                    model: tenant_model_1.Tenant,
                    as: 'tenant',
                    attributes: ['id', 'name', 'isActive'],
                },
                {
                    model: store_model_1.Store,
                    as: 'defaultStore',
                    attributes: ['id', 'name', 'is_active'],
                    required: false,
                },
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
            throw new Error('Invalid credentials');
        }
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            throw new Error('Account is temporarily locked due to too many failed login attempts');
        }
        const isPasswordValid = await (0, jwt_1.comparePassword)(password, user.password);
        if (!isPasswordValid) {
            user.loginAttempts += 1;
            if (user.loginAttempts >= 5) {
                user.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000);
            }
            await user.save();
            throw new Error('Invalid credentials');
        }
        user.loginAttempts = 0;
        user.lastLoginAt = new Date();
        await user.save();
        const roles = user.roles?.map((role) => role.name) || [];
        const permissions = user.roles?.flatMap((role) => role.permissions?.map((perm) => `${perm.resource}:${perm.action}`) || []) || [];
        const tokenPayload = {
            id: user.id,
            email: user.email,
            tenantId: user.tenantId,
            storeId: user.defaultStoreId,
            roles,
            permissions,
        };
        const accessToken = (0, jwt_1.generateToken)(tokenPayload);
        const refreshToken = (0, jwt_1.generateRefreshToken)({ id: user.id });
        logger_1.default.info(`User ${user.email} logged in successfully`, {
            userId: user.id,
            tenantId: user.tenantId,
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                tenant: user.tenant,
                defaultStore: user.defaultStore,
                roles,
                permissions,
            },
            tokens: {
                accessToken,
                refreshToken,
                expiresIn: process.env.JWT_EXPIRES_IN || '24h',
            },
        };
    }
    static async registerUser(email, password, firstName, lastName, tenantId) {
        const existingUser = await user_model_1.User.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        const hashedPassword = await (0, jwt_1.hashPassword)(password);
        const user = await user_model_1.User.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            tenantId: tenantId,
            isActive: true,
            loginAttempts: 0,
        });
        const userWithAssociations = await user_model_1.User.findByPk(user.id, {
            include: [
                {
                    model: tenant_model_1.Tenant,
                    as: 'tenant',
                    attributes: ['id', 'name'],
                },
            ],
        });
        logger_1.default.info(`New user registered: ${email}`, {
            userId: user.id,
            tenantId: user.tenantId,
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                tenant: userWithAssociations?.tenant,
            },
        };
    }
    static async refreshUserToken(refreshToken) {
        throw new Error('Refresh token functionality not yet implemented');
    }
    static async getUserProfile(userId) {
        const user = await user_model_1.User.findOne({
            where: { id: userId, isActive: true },
            include: [
                {
                    model: tenant_model_1.Tenant,
                    as: 'tenant',
                    attributes: ['id', 'name', 'is_active'],
                },
                {
                    model: store_model_1.Store,
                    as: 'defaultStore',
                    attributes: ['id', 'name', 'is_active'],
                    required: false,
                },
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
            throw new Error('User not found');
        }
        const roles = user.roles?.map((role) => role.name) || [];
        const permissions = user.roles?.flatMap((role) => role.permissions?.map((perm) => `${perm.resource}:${perm.action}`) || []) || [];
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            avatar: user.avatar,
            tenant: user.tenant,
            defaultStore: user.defaultStore,
            roles,
            permissions,
            lastLoginAt: user.lastLoginAt,
            isActive: user.isActive,
        };
    }
    static async findUserByRefreshToken(refreshToken) {
        return null;
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map