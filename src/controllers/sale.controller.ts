import { Request, Response, NextFunction } from 'express';
import {
  SaleService,
  CreateSaleData,
  UpdateSaleData,
  ProcessPaymentData,
  SaleWithDetails
} from '../services/sale.service';
import { AuthRequest } from './auth.controller';
import logger from '../config/logger';

export class SaleController {
  /**
   * @swagger
   * /sales:
   *   post:
   *     summary: Create a new sale transaction
   *     description: Create a new sale with items, calculate totals, and update inventory
   *     tags: [Sales]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - items
   *             properties:
   *               items:
   *                 type: array
   *                 items:
   *                   type: object
   *                   required:
   *                     - productId
   *                     - quantity
   *                     - unitPrice
   *                   properties:
   *                     productId:
   *                       type: string
   *                       format: uuid
   *                       example: "123e4567-e89b-12d3-a456-426614174000"
   *                     quantity:
   *                       type: number
   *                       minimum: 1
   *                       example: 2
   *                     unitPrice:
   *                       type: number
   *                       minimum: 0
   *                       example: 29.99
   *                     discount:
   *                       type: number
   *                       minimum: 0
   *                       example: 0
   *               customerId:
   *                 type: string
   *                 format: uuid
   *                 example: "123e4567-e89b-12d3-a456-426614174000"
   *               notes:
   *                 type: string
   *                 example: "Customer requested gift wrapping"
   *     responses:
   *       201:
   *         description: Sale created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Sale'
   *                 message:
   *                   type: string
   *                   example: "Sale created successfully"
   *       400:
   *         description: Validation error or insufficient stock
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Requires sale create permission
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async createSale(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      if (!storeId) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
        return;
      }

      const saleData: CreateSaleData = {
        tenantId,
        storeId,
        userId: req.user!.id,
        ...req.body,
      };

      const sale = await SaleService.createSale(saleData);

      logger.info(`Created sale ${sale.saleNumber} for store ${storeId} in tenant ${tenantId}`);

      res.status(201).json({
        success: true,
        data: sale,
        message: 'Sale created successfully',
      });
    } catch (error: any) {
      logger.error('Create sale error:', error);

      if (error.message.includes('not found') || error.message.includes('insufficient stock')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * @swagger
   * /sales/{id}:
   *   get:
   *     summary: Get sale by ID
   *     description: Retrieve detailed information about a specific sale including items and payments
   *     tags: [Sales]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Sale ID
   *     responses:
   *       200:
   *         description: Sale retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Sale'
   *       403:
   *         description: Forbidden - Requires sale read permission
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Sale not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async getSaleById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Sale ID is required',
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

      const sale = await SaleService.getSaleById(id, tenantId);

      if (!sale) {
        res.status(404).json({
          success: false,
          error: 'Sale not found',
        });
        return;
      }

      logger.info(`Retrieved sale ${sale.saleNumber} for tenant ${tenantId}`);

      res.json({
        success: true,
        data: sale,
      });
    } catch (error: any) {
      logger.error('Get sale by ID error:', error);

      if (error.message === 'Sale not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * @swagger
   * /sales/store:
   *   get:
   *     summary: Get store sales with pagination and filters
   *     description: Retrieve sales for the current store with optional filtering and pagination
   *     tags: [Sales]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: page
   *         in: query
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *       - name: limit
   *         in: query
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of items per page
   *       - name: status
   *         in: query
   *         schema:
   *           type: string
   *           enum: [pending, completed, cancelled]
   *         description: Filter by sale status
   *       - name: paymentStatus
   *         in: query
   *         schema:
   *           type: string
   *           enum: [pending, partial, paid, refunded]
   *         description: Filter by payment status
   *       - name: startDate
   *         in: query
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter sales from this date
   *       - name: endDate
   *         in: query
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter sales until this date
   *       - name: customerId
   *         in: query
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by customer ID
   *       - name: search
   *         in: query
   *         schema:
   *           type: string
   *         description: Search in sale number or customer name
   *     responses:
   *       200:
   *         description: Store sales retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Sale'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                       example: 1
   *                     limit:
   *                       type: integer
   *                       example: 20
   *                     total:
   *                       type: integer
   *                       example: 150
   *                     totalPages:
   *                       type: integer
   *                       example: 8
   *       400:
   *         description: Bad request - Invalid parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async getStoreSales(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      if (!storeId) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
        return;
      }

      const {
        page = 1,
        limit = 20,
        status,
        paymentStatus,
        startDate,
        endDate,
        customerId,
        search,
      } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 20;

      const filters: any = {};
      if (status) filters.status = status;
      if (paymentStatus) filters.paymentStatus = paymentStatus;
      if (customerId) filters.customerId = customerId;
      if (search) filters.search = search;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const result = await SaleService.getStoreSales(
        storeId,
        tenantId,
        pageNum,
        limitNum,
        filters
      );

      logger.info(`Retrieved ${result.sales.length} sales for store ${storeId} in tenant ${tenantId}`);

      res.json({
        success: true,
        data: result.sales,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          totalPages: Math.ceil(result.total / limitNum),
        },
      });
    } catch (error: any) {
      logger.error('Get store sales error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /sales/{id}:
   *   put:
   *     summary: Update sale details
   *     description: Update sale information such as items, discounts, or notes
   *     tags: [Sales]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Sale ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               items:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     productId:
   *                       type: string
   *                       format: uuid
   *                     quantity:
   *                       type: number
   *                       minimum: 1
   *                     unitPrice:
   *                       type: number
   *                       minimum: 0
   *                     discount:
   *                       type: number
   *                       minimum: 0
   *                       default: 0
   *               discount:
   *                 type: number
   *                 minimum: 0
   *                 default: 0
   *               notes:
   *                 type: string
   *                 maxLength: 500
   *     responses:
   *       200:
   *         description: Sale updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Sale'
   *                 message:
   *                   type: string
   *                   example: "Sale updated successfully"
   *       400:
   *         description: Bad request - Invalid data or sale cannot be updated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Sale not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async updateSale(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Sale ID is required',
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

      const updateData: UpdateSaleData = req.body;

      const sale = await SaleService.updateSale(id, tenantId, updateData);

      if (!sale) {
        res.status(404).json({
          success: false,
          error: 'Sale not found',
        });
        return;
      }

      logger.info(`Updated sale ${sale.saleNumber} for tenant ${tenantId}`);

      res.json({
        success: true,
        data: sale,
        message: 'Sale updated successfully',
      });
    } catch (error: any) {
      logger.error('Update sale error:', error);

      if (error.message === 'Sale not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('cannot be updated')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * @swagger
   * /sales/{id}/payment:
   *   post:
   *     summary: Process payment for a sale
   *     description: Process payment for an existing sale using various payment methods
   *     tags: [Sales, Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Sale ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - amount
   *               - method
   *             properties:
   *               amount:
   *                 type: number
   *                 minimum: 0.01
   *                 description: Payment amount
   *               method:
   *                 type: string
   *                 enum: [cash, card, bank_transfer, digital_wallet, other]
   *                 description: Payment method
   *               reference:
   *                 type: string
   *                 maxLength: 100
   *                 description: Payment reference or transaction ID
   *               notes:
   *                 type: string
   *                 maxLength: 255
   *                 description: Payment notes
   *     responses:
   *       200:
   *         description: Payment processed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Sale'
   *                 message:
   *                   type: string
   *                   example: "Payment processed successfully"
   *       400:
   *         description: Bad request - Invalid payment data or sale cannot accept payment
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Sale not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async processPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Sale ID is required',
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

      const paymentData: ProcessPaymentData = req.body;

      const sale = await SaleService.processPayment(id, tenantId, paymentData, req.user!.id);

      logger.info(`Processed payment for sale ${sale.saleNumber} in tenant ${tenantId}`);

      res.json({
        success: true,
        data: sale,
        message: 'Payment processed successfully',
      });
    } catch (error: any) {
      logger.error('Process payment error:', error);

      if (error.message === 'Sale not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('cannot process payment') || error.message.includes('invalid')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * @swagger
   * /sales/{id}/complete:
   *   post:
   *     summary: Complete a sale
   *     description: Mark a sale as completed and finalize all transactions
   *     tags: [Sales]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Sale ID
   *     responses:
   *       200:
   *         description: Sale completed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Sale'
   *                 message:
   *                   type: string
   *                   example: "Sale completed successfully"
   *       400:
   *         description: Bad request - Sale cannot be completed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Sale not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async completeSale(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Sale ID is required',
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

      const sale = await SaleService.completeSale(id, tenantId);

      logger.info(`Completed sale ${sale.saleNumber} for tenant ${tenantId}`);

      res.json({
        success: true,
        data: sale,
        message: 'Sale completed successfully',
      });
    } catch (error: any) {
      logger.error('Complete sale error:', error);

      if (error.message === 'Sale not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('cannot be completed')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * @swagger
   * /sales/{id}/cancel:
   *   post:
   *     summary: Cancel a sale
   *     description: Cancel a pending sale and restore inventory quantities
   *     tags: [Sales]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Sale ID
   *     responses:
   *       200:
   *         description: Sale cancelled successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Sale'
   *                 message:
   *                   type: string
   *                   example: "Sale cancelled successfully"
   *       400:
   *         description: Bad request - Sale cannot be cancelled
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Sale not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async cancelSale(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Sale ID is required',
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

      const sale = await SaleService.cancelSale(id, tenantId);

      logger.info(`Cancelled sale ${sale.saleNumber} for tenant ${tenantId}`);

      res.json({
        success: true,
        data: sale,
        message: 'Sale cancelled successfully',
      });
    } catch (error: any) {
      logger.error('Cancel sale error:', error);

      if (error.message === 'Sale not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('cannot be cancelled')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * @swagger
   * /sales/{id}/refund:
   *   post:
   *     summary: Process refund for a sale
   *     description: Process a partial or full refund for a completed sale
   *     tags: [Sales, Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Sale ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refundAmount
   *               - reason
   *             properties:
   *               refundAmount:
   *                 type: number
   *                 minimum: 0.01
   *                 description: Amount to refund
   *               reason:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 255
   *                 description: Reason for the refund
   *     responses:
   *       200:
   *         description: Refund processed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Sale'
   *                 message:
   *                   type: string
   *                   example: "Refund processed successfully"
   *       400:
   *         description: Bad request - Invalid refund data or sale cannot accept refund
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Sale not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async processRefund(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      const { refundAmount, reason } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Sale ID is required',
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

      if (!refundAmount || typeof refundAmount !== 'number' || refundAmount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Valid refund amount is required',
        });
        return;
      }

      if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Refund reason is required',
        });
        return;
      }

      const sale = await SaleService.processRefund(id, tenantId, refundAmount, reason.trim(), req.user!.id);

      logger.info(`Processed refund for sale ${sale.saleNumber} in tenant ${tenantId}`);

      res.json({
        success: true,
        data: sale,
        message: 'Refund processed successfully',
      });
    } catch (error: any) {
      logger.error('Process refund error:', error);

      if (error.message === 'Sale not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('cannot process refund') || error.message.includes('invalid')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * @swagger
   * /sales/stats:
   *   get:
   *     summary: Get sales statistics for store
   *     description: Retrieve sales statistics and analytics for the current store
   *     tags: [Sales, Analytics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: startDate
   *         in: query
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date for statistics calculation (optional)
   *       - name: endDate
   *         in: query
   *         schema:
   *           type: string
   *           format: date
   *         description: End date for statistics calculation (optional)
   *     responses:
   *       200:
   *         description: Sales statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalSales:
   *                       type: number
   *                       example: 25000.50
   *                     totalOrders:
   *                       type: number
   *                       example: 250
   *                     averageOrderValue:
   *                       type: number
   *                       example: 100.00
   *                     topSellingProducts:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           productId:
   *                             type: string
   *                             format: uuid
   *                           productName:
   *                             type: string
   *                           totalSold:
   *                             type: number
   *                           revenue:
   *                             type: number
   *       400:
   *         description: Bad request - Invalid parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async getSalesStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const storeId = req.user?.storeId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      if (!storeId) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required',
        });
        return;
      }

      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await SaleService.getSalesStats(storeId, tenantId, start, end);

      logger.info(`Retrieved sales statistics for store ${storeId} in tenant ${tenantId}`);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get sales stats error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /sales/{id}:
   *   delete:
   *     summary: Delete a sale
   *     description: Permanently delete a sale (admin only, for data cleanup)
   *     tags: [Sales, Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Sale ID
   *     responses:
   *       200:
   *         description: Sale deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Sale deleted successfully"
   *       400:
   *         description: Bad request - Sale cannot be deleted
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Sale not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async deleteSale(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Sale ID is required',
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

      const deleted = await SaleService.deleteSale(id, tenantId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Sale not found',
        });
        return;
      }

      logger.info(`Deleted sale ${id} for tenant ${tenantId}`);

      res.json({
        success: true,
        message: 'Sale deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete sale error:', error);

      if (error.message === 'Sale not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Cannot delete completed or paid sale') {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * @swagger
   * /sales/tenant/stats:
   *   get:
   *     summary: Get tenant-wide sales statistics
   *     description: Retrieve aggregated sales statistics across all stores in the tenant
   *     tags: [Sales, Multi-store Analytics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: startDate
   *         in: query
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date for filtering statistics (optional)
   *       - name: endDate
   *         in: query
   *         schema:
   *           type: string
   *           format: date
   *         description: End date for filtering statistics (optional)
   *     responses:
   *       200:
   *         description: Tenant sales statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalSales:
   *                       type: number
   *                       example: 125000.50
   *                     totalOrders:
   *                       type: number
   *                       example: 1250
   *                     averageOrderValue:
   *                       type: number
   *                       example: 100.00
   *                     topSellingProducts:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           productId:
   *                             type: string
   *                             format: uuid
   *                           productName:
   *                             type: string
   *                           totalSold:
   *                             type: number
   *                           revenue:
   *                             type: number
   *       403:
   *         description: Forbidden - Requires analytics tenant-wide permission
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async getTenantSalesStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await SaleService.getTenantSalesStats(tenantId, start, end);

      logger.info(`Retrieved tenant-wide sales statistics for tenant ${tenantId}`);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get tenant sales stats error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /sales/tenant/compare:
   *   get:
   *     summary: Compare sales performance across stores
   *     description: Compare sales performance metrics between different stores in the tenant
   *     tags: [Sales, Multi-store Analytics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: startDate
   *         in: query
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date for comparison period (optional)
   *       - name: endDate
   *         in: query
   *         schema:
   *           type: string
   *           format: date
   *         description: End date for comparison period (optional)
   *     responses:
   *       200:
   *         description: Store sales comparison retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       storeId:
   *                         type: string
   *                         format: uuid
   *                       storeName:
   *                         type: string
   *                       totalSales:
   *                         type: number
   *                       totalOrders:
   *                         type: number
   *                       averageOrderValue:
   *                         type: number
   *                       growthRate:
   *                         type: number
   *       403:
   *         description: Forbidden - Requires analytics tenant-wide permission
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async compareStoreSales(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const comparison = await SaleService.compareStoreSales(tenantId, start, end);

      logger.info(`Retrieved store sales comparison for tenant ${tenantId}`);

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error: any) {
      logger.error('Compare store sales error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /sales/tenant/trends:
   *   get:
   *     summary: Get tenant-wide sales trends
   *     description: Retrieve sales trends and patterns across all stores in the tenant over time
   *     tags: [Sales, Multi-store Analytics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: startDate
   *         in: query
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date for trend analysis (optional)
   *       - name: endDate
   *         in: query
   *         schema:
   *           type: string
   *           format: date
   *         description: End date for trend analysis (optional)
   *     responses:
   *       200:
   *         description: Sales trends retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     dailyTrends:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           date:
   *                             type: string
   *                             format: date
   *                           totalSales:
   *                             type: number
   *                           totalOrders:
   *                             type: number
   *                     monthlyTrends:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           month:
   *                             type: string
   *                           year:
   *                             type: number
   *                           totalSales:
   *                             type: number
   *                           growthRate:
   *                             type: number
   *       403:
   *         description: Forbidden - Requires analytics tenant-wide permission
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async getTenantSalesTrends(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const trends = await SaleService.getTenantSalesTrends(tenantId, start, end);

      logger.info(`Retrieved tenant sales trends for tenant ${tenantId}`);

      res.json({
        success: true,
        data: trends,
      });
    } catch (error: any) {
      logger.error('Get tenant sales trends error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /sales/tenant/inventory-turnover:
   *   get:
   *     summary: Get inventory turnover metrics
   *     description: Calculate inventory turnover rates and efficiency metrics across all stores
   *     tags: [Sales, Multi-store Analytics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: period
   *         in: query
   *         schema:
   *           type: string
   *           enum: [monthly, quarterly, yearly]
   *           default: monthly
   *         description: Time period for turnover calculation
   *     responses:
   *       200:
   *         description: Inventory turnover metrics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     overallTurnover:
   *                       type: number
   *                       description: Overall inventory turnover rate
   *                     byStore:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           storeId:
   *                             type: string
   *                           storeName:
   *                             type: string
   *                           turnoverRate:
   *                             type: number
   *                           avgDaysInInventory:
   *                             type: number
   *                     byCategory:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           categoryId:
   *                             type: string
   *                           categoryName:
   *                             type: string
   *                           turnoverRate:
   *                             type: number
   *       403:
   *         description: Forbidden - Requires analytics tenant-wide permission
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async getInventoryTurnoverMetrics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const metrics = await SaleService.getInventoryTurnoverMetrics(tenantId, start, end);

      logger.info(`Retrieved inventory turnover metrics for tenant ${tenantId}`);

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      logger.error('Get inventory turnover metrics error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /sales/tenant/profitability:
   *   get:
   *     summary: Get store profitability metrics
   *     description: Calculate profitability metrics and margins across all stores in the tenant
   *     tags: [Sales, Multi-store Analytics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: startDate
   *         in: query
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date for profitability analysis (optional)
   *       - name: endDate
   *         in: query
   *         schema:
   *           type: string
   *           format: date
   *         description: End date for profitability analysis (optional)
   *     responses:
   *       200:
   *         description: Store profitability metrics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     overallProfitability:
   *                       type: object
   *                       properties:
   *                         totalRevenue:
   *                           type: number
   *                         totalCost:
   *                           type: number
   *                         netProfit:
   *                           type: number
   *                         profitMargin:
   *                           type: number
   *                     byStore:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           storeId:
   *                             type: string
   *                           storeName:
   *                             type: string
   *                           revenue:
   *                             type: number
   *                           cost:
   *                             type: number
   *                           profit:
   *                             type: number
   *                           margin:
   *                             type: number
   *                           rank:
   *                             type: number
   *       403:
   *         description: Forbidden - Requires analytics tenant-wide permission
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async getStoreProfitabilityMetrics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const metrics = await SaleService.getStoreProfitabilityMetrics(tenantId, start, end);

      logger.info(`Retrieved store profitability metrics for tenant ${tenantId}`);

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      logger.error('Get store profitability metrics error:', error);
      next(error);
    }
  }
}