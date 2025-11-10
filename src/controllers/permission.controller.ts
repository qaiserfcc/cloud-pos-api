import { Request, Response, NextFunction } from 'express';
import PermissionService, { CreatePermissionData, UpdatePermissionData } from '../services/permission.service';
import { AuthRequest } from './auth.controller';
import logger from '../config/logger';

export class PermissionController {
  /**
   * Get all permissions for the tenant
   */
  static async getAllPermissions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const permissions = await PermissionService.getAllPermissions(tenantId);

      res.json({
        success: true,
        data: permissions,
      });
    } catch (error: any) {
      logger.error('Get all permissions error:', error);
      next(error);
    }
  }

  /**
   * Get permission by ID
   */
  static async getPermissionById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Permission ID is required',
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

      const permission = await PermissionService.getPermissionById(id, tenantId);

      if (!permission) {
        res.status(404).json({
          success: false,
          error: 'Permission not found',
        });
        return;
      }

      res.json({
        success: true,
        data: permission,
      });
    } catch (error: any) {
      logger.error('Get permission by ID error:', error);
      next(error);
    }
  }

  /**
   * Create a new permission
   */
  static async createPermission(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const permissionData: CreatePermissionData = {
        name: req.body.name,
        resource: req.body.resource,
        action: req.body.action,
        description: req.body.description,
      };

      const permission = await PermissionService.createPermission(tenantId, permissionData);

      res.status(201).json({
        success: true,
        data: permission,
        message: 'Permission created successfully',
      });
    } catch (error: any) {
      logger.error('Create permission error:', error);

      if (error.message === 'Permission name already exists for this tenant') {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Permission with this resource and action already exists for this tenant') {
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
   * Update permission
   */
  static async updatePermission(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Permission ID is required',
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

      const updateData: UpdatePermissionData = {
        name: req.body.name,
        resource: req.body.resource,
        action: req.body.action,
        description: req.body.description,
      };

      const permission = await PermissionService.updatePermission(id, tenantId, updateData);

      res.json({
        success: true,
        data: permission,
        message: 'Permission updated successfully',
      });
    } catch (error: any) {
      logger.error('Update permission error:', error);

      if (error.message === 'Permission not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Cannot update system permissions') {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Permission name already exists for this tenant') {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Permission with this resource and action already exists for this tenant') {
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
   * Delete permission
   */
  static async deletePermission(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Permission ID is required',
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

      await PermissionService.deletePermission(id, tenantId);

      res.json({
        success: true,
        message: 'Permission deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete permission error:', error);

      if (error.message === 'Permission not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Cannot delete system permissions') {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Cannot delete permission that is assigned to roles') {
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
   * Get permissions by resource
   */
  static async getPermissionsByResource(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { resource } = req.params;
      const tenantId = req.user?.tenantId;

      if (!resource) {
        res.status(400).json({
          success: false,
          error: 'Resource is required',
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

      const permissions = await PermissionService.getPermissionsByResource(tenantId, resource);

      res.json({
        success: true,
        data: permissions,
      });
    } catch (error: any) {
      logger.error('Get permissions by resource error:', error);
      next(error);
    }
  }

  /**
   * Get permission statistics
   */
  static async getPermissionStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const stats = await PermissionService.getPermissionStats(tenantId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get permission stats error:', error);
      next(error);
    }
  }

  /**
   * Check if permission name is available
   */
  static async checkPermissionNameAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.params;
      const { excludePermissionId } = req.query;
      const tenantId = req.user?.tenantId;

      if (!name) {
        res.status(400).json({
          success: false,
          error: 'Permission name is required',
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

      const available = await PermissionService.isPermissionNameAvailable(tenantId, name, excludePermissionId as string);

      res.json({
        success: true,
        data: {
          name,
          available,
        },
      });
    } catch (error: any) {
      logger.error('Check permission name availability error:', error);
      next(error);
    }
  }

  /**
   * Check if resource:action combination is available
   */
  static async checkResourceActionAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { resource, action } = req.params;
      const { excludePermissionId } = req.query;
      const tenantId = req.user?.tenantId;

      if (!resource || !action) {
        res.status(400).json({
          success: false,
          error: 'Resource and action are required',
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

      const available = await PermissionService.isResourceActionAvailable(tenantId, resource, action, excludePermissionId as string);

      res.json({
        success: true,
        data: {
          resource,
          action,
          available,
        },
      });
    } catch (error: any) {
      logger.error('Check resource:action availability error:', error);
      next(error);
    }
  }
}