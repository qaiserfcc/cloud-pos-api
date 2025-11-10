import { Router } from 'express';
import {
  createRegion,
  updateRegion,
  deleteRegion,
  getRegions,
  getRegionById,
  getRegionalInventory,
  addStoresToRegion,
  removeStoresFromRegion,
  getRegionsForStore,
} from '../controllers/inventory-region.controller';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

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
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  authenticateToken,
  requirePermission('inventory.region.create'),
  createRegion
);

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
router.get(
  '/',
  authenticateToken,
  requirePermission('inventory.region.read'),
  getRegions
);

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
router.get(
  '/:id',
  authenticateToken,
  requirePermission('inventory.region.read'),
  getRegionById
);

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
router.put(
  '/:id',
  authenticateToken,
  requirePermission('inventory.region.update'),
  updateRegion
);

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
router.delete(
  '/:id',
  authenticateToken,
  requirePermission('inventory.region.delete'),
  deleteRegion
);

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
router.get(
  '/:id/inventory',
  authenticateToken,
  requirePermission('inventory.region.read'),
  getRegionalInventory
);

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
router.post(
  '/:id/stores',
  authenticateToken,
  requirePermission('inventory.region.update'),
  addStoresToRegion
);

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
router.delete(
  '/:id/stores',
  authenticateToken,
  requirePermission('inventory.region.update'),
  removeStoresFromRegion
);

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
router.get(
  '/store/:storeId',
  authenticateToken,
  requirePermission('inventory.region.read'),
  getRegionsForStore
);

export default router;