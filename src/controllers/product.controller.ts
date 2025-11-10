import { Request, Response, NextFunction } from 'express';
import { ProductService, CreateProductData, UpdateProductData } from '../services/product.service';
import { AuthRequest } from './auth.controller';
import logger from '../config/logger';

export class ProductController {
  /**
   * Get all products for a tenant
   */
  static async getAllProducts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const products = await ProductService.getAllProducts(tenantId);

      logger.info(`Retrieved ${products.length} products for tenant ${tenantId}`);

      res.json({
        success: true,
        data: products,
      });
    } catch (error: any) {
      logger.error('Get all products error:', error);
      next(error);
    }
  }

  /**
   * Get product by ID
   */
  static async getProductById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required',
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

      const product = await ProductService.getProductById(id, tenantId);

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }

      logger.info(`Retrieved product ${product.name} (${product.sku}) for tenant ${tenantId}`);

      res.json({
        success: true,
        data: product,
      });
    } catch (error: any) {
      logger.error('Get product by ID error:', error);

      if (error.message === 'Product not found') {
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
   * Create a new product
   */
  static async createProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const productData: CreateProductData = {
        tenantId,
        ...req.body,
      };

      const product = await ProductService.createProduct(productData);

      logger.info(`Created product ${product.name} (${product.sku}) for tenant ${tenantId}`);

      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully',
      });
    } catch (error: any) {
      logger.error('Create product error:', error);

      if (error.message.includes('already exists')) {
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

  /**
   * Update product
   */
  static async updateProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required',
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

      const updateData: UpdateProductData = req.body;

      const product = await ProductService.updateProduct(id, tenantId, updateData);

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }

      logger.info(`Updated product ${product.name} (${product.sku}) for tenant ${tenantId}`);

      res.json({
        success: true,
        data: product,
        message: 'Product updated successfully',
      });
    } catch (error: any) {
      logger.error('Update product error:', error);

      if (error.message === 'Product not found') {
        res.status(404).json({
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

  /**
   * Delete product
   */
  static async deleteProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required',
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

      await ProductService.deleteProduct(id, tenantId);

      logger.info(`Deleted product ${id} for tenant ${tenantId}`);

      res.json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete product error:', error);

      if (error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Cannot delete product that has been sold') {
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
   * Search products
   */
  static async searchProducts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q: query } = req.query;
      const tenantId = req.user?.tenantId;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query is required',
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

      const products = await ProductService.searchProducts(tenantId, query);

      logger.info(`Searched products with query "${query}" for tenant ${tenantId}, found ${products.length} results`);

      res.json({
        success: true,
        data: products,
        message: 'Products search completed successfully',
      });
    } catch (error: any) {
      logger.error('Search products error:', error);
      next(error);
    }
  }

  /**
   * Get product statistics
   */
  static async getProductStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const stats = await ProductService.getProductStats(tenantId);

      logger.info(`Retrieved product statistics for tenant ${tenantId}`);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get product stats error:', error);
      next(error);
    }
  }
}