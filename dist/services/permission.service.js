"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const models_1 = require("../db/models");
const logger_1 = __importDefault(require("../config/logger"));
class PermissionService {
    async getAllPermissions(tenantId) {
        try {
            const permissions = await models_1.Permission.findAll({
                where: {
                    tenantId,
                },
                include: [
                    {
                        model: models_1.Role,
                        as: 'roles',
                        where: {
                            tenantId,
                        },
                        required: false,
                        through: {
                            attributes: [],
                        },
                    },
                ],
                order: [['resource', 'ASC'], ['action', 'ASC']],
            });
            return permissions.map(permission => ({
                id: permission.id,
                tenantId: permission.tenantId,
                name: permission.name,
                resource: permission.resource,
                action: permission.action,
                description: permission.description,
                is_system: permission.is_system,
                roles: permission.roles?.map(role => ({
                    id: role.id,
                    name: role.name,
                    description: role.description,
                })) || [],
                created_at: permission.created_at,
                updated_at: permission.updated_at,
            }));
        }
        catch (error) {
            logger_1.default.error('Error getting all permissions:', error);
            throw new Error('Failed to retrieve permissions');
        }
    }
    async getPermissionById(permissionId, tenantId) {
        try {
            const permission = await models_1.Permission.findOne({
                where: {
                    id: permissionId,
                    tenantId,
                },
                include: [
                    {
                        model: models_1.Role,
                        as: 'roles',
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
            if (!permission) {
                return null;
            }
            return {
                id: permission.id,
                tenantId: permission.tenantId,
                name: permission.name,
                resource: permission.resource,
                action: permission.action,
                description: permission.description,
                is_system: permission.is_system,
                roles: permission.roles?.map(role => ({
                    id: role.id,
                    name: role.name,
                    description: role.description,
                })) || [],
                created_at: permission.created_at,
                updated_at: permission.updated_at,
            };
        }
        catch (error) {
            logger_1.default.error('Error getting permission by ID:', error);
            throw new Error('Failed to retrieve permission');
        }
    }
    async createPermission(tenantId, data) {
        try {
            const existingPermission = await models_1.Permission.findOne({
                where: {
                    tenantId,
                    name: data.name,
                },
            });
            if (existingPermission) {
                throw new Error('Permission name already exists for this tenant');
            }
            const existingResourceAction = await models_1.Permission.findOne({
                where: {
                    tenantId,
                    resource: data.resource,
                    action: data.action,
                },
            });
            if (existingResourceAction) {
                throw new Error('Permission with this resource and action already exists for this tenant');
            }
            const permission = await models_1.Permission.create({
                tenantId,
                name: data.name,
                resource: data.resource,
                action: data.action,
                description: data.description || '',
                is_system: false,
            });
            return await this.getPermissionById(permission.id, tenantId);
        }
        catch (error) {
            logger_1.default.error('Error creating permission:', error);
            throw error;
        }
    }
    async updatePermission(permissionId, tenantId, data) {
        try {
            const permission = await models_1.Permission.findOne({
                where: {
                    id: permissionId,
                    tenantId,
                },
            });
            if (!permission) {
                throw new Error('Permission not found');
            }
            if (permission.is_system) {
                throw new Error('Cannot update system permissions');
            }
            if (data.name && data.name !== permission.name) {
                const existingPermission = await models_1.Permission.findOne({
                    where: {
                        tenantId,
                        name: data.name,
                        id: { [sequelize_1.Op.ne]: permissionId },
                    },
                });
                if (existingPermission) {
                    throw new Error('Permission name already exists for this tenant');
                }
            }
            if ((data.resource || data.action) &&
                (data.resource !== permission.resource || data.action !== permission.action)) {
                const resource = data.resource || permission.resource;
                const action = data.action || permission.action;
                const existingResourceAction = await models_1.Permission.findOne({
                    where: {
                        tenantId,
                        resource,
                        action,
                        id: { [sequelize_1.Op.ne]: permissionId },
                    },
                });
                if (existingResourceAction) {
                    throw new Error('Permission with this resource and action already exists for this tenant');
                }
            }
            const updateData = {};
            if (data.name !== undefined)
                updateData.name = data.name;
            if (data.resource !== undefined)
                updateData.resource = data.resource;
            if (data.action !== undefined)
                updateData.action = data.action;
            if (data.description !== undefined)
                updateData.description = data.description;
            await permission.update(updateData);
            return await this.getPermissionById(permissionId, tenantId);
        }
        catch (error) {
            logger_1.default.error('Error updating permission:', error);
            throw error;
        }
    }
    async deletePermission(permissionId, tenantId) {
        try {
            const permission = await models_1.Permission.findOne({
                where: {
                    id: permissionId,
                    tenantId,
                },
            });
            if (!permission) {
                throw new Error('Permission not found');
            }
            if (permission.is_system) {
                throw new Error('Cannot delete system permissions');
            }
            const roleCount = await permission.countRoles();
            if (roleCount > 0) {
                throw new Error('Cannot delete permission that is assigned to roles');
            }
            await permission.destroy();
        }
        catch (error) {
            logger_1.default.error('Error deleting permission:', error);
            throw error;
        }
    }
    async getPermissionsByResource(tenantId, resource) {
        try {
            const permissions = await models_1.Permission.findAll({
                where: {
                    tenantId,
                    resource,
                },
                include: [
                    {
                        model: models_1.Role,
                        as: 'roles',
                        where: {
                            tenantId,
                        },
                        required: false,
                        through: {
                            attributes: [],
                        },
                    },
                ],
                order: [['action', 'ASC']],
            });
            return permissions.map(permission => ({
                id: permission.id,
                tenantId: permission.tenantId,
                name: permission.name,
                resource: permission.resource,
                action: permission.action,
                description: permission.description,
                is_system: permission.is_system,
                roles: permission.roles?.map(role => ({
                    id: role.id,
                    name: role.name,
                    description: role.description,
                })) || [],
                created_at: permission.created_at,
                updated_at: permission.updated_at,
            }));
        }
        catch (error) {
            logger_1.default.error('Error getting permissions by resource:', error);
            throw new Error('Failed to retrieve permissions by resource');
        }
    }
    async getPermissionStats(tenantId) {
        try {
            const totalPermissions = await models_1.Permission.count({
                where: {
                    tenantId,
                },
            });
            const systemPermissions = await models_1.Permission.count({
                where: {
                    tenantId,
                    is_system: true,
                },
            });
            const permissions = await models_1.Permission.findAll({
                where: {
                    tenantId,
                },
                attributes: ['resource'],
                group: ['resource'],
                raw: true,
            });
            const resources = permissions.map(p => p.resource);
            return {
                totalPermissions,
                systemPermissions,
                customPermissions: totalPermissions - systemPermissions,
                resources,
            };
        }
        catch (error) {
            logger_1.default.error('Error getting permission stats:', error);
            throw new Error('Failed to retrieve permission statistics');
        }
    }
    async isPermissionNameAvailable(tenantId, name, excludePermissionId) {
        try {
            const whereClause = {
                tenantId,
                name,
            };
            if (excludePermissionId) {
                whereClause.id = { [sequelize_1.Op.ne]: excludePermissionId };
            }
            const existingPermission = await models_1.Permission.findOne({
                where: whereClause,
            });
            return !existingPermission;
        }
        catch (error) {
            logger_1.default.error('Error checking permission name availability:', error);
            throw new Error('Failed to check permission name availability');
        }
    }
    async isResourceActionAvailable(tenantId, resource, action, excludePermissionId) {
        try {
            const whereClause = {
                tenantId,
                resource,
                action,
            };
            if (excludePermissionId) {
                whereClause.id = { [sequelize_1.Op.ne]: excludePermissionId };
            }
            const existingPermission = await models_1.Permission.findOne({
                where: whereClause,
            });
            return !existingPermission;
        }
        catch (error) {
            logger_1.default.error('Error checking resource:action availability:', error);
            throw new Error('Failed to check resource:action availability');
        }
    }
}
exports.default = new PermissionService();
//# sourceMappingURL=permission.service.js.map