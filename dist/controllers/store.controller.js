"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreController = void 0;
const store_service_1 = require("../services/store.service");
const logger_1 = __importDefault(require("../config/logger"));
class StoreController {
    storeService;
    constructor() {
        this.storeService = new store_service_1.StoreService();
    }
    async getAllStores(req, res) {
        try {
            const tenantId = req.tenantId;
            const stores = await store_service_1.StoreService.getAllStores(tenantId);
            res.json({
                success: true,
                data: stores,
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching stores:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch stores',
            });
        }
    }
    async getStoreById(req, res) {
        try {
            const tenantId = req.tenantId;
            const storeId = req.params.id;
            if (!storeId) {
                res.status(400).json({
                    success: false,
                    error: 'Store ID is required',
                });
                return;
            }
            const store = await store_service_1.StoreService.getStoreById(storeId, tenantId);
            if (!store) {
                res.status(404).json({
                    success: false,
                    error: 'Store not found',
                });
                return;
            }
            res.json({
                success: true,
                data: store,
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching store:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch store',
            });
        }
    }
    async createStore(req, res) {
        try {
            const tenantId = req.tenantId;
            const storeData = { ...req.body, tenantId };
            const store = await store_service_1.StoreService.createStore(storeData);
            res.status(201).json({
                success: true,
                data: store,
                message: 'Store created successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error creating store:', error);
            if (error.message === 'Store code already exists') {
                res.status(409).json({
                    success: false,
                    error: 'Store code already exists',
                });
                return;
            }
            if (error.message === 'Invalid tenant ID') {
                res.status(400).json({
                    success: false,
                    error: 'Invalid tenant ID',
                });
                return;
            }
            res.status(500).json({
                success: false,
                error: 'Failed to create store',
            });
        }
    }
    async updateStore(req, res) {
        try {
            const tenantId = req.tenantId;
            const storeId = req.params.id;
            const updateData = req.body;
            if (!storeId) {
                res.status(400).json({
                    success: false,
                    error: 'Store ID is required',
                });
                return;
            }
            const store = await store_service_1.StoreService.updateStore(storeId, tenantId, updateData);
            if (!store) {
                res.status(404).json({
                    success: false,
                    error: 'Store not found',
                });
                return;
            }
            res.json({
                success: true,
                data: store,
                message: 'Store updated successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error updating store:', error);
            if (error.message === 'Store code already exists') {
                res.status(409).json({
                    success: false,
                    error: 'Store code already exists',
                });
                return;
            }
            res.status(500).json({
                success: false,
                error: 'Failed to update store',
            });
        }
    }
    async deleteStore(req, res) {
        try {
            const tenantId = req.tenantId;
            const storeId = req.params.id;
            if (!storeId) {
                res.status(400).json({
                    success: false,
                    error: 'Store ID is required',
                });
                return;
            }
            await store_service_1.StoreService.deleteStore(storeId, tenantId);
            res.json({
                success: true,
                message: 'Store deleted successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error deleting store:', error);
            if (error.message === 'Cannot delete store with active users') {
                res.status(409).json({
                    success: false,
                    error: 'Cannot delete store with active users',
                });
                return;
            }
            res.status(500).json({
                success: false,
                error: 'Failed to delete store',
            });
        }
    }
    async getStoreStats(req, res) {
        try {
            const tenantId = req.tenantId;
            const storeId = req.params.id;
            if (!storeId) {
                res.status(400).json({
                    success: false,
                    error: 'Store ID is required',
                });
                return;
            }
            const stats = await store_service_1.StoreService.getStoreStats(storeId, tenantId);
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching store stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch store stats',
            });
        }
    }
    async checkStoreCode(req, res) {
        try {
            const tenantId = req.tenantId;
            const code = req.params.code;
            if (!code) {
                res.status(400).json({
                    success: false,
                    error: 'Store code is required',
                });
                return;
            }
            const isAvailable = await store_service_1.StoreService.isStoreCodeAvailable(tenantId, code);
            res.json({
                success: true,
                data: {
                    code,
                    available: isAvailable,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error checking store code:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to check store code',
            });
        }
    }
}
exports.StoreController = StoreController;
//# sourceMappingURL=store.controller.js.map