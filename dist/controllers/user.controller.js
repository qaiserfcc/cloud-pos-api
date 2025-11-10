"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
const logger_1 = __importDefault(require("../config/logger"));
class UserController {
    static async getAllUsers(req, res, next) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                res.status(400).json({
                    success: false,
                    error: 'Tenant ID is required',
                });
                return;
            }
            const users = await user_service_1.UserService.getAllUsers(tenantId);
            res.json({
                success: true,
                data: users,
            });
        }
        catch (error) {
            logger_1.default.error('Get all users error:', error);
            if (error.message === 'Tenant not found') {
                res.status(404).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            next(error);
        }
    }
    static async getUserById(req, res, next) {
        try {
            const { id } = req.params;
            const tenantId = req.user?.tenantId;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'User ID is required',
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
            const user = await user_service_1.UserService.getUserById(id, tenantId);
            res.json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            logger_1.default.error('Get user by ID error:', error);
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
    static async createUser(req, res, next) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                res.status(400).json({
                    success: false,
                    error: 'Tenant ID is required',
                });
                return;
            }
            const userData = {
                email: req.body.email,
                password: req.body.password,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                phone: req.body.phone,
                avatar: req.body.avatar,
                defaultStoreId: req.body.defaultStoreId,
                roleIds: req.body.roleIds,
            };
            const user = await user_service_1.UserService.createUser(tenantId, userData);
            res.status(201).json({
                success: true,
                data: user,
                message: 'User created successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Create user error:', error);
            if (error.message === 'User with this email already exists') {
                res.status(409).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            if (error.message.includes('not found') || error.message.includes('does not belong')) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            next(error);
        }
    }
    static async updateUser(req, res, next) {
        try {
            const { id } = req.params;
            const tenantId = req.user?.tenantId;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'User ID is required',
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
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                phone: req.body.phone,
                avatar: req.body.avatar,
                defaultStoreId: req.body.defaultStoreId,
                isActive: req.body.isActive,
                roleIds: req.body.roleIds,
            };
            const user = await user_service_1.UserService.updateUser(id, tenantId, updateData);
            res.json({
                success: true,
                data: user,
                message: 'User updated successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Update user error:', error);
            if (error.message === 'User not found') {
                res.status(404).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            if (error.message.includes('not found') || error.message.includes('does not belong')) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            next(error);
        }
    }
    static async deleteUser(req, res, next) {
        try {
            const { id } = req.params;
            const tenantId = req.user?.tenantId;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'User ID is required',
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
            await user_service_1.UserService.deleteUser(id, tenantId);
            res.json({
                success: true,
                message: 'User deleted successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Delete user error:', error);
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
    static async changePassword(req, res, next) {
        try {
            const { id } = req.params;
            const tenantId = req.user?.tenantId;
            const { currentPassword, newPassword } = req.body;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'User ID is required',
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
            const isSuperAdmin = req.user?.roles.includes('Super Admin');
            const isOwnPassword = req.user?.id === id;
            if (!isSuperAdmin && !isOwnPassword) {
                res.status(403).json({
                    success: false,
                    error: 'You can only change your own password',
                });
                return;
            }
            await user_service_1.UserService.changePassword(id, tenantId, currentPassword, newPassword);
            res.json({
                success: true,
                message: 'Password changed successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Change password error:', error);
            if (error.message === 'User not found') {
                res.status(404).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            if (error.message === 'Current password is incorrect') {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            next(error);
        }
    }
    static async resetPassword(req, res, next) {
        try {
            const { id } = req.params;
            const tenantId = req.user?.tenantId;
            const { newPassword } = req.body;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'User ID is required',
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
            await user_service_1.UserService.resetPassword(id, tenantId, newPassword);
            res.json({
                success: true,
                message: 'Password reset successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Reset password error:', error);
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
    static async getUserStats(req, res, next) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                res.status(400).json({
                    success: false,
                    error: 'Tenant ID is required',
                });
                return;
            }
            const stats = await user_service_1.UserService.getUserStats(tenantId);
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            logger_1.default.error('Get user stats error:', error);
            next(error);
        }
    }
    static async checkEmailAvailability(req, res, next) {
        try {
            const { email } = req.params;
            const { excludeUserId } = req.query;
            if (!email) {
                res.status(400).json({
                    success: false,
                    error: 'Email is required',
                });
                return;
            }
            const available = await user_service_1.UserService.isEmailAvailable(email, excludeUserId);
            res.json({
                success: true,
                data: {
                    email,
                    available,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Check email availability error:', error);
            next(error);
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map