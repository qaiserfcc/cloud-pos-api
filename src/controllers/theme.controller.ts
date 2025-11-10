import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import ThemeService, { ThemeCreationData } from '../services/theme.service';
import logger from '../config/logger';

export class ThemeController {
  static async createTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const tenantId = req.body.tenantId || (req as any).tenantId;
      const createdById = req.body.createdById || (req as any).userId;

      const themeData: ThemeCreationData = {
        tenantId,
        name: req.body.name,
        description: req.body.description,
        isDefault: req.body.isDefault,
        colors: req.body.colors,
        typography: req.body.typography,
        layout: req.body.layout,
        pages: req.body.pages,
        components: req.body.components,
        createdById,
      };

      // Validate theme data
      const validation = ThemeService.validateThemeData(themeData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid theme data',
          errors: validation.errors,
        });
        return;
      }

      const theme = await ThemeService.createTheme(themeData);

      res.status(201).json({
        success: true,
        message: 'Theme created successfully',
        data: {
          id: theme.dataValues.id,
          name: theme.dataValues.name,
          description: theme.dataValues.description,
          isDefault: theme.dataValues.isDefault,
          createdAt: theme.dataValues.createdAt,
        },
      });
    } catch (error) {
      logger.error('Error creating theme:', error);
      next(error);
    }
  }

  /**
   * Get all themes for a tenant
   */
  static async getThemes(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.query.tenantId as string || (req as any).tenantId;
      const filters: any = {};

      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }

      if (req.query.isDefault !== undefined) {
        filters.isDefault = req.query.isDefault === 'true';
      }

      if (req.query.createdById) {
        filters.createdById = req.query.createdById as string;
      }

      const themes = await ThemeService.getThemes(tenantId, filters);

      res.json({
        success: true,
        message: 'Themes retrieved successfully',
        data: themes,
      });
    } catch (error) {
      logger.error('Error getting themes:', error);
      next(error);
    }
  }

  /**
   * Get a specific theme
   */
  static async getTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { themeId } = req.params;
      if (!themeId) {
        res.status(400).json({
          success: false,
          message: 'Theme ID is required',
        });
        return;
      }
      const tenantId = req.query.tenantId as string || (req as any).tenantId;

      const theme = await ThemeService.getTheme(themeId, tenantId);

      if (!theme) {
        res.status(404).json({
          success: false,
          message: 'Theme not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Theme retrieved successfully',
        data: theme,
      });
    } catch (error) {
      logger.error('Error getting theme:', error);
      next(error);
    }
  }

  /**
   * Get the default theme for a tenant
   */
  static async getDefaultTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.query.tenantId as string || (req as any).tenantId;

      const theme = await ThemeService.getDefaultTheme(tenantId);

      if (!theme) {
        res.status(404).json({
          success: false,
          message: 'No default theme found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Default theme retrieved successfully',
        data: theme,
      });
    } catch (error) {
      logger.error('Error getting default theme:', error);
      next(error);
    }
  }

  /**
   * Update a theme
   */
  static async updateTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const { themeId } = req.params;
      if (!themeId) {
        res.status(400).json({
          success: false,
          message: 'Theme ID is required',
        });
        return;
      }
      const tenantId = req.body.tenantId || (req as any).tenantId;

      const updates: Partial<ThemeCreationData> = {
        name: req.body.name,
        description: req.body.description,
        isDefault: req.body.isDefault,
        colors: req.body.colors,
        typography: req.body.typography,
        layout: req.body.layout,
        pages: req.body.pages,
        components: req.body.components,
      };

      const theme = await ThemeService.updateTheme(themeId, tenantId, updates);

      res.json({
        success: true,
        message: 'Theme updated successfully',
        data: {
          id: theme.dataValues.id,
          name: theme.dataValues.name,
          description: theme.dataValues.description,
          isDefault: theme.dataValues.isDefault,
          updatedAt: theme.dataValues.updatedAt,
        },
      });
    } catch (error) {
      logger.error('Error updating theme:', error);
      if (error instanceof Error && error.message === 'Theme not found') {
        res.status(404).json({
          success: false,
          message: 'Theme not found',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Delete a theme
   */
  static async deleteTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { themeId } = req.params;
      if (!themeId) {
        res.status(400).json({
          success: false,
          message: 'Theme ID is required',
        });
        return;
      }
      const tenantId = req.query.tenantId as string || (req as any).tenantId;

      await ThemeService.deleteTheme(themeId, tenantId);

      res.json({
        success: true,
        message: 'Theme deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting theme:', error);
      if (error instanceof Error && error.message === 'Theme not found') {
        res.status(404).json({
          success: false,
          message: 'Theme not found',
        });
        return;
      }
      if (error instanceof Error && error.message === 'Cannot delete the default theme') {
        res.status(400).json({
          success: false,
          message: 'Cannot delete the default theme',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Set a theme as default
   */
  static async setDefaultTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { themeId } = req.params;
      if (!themeId) {
        res.status(400).json({
          success: false,
          message: 'Theme ID is required',
        });
        return;
      }
      const tenantId = req.body.tenantId || (req as any).tenantId;

      await ThemeService.setDefaultTheme(themeId, tenantId);

      res.json({
        success: true,
        message: 'Theme set as default successfully',
      });
    } catch (error) {
      logger.error('Error setting default theme:', error);
      if (error instanceof Error && error.message === 'Theme not found') {
        res.status(404).json({
          success: false,
          message: 'Theme not found',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Duplicate a theme
   */
  static async duplicateTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const { themeId } = req.params;
      if (!themeId) {
        res.status(400).json({
          success: false,
          message: 'Theme ID is required',
        });
        return;
      }
      const tenantId = req.body.tenantId || (req as any).tenantId;
      const createdById = req.body.createdById || (req as any).userId;
      const newName = req.body.newName;

      const duplicatedTheme = await ThemeService.duplicateTheme(themeId, tenantId, newName, createdById);

      res.status(201).json({
        success: true,
        message: 'Theme duplicated successfully',
        data: {
          id: duplicatedTheme.dataValues.id,
          name: duplicatedTheme.dataValues.name,
          description: duplicatedTheme.dataValues.description,
          createdAt: duplicatedTheme.dataValues.createdAt,
        },
      });
    } catch (error) {
      logger.error('Error duplicating theme:', error);
      if (error instanceof Error && error.message === 'Theme not found') {
        res.status(404).json({
          success: false,
          message: 'Theme not found',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Get theme statistics
   */
  static async getThemeStats(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.query.tenantId as string || (req as any).tenantId;

      const stats = await ThemeService.getThemeStats(tenantId);

      res.json({
        success: true,
        message: 'Theme statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting theme stats:', error);
      next(error);
    }
  }

  /**
   * Create default theme for a tenant
   */
  static async createDefaultTheme(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.body.tenantId || (req as any).tenantId;
      const createdById = req.body.createdById || (req as any).userId;

      const theme = await ThemeService.createDefaultTheme(tenantId, createdById);

      res.status(201).json({
        success: true,
        message: 'Default theme created successfully',
        data: {
          id: theme.dataValues.id,
          name: theme.dataValues.name,
          description: theme.dataValues.description,
          isDefault: theme.dataValues.isDefault,
          createdAt: theme.dataValues.createdAt,
        },
      });
    } catch (error) {
      logger.error('Error creating default theme:', error);
      next(error);
    }
  }
}

// Validation middleware
export const themeValidators = {
  createTheme: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('isDefault must be a boolean'),
    body('colors.*')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Colors must be valid hex colors'),
    body('pages.login.backgroundImage')
      .optional()
      .isURL()
      .withMessage('Background image must be a valid URL'),
  ],

  updateTheme: [
    param('themeId')
      .isUUID()
      .withMessage('Invalid theme ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('isDefault must be a boolean'),
    body('colors.*')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Colors must be valid hex colors'),
  ],

  getTheme: [
    param('themeId')
      .isUUID()
      .withMessage('Invalid theme ID'),
  ],

  deleteTheme: [
    param('themeId')
      .isUUID()
      .withMessage('Invalid theme ID'),
  ],

  setDefaultTheme: [
    param('themeId')
      .isUUID()
      .withMessage('Invalid theme ID'),
  ],

  duplicateTheme: [
    param('themeId')
      .isUUID()
      .withMessage('Invalid theme ID'),
    body('newName')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('New name must be between 1 and 100 characters'),
  ],
};

export default ThemeController;