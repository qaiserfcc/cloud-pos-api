import { Request, Response, NextFunction } from 'express';
import { CategoryService, CreateCategoryData, UpdateCategoryData } from '../services/category.service';
import { AuthRequest } from './auth.controller';
import logger from '../config/logger';

export class CategoryController {
  /**
   * Get all categories for a tenant (hierarchical)
   */
  static async getAllCategories(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const categories = await CategoryService.getAllCategories(tenantId);

      logger.info(`Retrieved ${categories.length} categories for tenant ${tenantId}`);

      res.json({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      logger.error('Get all categories error:', error);
      next(error);
    }
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Category ID is required',
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

      const category = await CategoryService.getCategoryById(id, tenantId);

      if (!category) {
        res.status(404).json({
          success: false,
          error: 'Category not found',
        });
        return;
      }

      logger.info(`Retrieved category ${category.name} for tenant ${tenantId}`);

      res.json({
        success: true,
        data: category,
      });
    } catch (error: any) {
      logger.error('Get category by ID error:', error);

      if (error.message === 'Category not found') {
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
   * Create a new category
   */
  static async createCategory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const categoryData: CreateCategoryData = {
        tenantId,
        ...req.body,
      };

      const category = await CategoryService.createCategory(categoryData);

      logger.info(`Created category ${category.name} for tenant ${tenantId}`);

      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully',
      });
    } catch (error: any) {
      logger.error('Create category error:', error);

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

      if (error.message.includes('circular reference')) {
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
   * Update category
   */
  static async updateCategory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Category ID is required',
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

      const updateData: UpdateCategoryData = req.body;

      const category = await CategoryService.updateCategory(id, tenantId, updateData);

      if (!category) {
        res.status(404).json({
          success: false,
          error: 'Category not found',
        });
        return;
      }

      logger.info(`Updated category ${category.name} for tenant ${tenantId}`);

      res.json({
        success: true,
        data: category,
        message: 'Category updated successfully',
      });
    } catch (error: any) {
      logger.error('Update category error:', error);

      if (error.message === 'Category not found') {
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

      if (error.message.includes('circular reference')) {
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
   * Delete category
   */
  static async deleteCategory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Category ID is required',
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

      await CategoryService.deleteCategory(id, tenantId);

      logger.info(`Deleted category ${id} for tenant ${tenantId}`);

      res.json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete category error:', error);

      if (error.message === 'Category not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Cannot delete category that has subcategories or products') {
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
   * Search categories
   */
  static async searchCategories(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

      const categories = await CategoryService.searchCategories(tenantId, query);

      logger.info(`Searched categories with query "${query}" for tenant ${tenantId}, found ${categories.length} results`);

      res.json({
        success: true,
        data: categories,
        message: 'Categories search completed successfully',
      });
    } catch (error: any) {
      logger.error('Search categories error:', error);
      next(error);
    }
  }

  /**
   * Update category sort orders
   */
  static async updateCategorySortOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { sortOrders } = req.body;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      if (!Array.isArray(sortOrders)) {
        res.status(400).json({
          success: false,
          error: 'sortOrders must be an array',
        });
        return;
      }

      await CategoryService.updateCategorySortOrders(tenantId, sortOrders);

      logger.info(`Updated category sort orders for tenant ${tenantId}`);

      res.json({
        success: true,
        message: 'Category sort orders updated successfully',
      });
    } catch (error: any) {
      logger.error('Update category sort orders error:', error);

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
   * Get category statistics
   */
  static async getCategoryStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const stats = await CategoryService.getCategoryStats(tenantId);

      logger.info(`Retrieved category statistics for tenant ${tenantId}`);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get category stats error:', error);
      next(error);
    }
  }
}