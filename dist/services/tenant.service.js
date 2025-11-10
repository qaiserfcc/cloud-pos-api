"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantService = void 0;
const models_1 = require("../db/models");
const logger_1 = __importDefault(require("../config/logger"));
class TenantService {
    static async getAllTenants() {
        const tenants = await models_1.Tenant.findAll({
            where: { isActive: true },
            include: [
                {
                    model: models_1.Store,
                    as: 'stores',
                    attributes: ['id'],
                    required: false,
                },
                {
                    model: models_1.User,
                    as: 'users',
                    attributes: ['id'],
                    required: false,
                },
            ],
            order: [['createdAt', 'DESC']],
        });
        return tenants.map((tenant) => ({
            id: tenant.id,
            name: tenant.name,
            domain: tenant.domain,
            settings: tenant.settings || {},
            isActive: tenant.isActive,
            createdAt: tenant.createdAt,
            updatedAt: tenant.updatedAt,
            storeCount: tenant.stores?.length || 0,
            userCount: tenant.users?.length || 0,
        }));
    }
    static async getTenantById(tenantId) {
        const tenant = await models_1.Tenant.findByPk(tenantId, {
            include: [
                {
                    model: models_1.Store,
                    as: 'stores',
                    attributes: ['id', 'name', 'is_active'],
                    required: false,
                },
                {
                    model: models_1.User,
                    as: 'users',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'isActive'],
                    required: false,
                },
            ],
        });
        if (!tenant) {
            return null;
        }
        return {
            id: tenant.id,
            name: tenant.name,
            domain: tenant.domain,
            settings: tenant.settings || {},
            isActive: tenant.isActive,
            createdAt: tenant.createdAt,
            updatedAt: tenant.updatedAt,
            storeCount: tenant.stores?.length || 0,
            userCount: tenant.users?.length || 0,
        };
    }
    static async createTenant(data) {
        const existingTenant = await models_1.Tenant.findOne({
            where: { domain: data.domain },
            paranoid: false,
        });
        if (existingTenant) {
            throw new Error('Tenant with this domain already exists');
        }
        const tenant = await models_1.Tenant.create({
            name: data.name,
            domain: data.domain,
            settings: data.settings || {},
        });
        logger_1.default.info(`New tenant created: ${data.name}`, {
            tenantId: tenant.id,
            domain: data.domain,
        });
        return tenant;
    }
    static async updateTenant(tenantId, data) {
        const tenant = await models_1.Tenant.findByPk(tenantId);
        if (!tenant) {
            throw new Error('Tenant not found');
        }
        if (data.domain && data.domain !== tenant.domain) {
            const existingTenant = await models_1.Tenant.findOne({
                where: { domain: data.domain },
                paranoid: false,
            });
            if (existingTenant && existingTenant.id !== tenantId) {
                throw new Error('Tenant with this domain already exists');
            }
        }
        if (data.name !== undefined)
            tenant.name = data.name;
        if (data.domain !== undefined)
            tenant.domain = data.domain;
        if (data.settings !== undefined)
            tenant.settings = data.settings;
        if (data.isActive !== undefined)
            tenant.isActive = data.isActive;
        await tenant.save();
        logger_1.default.info(`Tenant updated: ${tenant.name}`, {
            tenantId: tenant.id,
            changes: data,
        });
        return tenant;
    }
    static async deleteTenant(tenantId) {
        const tenant = await models_1.Tenant.findByPk(tenantId);
        if (!tenant) {
            throw new Error('Tenant not found');
        }
        const storeCount = await models_1.Store.count({
            where: { tenantId: tenantId, isActive: true },
        });
        const userCount = await models_1.User.count({
            where: { tenantId: tenantId, isActive: true },
        });
        if (storeCount > 0 || userCount > 0) {
            throw new Error('Cannot delete tenant with active stores or users. Deactivate them first.');
        }
        await tenant.destroy();
        logger_1.default.info(`Tenant deleted: ${tenant.name}`, {
            tenantId: tenant.id,
        });
    }
    static async getTenantStats(tenantId) {
        const storeCount = await models_1.Store.count({
            where: { tenantId: tenantId, isActive: true },
        });
        const userCount = await models_1.User.count({
            where: { tenantId: tenantId },
        });
        const activeUserCount = await models_1.User.count({
            where: { tenantId: tenantId, isActive: true },
        });
        return {
            storeCount,
            userCount,
            activeUserCount,
        };
    }
    static async isDomainAvailable(domain, excludeTenantId) {
        const whereClause = { domain };
        if (excludeTenantId) {
            whereClause.id = { [require('sequelize').Op.ne]: excludeTenantId };
        }
        const existingTenant = await models_1.Tenant.findOne({
            where: whereClause,
            paranoid: false,
        });
        return !existingTenant;
    }
}
exports.TenantService = TenantService;
//# sourceMappingURL=tenant.service.js.map