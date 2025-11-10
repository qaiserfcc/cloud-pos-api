import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import InventoryRegionService from '../services/inventory-region.service';
import logger from '../config/logger';

/**
 * @swagger
 * components:
 *   schemas:
 *     InventoryRegion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         tenantId:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         regionCode:
 *           type: string
 *         location:
 *           type: object
 *           properties:
 *             country:
 *               type: string
 *             state:
 *               type: string
 *             city:
 *               type: string
 *             postalCode:
 *               type: string
 *             latitude:
 *               type: number
 *             longitude:
 *               type: number
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     InventoryRegionCreate:
 *       type: object
 *       required:
 *         - name
 *         - regionCode
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         regionCode:
 *           type: string
 *         location:
 *           type: object
 *           properties:
 *             country:
 *               type: string
 *             state:
 *               type: string
 *             city:
 *               type: string
 *             postalCode:
 *               type: string
 *             latitude:
 *               type: number
 *             longitude:
 *               type: number
 *     InventoryRegionUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         regionCode:
 *           type: string
 *         location:
 *           type: object
 *           properties:
 *             country:
 *               type: string
 *             state:
 *               type: string
 *             city:
 *               type: string
 *             postalCode:
 *               type: string
 *             latitude:
 *               type: number
 *             longitude:
 *               type: number
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/v1/inventory-regions:
 *   post:
 *     summary: Create a new inventory region
 *     tags: [Inventory Regions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InventoryRegionCreate'
 *     responses:
 *       201:
 *         description: Region created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/InventoryRegion'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const createRegion = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const regionData = req.body;

    if (!regionData.name || !regionData.regionCode) {
      return res.status(400).json({
        success: false,
        message: 'Name and region code are required',
      });
    }

    const region = await InventoryRegionService.createRegion(tenantId, {
      regionCode: regionData.regionCode,
      regionName: regionData.name,
      description: regionData.description,
      storeIds: regionData.storeIds || [],
    });

    return res.status(201).json({
      success: true,
      message: 'Inventory region created successfully',
      data: region,
    });
  } catch (error: any) {
    logger.error('Create region error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create inventory region',
    });
  }
};

/**
 * @swagger
 * /api/v1/inventory-regions/{id}:
 *   put:
 *     summary: Update an inventory region
 *     tags: [Inventory Regions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InventoryRegionUpdate'
 *     responses:
 *       200:
 *         description: Region updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Region not found
 *       500:
 *         description: Internal server error
 */
export const updateRegion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Region ID is required',
      });
    }

    const region = await InventoryRegionService.updateRegion(id, tenantId, {
      regionName: updateData.name,
      description: updateData.description,
      storeIds: updateData.storeIds,
    });

    return res.json({
      success: true,
      message: 'Inventory region updated successfully',
      data: region,
    });
  } catch (error: any) {
    logger.error('Update region error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update inventory region',
    });
  }
};

/**
 * @swagger
 * /api/v1/inventory-regions/{id}:
 *   delete:
 *     summary: Delete an inventory region
 *     tags: [Inventory Regions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Region deleted successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Region not found
 *       500:
 *         description: Internal server error
 */
export const deleteRegion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    const userId = req.user!.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Region ID is required',
      });
    }

    await InventoryRegionService.deleteRegion(id, tenantId);

    return res.json({
      success: true,
      message: 'Inventory region deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete region error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete inventory region',
    });
  }
};

/**
 * @swagger
 * /api/v1/inventory-regions:
 *   get:
 *     summary: Get all inventory regions for the tenant
 *     tags: [Inventory Regions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeStores
 *         schema:
 *           type: boolean
 *           default: false
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Regions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const getRegions = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const includeStores = req.query.includeStores === 'true';
    const isActive = req.query.isActive === undefined ? undefined : req.query.isActive === 'true';

    const result = await InventoryRegionService.getRegions(tenantId, {});

    return res.json({
      success: true,
      message: 'Inventory regions retrieved successfully',
      data: result.regions,
    });
  } catch (error: any) {
    logger.error('Get regions error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve inventory regions',
    });
  }
};

/**
 * @swagger
 * /api/v1/inventory-regions/{id}:
 *   get:
 *     summary: Get inventory region by ID
 *     tags: [Inventory Regions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeStores
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Region retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Region not found
 *       500:
 *         description: Internal server error
 */
export const getRegionById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    const includeStores = req.query.includeStores === 'true';

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Region ID is required',
      });
    }

    const region = await InventoryRegionService.getRegionById(id, tenantId);

    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Inventory region not found',
      });
    }

    return res.json({
      success: true,
      message: 'Inventory region retrieved successfully',
      data: region,
    });
  } catch (error: any) {
    logger.error('Get region by ID error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve inventory region',
    });
  }
};

/**
 * @swagger
 * /api/v1/inventory-regions/{id}/inventory:
 *   get:
 *     summary: Get regional inventory summary
 *     tags: [Inventory Regions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *           default: false
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Regional inventory retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Region not found
 *       500:
 *         description: Internal server error
 */
export const getRegionalInventory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    const includeDetails = req.query.includeDetails === 'true';
    const productId = req.query.productId as string;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Region ID is required',
      });
    }

    const inventory = await InventoryRegionService.getRegionalInventory(id, tenantId, {
      productId,
    });

    return res.json({
      success: true,
      message: 'Regional inventory retrieved successfully',
      data: inventory,
    });
  } catch (error: any) {
    logger.error('Get regional inventory error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve regional inventory',
    });
  }
};

/**
 * @swagger
 * /api/v1/inventory-regions/{id}/stores:
 *   post:
 *     summary: Add stores to an inventory region
 *     tags: [Inventory Regions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeIds
 *             properties:
 *               storeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Stores added to region successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Region not found
 *       500:
 *         description: Internal server error
 */
export const addStoresToRegion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { storeIds } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Region ID is required',
      });
    }

    if (!storeIds || !Array.isArray(storeIds) || storeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Store IDs array is required and cannot be empty',
      });
    }

    const result = await InventoryRegionService.addStoresToRegion(id, tenantId, storeIds);

    return res.json({
      success: true,
      message: 'Stores added to region successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Add stores to region error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to add stores to region',
    });
  }
};

/**
 * @swagger
 * /api/v1/inventory-regions/{id}/stores:
 *   delete:
 *     summary: Remove stores from an inventory region
 *     tags: [Inventory Regions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeIds
 *             properties:
 *               storeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Stores removed from region successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Region not found
 *       500:
 *         description: Internal server error
 */
export const removeStoresFromRegion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { storeIds } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Region ID is required',
      });
    }

    if (!storeIds || !Array.isArray(storeIds) || storeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Store IDs array is required and cannot be empty',
      });
    }

    const result = await InventoryRegionService.removeStoresFromRegion(id, tenantId, storeIds);

    return res.json({
      success: true,
      message: 'Stores removed from region successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Remove stores from region error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove stores from region',
    });
  }
};

/**
 * @swagger
 * /api/v1/stores/{storeId}/regions:
 *   get:
 *     summary: Get regions for a specific store
 *     tags: [Inventory Regions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Store regions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
export const getRegionsForStore = async (req: AuthRequest, res: Response) => {
  try {
    const { storeId } = req.params;
    const tenantId = req.tenantId!;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required',
      });
    }

    const regions = await InventoryRegionService.getRegionsForStore(storeId, tenantId);

    return res.json({
      success: true,
      message: 'Store regions retrieved successfully',
      data: regions,
    });
  } catch (error: any) {
    logger.error('Get regions for store error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve store regions',
    });
  }
};