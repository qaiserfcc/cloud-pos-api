import { Request, Response, NextFunction } from 'express';
import RoleService, { CreateRoleData, UpdateRoleData } from '../services/role.service';
import { AuthRequest } from './auth.controller';
import logger from '../config/logger';

export class RoleController {
  /**
   * Get all roles for the tenant
   */
  static async getAllRoles(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const roles = await RoleService.getAllRoles(tenantId);

      res.json({
        success: true,
        data: roles,
      });
    } catch (error: any) {
      logger.error('Get all roles error:', error);
      next(error);
    }
  }

  /**
   * Get role by ID
   */
  static async getRoleById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Role ID is required',
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

      const role = await RoleService.getRoleById(id, tenantId);

      if (!role) {
        res.status(404).json({
          success: false,
          error: 'Role not found',
        });
        return;
      }

      res.json({
        success: true,
        data: role,
      });
    } catch (error: any) {
      logger.error('Get role by ID error:', error);
      next(error);
    }
  }

  /**
   * Create a new role
   */
  static async createRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const roleData: CreateRoleData = {
        name: req.body.name,
        description: req.body.description,
        permissionIds: req.body.permissionIds,
      };

      const role = await RoleService.createRole(tenantId, roleData);

      res.status(201).json({
        success: true,
        data: role,
        message: 'Role created successfully',
      });
    } catch (error: any) {
      logger.error('Create role error:', error);

      if (error.message === 'Role name already exists for this tenant') {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'One or more permissions not found') {
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
   * Update role
   */
  static async updateRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Role ID is required',
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

      const updateData: UpdateRoleData = {
        name: req.body.name,
        description: req.body.description,
        permissionIds: req.body.permissionIds,
      };

      const role = await RoleService.updateRole(id, tenantId, updateData);

      res.json({
        success: true,
        data: role,
        message: 'Role updated successfully',
      });
    } catch (error: any) {
      logger.error('Update role error:', error);

      if (error.message === 'Role not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Cannot update system roles') {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Role name already exists for this tenant') {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'One or more permissions not found') {
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
   * Delete role
   */
  static async deleteRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Role ID is required',
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

      await RoleService.deleteRole(id, tenantId);

      res.json({
        success: true,
        message: 'Role deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete role error:', error);

      if (error.message === 'Role not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Cannot delete system roles') {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Cannot delete role that is assigned to users') {
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
   * Get role statistics
   */
  static async getRoleStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
        return;
      }

      const stats = await RoleService.getRoleStats(tenantId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get role stats error:', error);
      next(error);
    }
  }

  /**
   * Check if role name is available
   */
  static async checkRoleNameAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.params;
      const { excludeRoleId } = req.query;
      const tenantId = req.user?.tenantId;

      if (!name) {
        res.status(400).json({
          success: false,
          error: 'Role name is required',
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

      const available = await RoleService.isRoleNameAvailable(tenantId, name, excludeRoleId as string);

      res.json({
        success: true,
        data: {
          name,
          available,
        },
      });
    } catch (error: any) {
      logger.error('Check role name availability error:', error);
      next(error);
    }
  }

  /**
   * Get permissions for a role
   */
  static async getRolePermissions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!roleId) {
        res.status(400).json({
          success: false,
          error: 'Role ID is required',
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

      const permissions = await RoleService.getRolePermissions(tenantId, roleId);

      res.json({
        success: true,
        data: permissions,
      });
    } catch (error: any) {
      logger.error('Get role permissions error:', error);

      if (error.message === 'Role not found') {
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
   * Assign permissions to a role
   */
  static async assignPermissionsToRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;
      const { permissionIds } = req.body;
      const tenantId = req.user?.tenantId;

      if (!roleId) {
        res.status(400).json({
          success: false,
          error: 'Role ID is required',
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

      if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Permission IDs array is required',
        });
        return;
      }

      await RoleService.assignPermissionsToRole(tenantId, roleId, permissionIds);

      res.json({
        success: true,
        message: 'Permissions assigned to role successfully',
      });
    } catch (error: any) {
      logger.error('Assign permissions to role error:', error);

      if (error.message === 'Role not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Cannot modify permissions for system roles') {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'One or more permissions not found') {
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
   * Remove permission from a role
   */
  static async removePermissionFromRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId, permissionId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!roleId) {
        res.status(400).json({
          success: false,
          error: 'Role ID is required',
        });
        return;
      }

      if (!permissionId) {
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

      await RoleService.removePermissionFromRole(tenantId, roleId, permissionId);

      res.json({
        success: true,
        message: 'Permission removed from role successfully',
      });
    } catch (error: any) {
      logger.error('Remove permission from role error:', error);

      if (error.message === 'Role not found' || error.message === 'Permission not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Cannot modify permissions for system roles') {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }
}