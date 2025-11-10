"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreService = void 0;
const models_1 = require("../db/models");
const sequelize_1 = require("sequelize");
const logger_1 = __importDefault(require("../config/logger"));
class StoreService {
    static async getAllStores(tenantId) {
        const stores = await models_1.Store.findAll({
            where: { tenantId, isActive: true },
            include: [
                {
                    model: models_1.Tenant,
                    as: 'tenant',
                    attributes: ['name'],
                    required: false,
                },
                {
                    model: models_1.User,
                    as: 'storeUsers',
                    attributes: ['id'],
                    required: false,
                },
            ],
            order: [['createdAt', 'DESC']],
        });
        return stores.map((store) => ({
            id: store.id,
            tenantId: store.tenantId,
            name: store.name,
            code: store.code,
            address: store.address,
            phone: store.phone || '',
            email: store.email || '',
            settings: store.settings || {},
            isActive: store.isActive,
            createdAt: store.createdAt,
            updatedAt: store.updatedAt,
            userCount: store.storeUsers?.length || 0,
            tenantName: store.tenant?.name,
        }));
    }
    static async getStoreById(storeId, tenantId) {
        const whereClause = { id: storeId };
        if (tenantId) {
            whereClause.tenantId = tenantId;
        }
        const store = await models_1.Store.findOne({
            where: whereClause,
            include: [
                {
                    model: models_1.Tenant,
                    as: 'tenant',
                    attributes: ['name'],
                    required: false,
                },
                {
                    model: models_1.User,
                    as: 'storeUsers',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'isActive'],
                    required: false,
                },
            ],
        });
        if (!store) {
            return null;
        }
        return {
            id: store.id,
            tenantId: store.tenantId,
            name: store.name,
            code: store.code,
            address: store.address,
            phone: store.phone || '',
            email: store.email || '',
            settings: store.settings || {},
            isActive: store.isActive,
            createdAt: store.createdAt,
            updatedAt: store.updatedAt,
            userCount: store.storeUsers?.length || 0,
            tenantName: store.tenant?.name,
        };
    }
    static async createStore(data) {
        const tenant = await models_1.Tenant.findByPk(data.tenantId);
        if (!tenant) {
            throw new Error('Tenant not found');
        }
        const existingStore = await models_1.Store.findOne({
            where: {
                tenantId: data.tenantId,
                code: data.code,
            },
            paranoid: false,
        });
        if (existingStore) {
            throw new Error('Store with this code already exists for this tenant');
        }
        const store = await models_1.Store.create({
            tenantId: data.tenantId,
            name: data.name,
            code: data.code,
            address: data.address,
            phone: data.phone || '',
            email: data.email || '',
            settings: data.settings || {},
        });
        logger_1.default.info(`New store created: ${data.name}`, {
            storeId: store.id,
            tenantId: data.tenantId,
            code: data.code,
        });
        return store;
    }
    static async updateStore(storeId, tenantId, data) {
        const store = await models_1.Store.findOne({
            where: { id: storeId, tenantId },
        });
        if (!store) {
            throw new Error('Store not found');
        }
        if (data.code && data.code !== store.code) {
            const existingStore = await models_1.Store.findOne({
                where: {
                    tenantId,
                    code: data.code,
                },
                paranoid: false,
            });
            if (existingStore && existingStore.id !== storeId) {
                throw new Error('Store with this code already exists for this tenant');
            }
        }
        if (data.name !== undefined)
            store.name = data.name;
        if (data.code !== undefined)
            store.code = data.code;
        if (data.address !== undefined)
            store.address = data.address;
        if (data.phone !== undefined)
            store.phone = data.phone;
        if (data.email !== undefined)
            store.email = data.email;
        if (data.settings !== undefined)
            store.settings = data.settings;
        if (data.isActive !== undefined)
            store.isActive = data.isActive;
        await store.save();
        logger_1.default.info(`Store updated: ${store.name}`, {
            storeId: store.id,
            tenantId,
            changes: data,
        });
        return store;
    }
    static async deleteStore(storeId, tenantId) {
        const store = await models_1.Store.findOne({
            where: { id: storeId, tenantId },
        });
        if (!store) {
            throw new Error('Store not found');
        }
        const userCount = await models_1.User.count({
            where: { defaultStoreId: storeId, isActive: true },
        });
        if (userCount > 0) {
            throw new Error('Cannot delete store with active users. Deactivate them first.');
        }
        await store.destroy();
        logger_1.default.info(`Store deleted: ${store.name}`, {
            storeId: store.id,
            tenantId,
        });
    }
    static async getStoreStats(storeId, tenantId) {
        const userCount = await models_1.User.count({
            where: { defaultStoreId: storeId, tenantId: tenantId },
        });
        const activeUserCount = await models_1.User.count({
            where: { defaultStoreId: storeId, tenantId: tenantId, isActive: true },
        });
        return {
            userCount,
            activeUserCount,
        };
    }
    static async isStoreCodeAvailable(tenantId, code, excludeStoreId) {
        const whereClause = {
            tenantId,
            code,
        };
        if (excludeStoreId) {
            whereClause.id = { [sequelize_1.Op.ne]: excludeStoreId };
        }
        const existingStore = await models_1.Store.findOne({
            where: whereClause,
            paranoid: false,
        });
        return !existingStore;
    }
    static async getStoresByTenant(tenantId) {
        return this.getAllStores(tenantId);
    }
}
exports.StoreService = StoreService;
//# sourceMappingURL=store.service.js.map