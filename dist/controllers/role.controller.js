"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleController = void 0;
const role_service_1 = __importDefault(require("../services/role.service"));
const logger_1 = __importDefault(require("../config/logger"));
class RoleController {
    static async getAllRoles(req, res, next) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                res.status(400).json({
                    success: false,
                    error: 'Tenant ID is required',
                });
                return;
            }
            const roles = await role_service_1.default.getAllRoles(tenantId);
            res.json({
                success: true,
                data: roles,
            });
        }
        catch (error) {
            logger_1.default.error('Get all roles error:', error);
            next(error);
        }
    }
    static async getRoleById(req, res, next) {
        try {
            const { id } = req.params;
            const tenantId = req.user?.tenantId;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'Role ID is required',
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
            const role = await role_service_1.default.getRoleById(id, tenantId);
            if (!role) {
                res.status(404).json({
                    success: false,
                    error: 'Role not found',
                });
                return;
            }
            res.json({
                success: true,
                data: role,
            });
        }
        catch (error) {
            logger_1.default.error('Get role by ID error:', error);
            next(error);
        }
    }
    static async createRole(req, res, next) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                res.status(400).json({
                    success: false,
                    error: 'Tenant ID is required',
                });
                return;
            }
            const roleData = {
                name: req.body.name,
                description: req.body.description,
                permissionIds: req.body.permissionIds,
            };
            const role = await role_service_1.default.createRole(tenantId, roleData);
            res.status(201).json({
                success: true,
                data: role,
                message: 'Role created successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Create role error:', error);
            if (error.message === 'Role name already exists for this tenant') {
                res.status(409).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            if (error.message === 'One or more permissions not found') {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            next(error);
        }
    }
    static async updateRole(req, res, next) {
        try {
            const { id } = req.params;
            const tenantId = req.user?.tenantId;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'Role ID is required',
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
                description: req.body.description,
                permissionIds: req.body.permissionIds,
            };
            const role = await role_service_1.default.updateRole(id, tenantId, updateData);
            res.json({
                success: true,
                data: role,
                message: 'Role updated successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Update role error:', error);
            if (error.message === 'Role not found') {
                res.status(404).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            if (error.message === 'Cannot update system roles') {
                res.status(403).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            if (error.message === 'Role name already exists for this tenant') {
                res.status(409).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            if (error.message === 'One or more permissions not found') {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            next(error);
        }
    }
    static async deleteRole(req, res, next) {
        try {
            const { id } = req.params;
            const tenantId = req.user?.tenantId;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'Role ID is required',
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
            await role_service_1.default.deleteRole(id, tenantId);
            res.json({
                success: true,
                message: 'Role deleted successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Delete role error:', error);
            if (error.message === 'Role not found') {
                res.status(404).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            if (error.message === 'Cannot delete system roles') {
                res.status(403).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            if (error.message === 'Cannot delete role that is assigned to users') {
                res.status(409).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            next(error);
        }
    }
    static async getRoleStats(req, res, next) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                res.status(400).json({
                    success: false,
                    error: 'Tenant ID is required',
                });
                return;
            }
            const stats = await role_service_1.default.getRoleStats(tenantId);
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            logger_1.default.error('Get role stats error:', error);
            next(error);
        }
    }
    static async checkRoleNameAvailability(req, res, next) {
        try {
            const { name } = req.params;
            const { excludeRoleId } = req.query;
            const tenantId = req.user?.tenantId;
            if (!name) {
                res.status(400).json({
                    success: false,
                    error: 'Role name is required',
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
            const available = await role_service_1.default.isRoleNameAvailable(tenantId, name, excludeRoleId);
            res.json({
                success: true,
                data: {
                    name,
                    available,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Check role name availability error:', error);
            next(error);
        }
    }
}
exports.RoleController = RoleController;
//# sourceMappingURL=role.controller.js.map