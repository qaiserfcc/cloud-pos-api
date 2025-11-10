"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionController = void 0;
const permission_service_1 = __importDefault(require("../services/permission.service"));
const logger_1 = __importDefault(require("../config/logger"));
class PermissionController {
    static async getAllPermissions(req, res, next) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                res.status(400).json({
                    success: false,
                    error: 'Tenant ID is required',
                });
                return;
            }
            const permissions = await permission_service_1.default.getAllPermissions(tenantId);
            res.json({
                success: true,
                data: permissions,
            });
        }
        catch (error) {
            logger_1.default.error('Get all permissions error:', error);
            next(error);
        }
    }
    static async getPermissionById(req, res, next) {
        try {
            const { id } = req.params;
            const tenantId = req.user?.tenantId;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'Permission ID is required',
                });
                return;
            }
            if (!tenantId) {
                res.status(400).json({
                    success: false,
                    error: 'Tenant ID is required',
                });
                return;
            }
            const permission = await permission_service_1.default.getPermissionById(id, tenantId);
            if (!permission) {
                res.status(404).json({
                    success: false,
                    error: 'Permission not found',
                });
                return;
            }
            res.json({
                success: true,
                data: permission,
            });
        }
        catch (error) {
            logger_1.default.error('Get permission by ID error:', error);
            next(error);
        }
    }
    static async createPermission(req, res, next) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                res.status(400).json({
                    success: false,
                    error: 'Tenant ID is required',
                });
                return;
            }
            const permissionData = {
                name: req.body.name,
                resource: req.body.resource,
                action: req.body.action,
                description: req.body.description,
            };
            const permission = await permission_service_1.default.createPermission(tenantId, permissionData);
            res.status(201).json({
                success: true,
                data: permission,
                message: 'Permission created successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Create permission error:', error);
            if (error.message === 'Permission name already exists for this tenant') {
                res.status(409).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            if (error.message === 'Permission with this resource and action already exists for this tenant') {
                res.status(409).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            next(error);
        }
    }
    static async updatePermission(req, res, next) {
        try {
            const { id } = req.params;
            const tenantId = req.user?.tenantId;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'Permission ID is required',
                });
                return;
            }
            if (!tenantId) {
                res.status(400).json({
                    success: false,
                    error: 'Tenant ID is required',
                });
                return;
            }
            const updateData = {
                name: req.body.name,
                resource: req.body.resource,
                action: req.body.action,
                description: req.body.description,
            };
            const permission = await permission_service_1.default.updatePermission(id, tenantId, updateData);
            res.json({
                success: true,
                data: permission,
                message: 'Permission updated successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Update permission error:', error);
            if (error.message === 'Permission not found') {
                res.status(404).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            if (error.message === 'Cannot update system permissions') {
                res.status(403).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            if (error.message === 'Permission name already exists for this tenant') {
                res.status(409).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            if (error.message === 'Permission with this resource and action already exists for this tenant') {
                res.status(409).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            next(error);
        }
    }
    static async deletePermission(req, res, next) {
        try {
            const { id } = req.params;
            const tenantId = req.user?.tenantId;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'Permission ID is required',
                });
                return;
            }
            if (!tenantId) {
                res.status(400).json({
                    success: false,
                    error: 'Tenant ID is required',
                });
                return;
            }
            await permission_service_1.default.deletePermission(id, tenantId);
            res.json({
                success: true,
                message: 'Permission deleted successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Delete permission error:', error);
            if (error.message === 'Permission not found') {
                res.status(404).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            if (error.message === 'Cannot delete system permissions') {
                res.status(403).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            if (error.message === 'Cannot delete permission that is assigned to roles') {
                res.status(409).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            next(error);
        }
    }
    static async getPermissionsByResource(req, res, next) {
        try {
            const { resource } = req.params;
            const tenantId = req.user?.tenantId;
            if (!resource) {
                res.status(400).json({
                    success: false,
                    error: 'Resource is required',
                });
                return;
            }
            if (!tenantId) {
                res.status(400).json({
                    success: false,
                    error: 'Tenant ID is required',
                });
                return;
            }
            const permissions = await permission_service_1.default.getPermissionsByResource(tenantId, resource);
            res.json({
                success: true,
                data: permissions,
            });
        }
        catch (error) {
            logger_1.default.error('Get permissions by resource error:', error);
            next(error);
        }
    }
    static async getPermissionStats(req, res, next) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                res.status(400).json({
                    success: false,
                    error: 'Tenant ID is required',
                });
                return;
            }
            const stats = await permission_service_1.default.getPermissionStats(tenantId);
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            logger_1.default.error('Get permission stats error:', error);
            next(error);
        }
    }
    static async checkPermissionNameAvailability(req, res, next) {
        try {
            const { name } = req.params;
            const { excludePermissionId } = req.query;
            const tenantId = req.user?.tenantId;
            if (!name) {
                res.status(400).json({
                    success: false,
                    error: 'Permission name is required',
                });
                return;
            }
            if (!tenantId) {
                res.status(400).json({
                    success: false,
                    error: 'Tenant ID is required',
                });
                return;
            }
            const available = await permission_service_1.default.isPermissionNameAvailable(tenantId, name, excludePermissionId);
            res.json({
                success: true,
                data: {
                    name,
                    available,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Check permission name availability error:', error);
            next(error);
        }
    }
    static async checkResourceActionAvailability(req, res, next) {
        try {
            const { resource, action } = req.params;
            const { excludePermissionId } = req.query;
            const tenantId = req.user?.tenantId;
            if (!resource || !action) {
                res.status(400).json({
                    success: false,
                    error: 'Resource and action are required',
                });
                return;
            }
            if (!tenantId) {
                res.status(400).json({
                    success: false,
                    error: 'Tenant ID is required',
                });
                return;
            }
            const available = await permission_service_1.default.isResourceActionAvailable(tenantId, resource, action, excludePermissionId);
            res.json({
                success: true,
                data: {
                    resource,
                    action,
                    available,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Check resource:action availability error:', error);
            next(error);
        }
    }
}
exports.PermissionController = PermissionController;
//# sourceMappingURL=permission.controller.js.map