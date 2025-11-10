"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const models_1 = require("../db/models");
const logger_1 = __importDefault(require("../config/logger"));
class RoleService {
    async getAllRoles(tenantId) {
        try {
            const roles = await models_1.Role.findAll({
                where: {
                    tenantId,
                },
                include: [
                    {
                        model: models_1.Permission,
                        as: 'permissions',
                        where: {
                            tenantId,
                        },
                        required: false,
                        through: {
                            attributes: [],
                        },
                    },
                ],
                order: [['name', 'ASC']],
            });
            return roles.map(role => ({
                id: role.id,
                tenantId: role.tenantId,
                name: role.name,
                description: role.description,
                is_system: role.is_system,
                permissions: role.permissions?.map(permission => ({
                    id: permission.id,
                    name: permission.name,
                    resource: permission.resource,
                    action: permission.action,
                    description: permission.description,
                })) || [],
                created_at: role.created_at,
                updated_at: role.updated_at,
            }));
        }
        catch (error) {
            logger_1.default.error('Error getting all roles:', error);
            throw new Error('Failed to retrieve roles');
        }
    }
    async getRoleById(roleId, tenantId) {
        try {
            const role = await models_1.Role.findOne({
                where: {
                    id: roleId,
                    tenantId,
                },
                include: [
                    {
                        model: models_1.Permission,
                        as: 'permissions',
                        where: {
                            tenantId,
                        },
                        required: false,
                        through: {
                            attributes: [],
                        },
                    },
                ],
            });
            if (!role) {
                return null;
            }
            return {
                id: role.id,
                tenantId: role.tenantId,
                name: role.name,
                description: role.description,
                is_system: role.is_system,
                permissions: role.permissions?.map(permission => ({
                    id: permission.id,
                    name: permission.name,
                    resource: permission.resource,
                    action: permission.action,
                    description: permission.description,
                })) || [],
                created_at: role.created_at,
                updated_at: role.updated_at,
            };
        }
        catch (error) {
            logger_1.default.error('Error getting role by ID:', error);
            throw new Error('Failed to retrieve role');
        }
    }
    async createRole(tenantId, data) {
        try {
            const existingRole = await models_1.Role.findOne({
                where: {
                    tenantId,
                    name: data.name,
                },
            });
            if (existingRole) {
                throw new Error('Role name already exists for this tenant');
            }
            const role = await models_1.Role.create({
                tenantId,
                name: data.name,
                description: data.description || '',
                is_system: false,
            });
            if (data.permissionIds && data.permissionIds.length > 0) {
                const permissions = await models_1.Permission.findAll({
                    where: {
                        id: { [sequelize_1.Op.in]: data.permissionIds },
                        tenantId,
                    },
                });
                if (permissions.length !== data.permissionIds.length) {
                    await role.destroy();
                    throw new Error('One or more permissions not found');
                }
                await role.setPermissions(permissions);
            }
            return await this.getRoleById(role.id, tenantId);
        }
        catch (error) {
            logger_1.default.error('Error creating role:', error);
            throw error;
        }
    }
    async updateRole(roleId, tenantId, data) {
        try {
            const role = await models_1.Role.findOne({
                where: {
                    id: roleId,
                    tenantId,
                },
            });
            if (!role) {
                throw new Error('Role not found');
            }
            if (role.is_system) {
                throw new Error('Cannot update system roles');
            }
            if (data.name && data.name !== role.name) {
                const existingRole = await models_1.Role.findOne({
                    where: {
                        tenantId,
                        name: data.name,
                        id: { [sequelize_1.Op.ne]: roleId },
                    },
                });
                if (existingRole) {
                    throw new Error('Role name already exists for this tenant');
                }
            }
            const updateData = {};
            if (data.name !== undefined)
                updateData.name = data.name;
            if (data.description !== undefined)
                updateData.description = data.description;
            await role.update(updateData);
            if (data.permissionIds !== undefined) {
                if (data.permissionIds.length === 0) {
                    await role.setPermissions([]);
                }
                else {
                    const permissions = await models_1.Permission.findAll({
                        where: {
                            id: { [sequelize_1.Op.in]: data.permissionIds },
                            tenantId,
                        },
                    });
                    if (permissions.length !== data.permissionIds.length) {
                        throw new Error('One or more permissions not found');
                    }
                    await role.setPermissions(permissions);
                }
            }
            return await this.getRoleById(roleId, tenantId);
        }
        catch (error) {
            logger_1.default.error('Error updating role:', error);
            throw error;
        }
    }
    async deleteRole(roleId, tenantId) {
        try {
            const role = await models_1.Role.findOne({
                where: {
                    id: roleId,
                    tenantId,
                },
            });
            if (!role) {
                throw new Error('Role not found');
            }
            if (role.is_system) {
                throw new Error('Cannot delete system roles');
            }
            const userCount = await role.countUsers();
            if (userCount > 0) {
                throw new Error('Cannot delete role that is assigned to users');
            }
            await role.destroy();
        }
        catch (error) {
            logger_1.default.error('Error deleting role:', error);
            throw error;
        }
    }
    async getRoleStats(tenantId) {
        try {
            const totalRoles = await models_1.Role.count({
                where: {
                    tenantId,
                },
            });
            const systemRoles = await models_1.Role.count({
                where: {
                    tenantId,
                    is_system: true,
                },
            });
            return {
                totalRoles,
                systemRoles,
                customRoles: totalRoles - systemRoles,
            };
        }
        catch (error) {
            logger_1.default.error('Error getting role stats:', error);
            throw new Error('Failed to retrieve role statistics');
        }
    }
    async isRoleNameAvailable(tenantId, name, excludeRoleId) {
        try {
            const whereClause = {
                tenantId,
                name,
            };
            if (excludeRoleId) {
                whereClause.id = { [sequelize_1.Op.ne]: excludeRoleId };
            }
            const existingRole = await models_1.Role.findOne({
                where: whereClause,
            });
            return !existingRole;
        }
        catch (error) {
            logger_1.default.error('Error checking role name availability:', error);
            throw new Error('Failed to check role name availability');
        }
    }
}
exports.default = new RoleService();
//# sourceMappingURL=role.service.js.map