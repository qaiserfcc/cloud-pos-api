import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { StoreService, CreateStoreData, UpdateStoreData } from '../services/store.service';
import logger from '../config/logger';

export class StoreController {
  private storeService: StoreService;

  constructor() {
    this.storeService = new StoreService();
  }

  // GET /api/stores
  async getAllStores(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const stores = await StoreService.getAllStores(tenantId);

      res.json({
        success: true,
        data: stores,
      });
    } catch (error) {
      logger.error('Error fetching stores:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stores',
      });
    }
  }

  // GET /api/stores/:id
  async getStoreById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const storeId = req.params.id;

      if (!storeId) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
        return;
      }

      const store = await StoreService.getStoreById(storeId, tenantId);

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
    } catch (error) {
      logger.error('Error fetching store:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch store',
      });
    }
  }

  // POST /api/stores
  async createStore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const storeData = { ...req.body, tenantId };

      const store = await StoreService.createStore(storeData);

      res.status(201).json({
        success: true,
        data: store,
        message: 'Store created successfully',
      });
    } catch (error: any) {
      logger.error('Error creating store:', error);

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

  // PUT /api/stores/:id
  async updateStore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const storeId = req.params.id;
      const updateData = req.body;

      if (!storeId) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
        return;
      }

      const store = await StoreService.updateStore(storeId, tenantId, updateData);

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
    } catch (error: any) {
      logger.error('Error updating store:', error);

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

  // DELETE /api/stores/:id
  async deleteStore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const storeId = req.params.id;

      if (!storeId) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
        return;
      }

      await StoreService.deleteStore(storeId, tenantId);

      res.json({
        success: true,
        message: 'Store deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting store:', error);

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

  // GET /api/stores/:id/stats
  async getStoreStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const storeId = req.params.id;

      if (!storeId) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
        return;
      }

      const stats = await StoreService.getStoreStats(storeId, tenantId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error fetching store stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch store stats',
      });
    }
  }

  // GET /api/stores/check-code/:code
  async checkStoreCode(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const code = req.params.code;

      if (!code) {
        res.status(400).json({
          success: false,
          error: 'Store code is required',
        });
        return;
      }

      const isAvailable = await StoreService.isStoreCodeAvailable(tenantId, code);

      res.json({
        success: true,
        data: {
          code,
          available: isAvailable,
        },
      });
    } catch (error) {
      logger.error('Error checking store code:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check store code',
      });
    }
  }
}