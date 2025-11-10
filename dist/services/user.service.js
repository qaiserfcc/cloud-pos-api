"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const models_1 = require("../db/models");
const tenant_model_1 = require("../models/tenant.model");
const store_model_1 = require("../models/store.model");
const models_2 = require("../db/models");
const jwt_1 = require("../utils/jwt");
const sequelize_1 = require("sequelize");
const logger_1 = __importDefault(require("../config/logger"));
class UserService {
    static async getAllUsers(tenantId) {
        const users = await models_1.User.findAll({
            where: { tenantId },
            include: [
                {
                    model: tenant_model_1.Tenant,
                    as: 'tenant',
                    attributes: ['name'],
                },
                {
                    model: store_model_1.Store,
                    as: 'defaultStore',
                    attributes: ['name'],
                    required: false,
                },
                {
                    model: models_2.Role,
                    as: 'roles',
                    required: false,
                    attributes: ['id', 'name'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });
        return users.map(user => ({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            avatar: user.avatar,
            defaultStoreId: user.defaultStoreId,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt,
            tenantId: user.tenantId,
            tenantName: user.tenant?.name || '',
            defaultStoreName: user.defaultStore?.name,
            roles: user.roles?.map((role) => role.name) || [],
            roleCount: user.roles?.length || 0,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));
    }
    static async getUserById(userId, tenantId) {
        const user = await models_1.User.findOne({
            where: { id: userId, tenantId },
            include: [
                {
                    model: tenant_model_1.Tenant,
                    as: 'tenant',
                    attributes: ['name'],
                },
                {
                    model: store_model_1.Store,
                    as: 'defaultStore',
                    attributes: ['name'],
                    required: false,
                },
                {
                    model: models_2.Role,
                    as: 'roles',
                    required: false,
                    attributes: ['id', 'name'],
                },
            ],
        });
        if (!user) {
            throw new Error('User not found');
        }
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            avatar: user.avatar,
            defaultStoreId: user.defaultStoreId,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt,
            tenantId: user.tenantId,
            tenantName: user.tenant?.name || '',
            defaultStoreName: user.defaultStore?.name,
            roles: user.roles?.map((role) => role.name) || [],
            roleCount: user.roles?.length || 0,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    static async createUser(tenantId, userData) {
        const existingUser = await models_1.User.findOne({ where: { email: userData.email } });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        if (userData.defaultStoreId) {
            const store = await store_model_1.Store.findOne({
                where: { id: userData.defaultStoreId, tenantId }
            });
            if (!store) {
                throw new Error('Default store not found or does not belong to this tenant');
            }
        }
        if (userData.roleIds && userData.roleIds.length > 0) {
            const roles = await models_2.Role.findAll({
                where: {
                    id: { [sequelize_1.Op.in]: userData.roleIds },
                    tenantId
                }
            });
            if (roles.length !== userData.roleIds.length) {
                throw new Error('One or more roles not found or do not belong to this tenant');
            }
        }
        const hashedPassword = await (0, jwt_1.hashPassword)(userData.password);
        const userDataToCreate = {
            tenantId,
            email: userData.email,
            password: hashedPassword,
            firstName: userData.firstName,
            lastName: userData.lastName,
            isActive: true,
            loginAttempts: 0,
        };
        if (userData.phone !== undefined)
            userDataToCreate.phone = userData.phone;
        if (userData.avatar !== undefined)
            userDataToCreate.avatar = userData.avatar;
        if (userData.defaultStoreId !== undefined)
            userDataToCreate.defaultStoreId = userData.defaultStoreId;
        const user = await models_1.User.create(userDataToCreate);
        if (userData.roleIds && userData.roleIds.length > 0) {
            const roles = await models_2.Role.findAll({
                where: {
                    id: { [sequelize_1.Op.in]: userData.roleIds },
                    tenantId
                }
            });
            await user.setRoles(roles);
        }
        logger_1.default.info(`User created: ${userData.email}`, {
            userId: user.id,
            tenantId,
        });
        return this.getUserById(user.id, tenantId);
    }
    static async updateUser(userId, tenantId, updateData) {
        const user = await models_1.User.findOne({
            where: { id: userId, tenantId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        if (updateData.defaultStoreId) {
            const store = await store_model_1.Store.findOne({
                where: { id: updateData.defaultStoreId, tenantId }
            });
            if (!store) {
                throw new Error('Default store not found or does not belong to this tenant');
            }
        }
        if (updateData.roleIds && updateData.roleIds.length > 0) {
            const roles = await models_2.Role.findAll({
                where: {
                    id: { [sequelize_1.Op.in]: updateData.roleIds },
                    tenantId
                }
            });
            if (roles.length !== updateData.roleIds.length) {
                throw new Error('One or more roles not found or do not belong to this tenant');
            }
        }
        const updateFields = {};
        if (updateData.firstName !== undefined)
            updateFields.firstName = updateData.firstName;
        if (updateData.lastName !== undefined)
            updateFields.lastName = updateData.lastName;
        if (updateData.phone !== undefined)
            updateFields.phone = updateData.phone;
        if (updateData.avatar !== undefined)
            updateFields.avatar = updateData.avatar;
        if (updateData.defaultStoreId !== undefined)
            updateFields.defaultStoreId = updateData.defaultStoreId;
        if (updateData.isActive !== undefined)
            updateFields.isActive = updateData.isActive;
        await user.update(updateFields);
        if (updateData.roleIds !== undefined) {
            if (updateData.roleIds.length > 0) {
                const roles = await models_2.Role.findAll({
                    where: {
                        id: { [sequelize_1.Op.in]: updateData.roleIds },
                        tenantId
                    }
                });
                await user.setRoles(roles);
            }
            else {
                await user.setRoles([]);
            }
        }
        logger_1.default.info(`User updated: ${user.email}`, {
            userId,
            tenantId,
        });
        return this.getUserById(userId, tenantId);
    }
    static async deleteUser(userId, tenantId) {
        const user = await models_1.User.findOne({
            where: { id: userId, tenantId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        await user.update({ isActive: false });
        await user.setRoles([]);
        logger_1.default.info(`User deleted: ${user.email}`, {
            userId,
            tenantId,
        });
    }
    static async changePassword(userId, tenantId, currentPassword, newPassword) {
        const user = await models_1.User.findOne({
            where: { id: userId, tenantId, isActive: true }
        });
        if (!user) {
            throw new Error('User not found');
        }
        const isCurrentPasswordValid = await (0, jwt_1.comparePassword)(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new Error('Current password is incorrect');
        }
        const hashedNewPassword = await (0, jwt_1.hashPassword)(newPassword);
        await user.update({
            password: hashedNewPassword,
            passwordChangedAt: new Date(),
        });
        logger_1.default.info(`Password changed for user: ${user.email}`, {
            userId,
            tenantId,
        });
    }
    static async resetPassword(userId, tenantId, newPassword) {
        const user = await models_1.User.findOne({
            where: { id: userId, tenantId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        const hashedNewPassword = await (0, jwt_1.hashPassword)(newPassword);
        await user.update({
            password: hashedNewPassword,
            passwordChangedAt: new Date(),
            loginAttempts: 0,
        });
        if (user.lockoutUntil) {
            await user.update({ lockoutUntil: (0, sequelize_1.literal)('NULL') });
        }
        logger_1.default.info(`Password reset for user: ${user.email}`, {
            userId,
            tenantId,
        });
    }
    static async getUserStats(tenantId) {
        const [totalResult, activeResult] = await Promise.all([
            models_1.User.count({ where: { tenantId } }),
            models_1.User.count({ where: { tenantId, isActive: true } }),
        ]);
        return {
            totalUsers: totalResult,
            activeUsers: activeResult,
            inactiveUsers: totalResult - activeResult,
        };
    }
    static async isEmailAvailable(email, excludeUserId) {
        const whereClause = { email };
        if (excludeUserId) {
            whereClause.id = { [require('sequelize').Op.ne]: excludeUserId };
        }
        const existingUser = await models_1.User.findOne({ where: whereClause });
        return !existingUser;
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map