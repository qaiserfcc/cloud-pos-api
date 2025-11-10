"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantController = void 0;
const tenant_service_1 = require("../services/tenant.service");
const logger_1 = __importDefault(require("../config/logger"));
class TenantController {
    static async getAllTenants(req, res, next) {
        try {
            const tenants = await tenant_service_1.TenantService.getAllTenants();
            res.json({
                success: true,
                data: tenants,
                count: tenants.length,
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching tenants:', error);
            next(error);
        }
    }
    static async getTenantById(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'Tenant ID is required',
                });
                return;
            }
            const tenant = await tenant_service_1.TenantService.getTenantById(id);
            if (!tenant) {
                res.status(404).json({
                    success: false,
                    message: 'Tenant not found',
                });
                return;
            }
            res.json({
                success: true,
                data: tenant,
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching tenant:', error);
            next(error);
        }
    }
    static async createTenant(req, res, next) {
        try {
            const tenantData = req.body;
            if (!tenantData.name || !tenantData.domain) {
                res.status(400).json({
                    success: false,
                    message: 'Name and domain are required',
                });
                return;
            }
            const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
            if (!domainRegex.test(tenantData.domain)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid domain format',
                });
                return;
            }
            const tenant = await tenant_service_1.TenantService.createTenant(tenantData);
            res.status(201).json({
                success: true,
                data: tenant,
                message: 'Tenant created successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error creating tenant:', error);
            if (error instanceof Error && error.message.includes('already exists')) {
                res.status(409).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            next(error);
        }
    }
    static async updateTenant(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'Tenant ID is required',
                });
                return;
            }
            const updateData = req.body;
            const tenant = await tenant_service_1.TenantService.updateTenant(id, updateData);
            res.json({
                success: true,
                data: tenant,
                message: 'Tenant updated successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error updating tenant:', error);
            if (error instanceof Error && error.message === 'Tenant not found') {
                res.status(404).json({
                    success: false,
                    message: 'Tenant not found',
                });
                return;
            }
            if (error instanceof Error && error.message.includes('already exists')) {
                res.status(409).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            next(error);
        }
    }
    static async deleteTenant(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'Tenant ID is required',
                });
                return;
            }
            await tenant_service_1.TenantService.deleteTenant(id);
            res.json({
                success: true,
                message: 'Tenant deleted successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error deleting tenant:', error);
            if (error instanceof Error && error.message === 'Tenant not found') {
                res.status(404).json({
                    success: false,
                    message: 'Tenant not found',
                });
                return;
            }
            if (error instanceof Error && error.message.includes('active stores or users')) {
                res.status(409).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            next(error);
        }
    }
    static async getTenantStats(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'Tenant ID is required',
                });
                return;
            }
            const stats = await tenant_service_1.TenantService.getTenantStats(id);
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching tenant stats:', error);
            next(error);
        }
    }
    static async checkDomainAvailability(req, res, next) {
        try {
            const { domain } = req.params;
            if (!domain) {
                res.status(400).json({
                    success: false,
                    message: 'Domain is required',
                });
                return;
            }
            const { excludeId } = req.query;
            const isAvailable = await tenant_service_1.TenantService.isDomainAvailable(domain, excludeId);
            res.json({
                success: true,
                data: {
                    domain,
                    available: isAvailable,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error checking domain availability:', error);
            next(error);
        }
    }
}
exports.TenantController = TenantController;
//# sourceMappingURL=tenant.controller.js.map