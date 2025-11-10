import { Op } from 'sequelize';
import { Permission, Role } from '../db/models';
import logger from '../config/logger';

export interface CreatePermissionData {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface UpdatePermissionData {
  name?: string;
  resource?: string;
  action?: string;
  description?: string;
}

export interface PermissionWithRoles {
  id: string;
  tenantId: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  is_system: boolean;
  roles: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  created_at: Date;
  updated_at: Date;
}

class PermissionService {
  /**
   * Get all permissions for a tenant
   */
  async getAllPermissions(tenantId: string): Promise<PermissionWithRoles[]> {
    try {
      const permissions = await Permission.findAll({
        where: {
          tenantId,
        },
        include: [
          {
            model: Role,
            as: 'roles',
            where: {
              tenantId,
            },
            required: false,
            through: {
              attributes: [],
            },
          },
        ],
        order: [['resource', 'ASC'], ['action', 'ASC']],
      });

      return permissions.map(permission => ({
        id: permission.id,
        tenantId: permission.tenantId,
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
        is_system: permission.is_system,
        roles: permission.roles?.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description,
        })) || [],
        created_at: permission.created_at,
        updated_at: permission.updated_at,
      }));
    } catch (error) {
      logger.error('Error getting all permissions:', error);
      throw new Error('Failed to retrieve permissions');
    }
  }

  /**
   * Get permission by ID with roles
   */
  async getPermissionById(permissionId: string, tenantId: string): Promise<PermissionWithRoles | null> {
    try {
      const permission = await Permission.findOne({
        where: {
          id: permissionId,
          tenantId,
        },
        include: [
          {
            model: Role,
            as: 'roles',
            where: {
              tenantId,
            },
            required: false,
            through: {
              attributes: [],
            },
          },
        ],
      });

      if (!permission) {
        return null;
      }

      return {
        id: permission.id,
        tenantId: permission.tenantId,
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
        is_system: permission.is_system,
        roles: permission.roles?.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description,
        })) || [],
        created_at: permission.created_at,
        updated_at: permission.updated_at,
      };
    } catch (error) {
      logger.error('Error getting permission by ID:', error);
      throw new Error('Failed to retrieve permission');
    }
  }

  /**
   * Create a new permission
   */
  async createPermission(tenantId: string, data: CreatePermissionData): Promise<PermissionWithRoles> {
    try {
      // Check if permission name already exists for this tenant
      const existingPermission = await Permission.findOne({
        where: {
          tenantId,
          name: data.name,
        },
      });

      if (existingPermission) {
        throw new Error('Permission name already exists for this tenant');
      }

      // Check if resource:action combination already exists
      const existingResourceAction = await Permission.findOne({
        where: {
          tenantId,
          resource: data.resource,
          action: data.action,
        },
      });

      if (existingResourceAction) {
        throw new Error('Permission with this resource and action already exists for this tenant');
      }

      // Create the permission
      const permission = await Permission.create({
        tenantId,
        name: data.name,
        resource: data.resource,
        action: data.action,
        description: data.description || '',
        is_system: false,
      });

      // Return the created permission with roles
      return await this.getPermissionById(permission.id, tenantId) as PermissionWithRoles;
    } catch (error) {
      logger.error('Error creating permission:', error);
      throw error;
    }
  }

  /**
   * Update an existing permission
   */
  async updatePermission(permissionId: string, tenantId: string, data: UpdatePermissionData): Promise<PermissionWithRoles> {
    try {
      const permission = await Permission.findOne({
        where: {
          id: permissionId,
          tenantId,
        },
      });

      if (!permission) {
        throw new Error('Permission not found');
      }

      // Prevent updating system permissions
      if (permission.is_system) {
        throw new Error('Cannot update system permissions');
      }

      // Check name uniqueness if name is being updated
      if (data.name && data.name !== permission.name) {
        const existingPermission = await Permission.findOne({
          where: {
            tenantId,
            name: data.name,
            id: { [Op.ne]: permissionId },
          },
        });

        if (existingPermission) {
          throw new Error('Permission name already exists for this tenant');
        }
      }

      // Check resource:action uniqueness if either is being updated
      if ((data.resource || data.action) &&
          (data.resource !== permission.resource || data.action !== permission.action)) {
        const resource = data.resource || permission.resource;
        const action = data.action || permission.action;

        const existingResourceAction = await Permission.findOne({
          where: {
            tenantId,
            resource,
            action,
            id: { [Op.ne]: permissionId },
          },
        });

        if (existingResourceAction) {
          throw new Error('Permission with this resource and action already exists for this tenant');
        }
      }

      // Update permission fields
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.resource !== undefined) updateData.resource = data.resource;
      if (data.action !== undefined) updateData.action = data.action;
      if (data.description !== undefined) updateData.description = data.description;

      await permission.update(updateData);

      // Return updated permission with roles
      return await this.getPermissionById(permissionId, tenantId) as PermissionWithRoles;
    } catch (error) {
      logger.error('Error updating permission:', error);
      throw error;
    }
  }

  /**
   * Delete a permission (soft delete)
   */
  async deletePermission(permissionId: string, tenantId: string): Promise<void> {
    try {
      const permission = await Permission.findOne({
        where: {
          id: permissionId,
          tenantId,
        },
      });

      if (!permission) {
        throw new Error('Permission not found');
      }

      // Prevent deleting system permissions
      if (permission.is_system) {
        throw new Error('Cannot delete system permissions');
      }

      // Check if permission is assigned to any roles
      const roleCount = await (permission as any).countRoles();
      if (roleCount > 0) {
        throw new Error('Cannot delete permission that is assigned to roles');
      }

      // Soft delete the permission
      await permission.destroy();
    } catch (error) {
      logger.error('Error deleting permission:', error);
      throw error;
    }
  }

  /**
   * Get permissions by resource
   */
  async getPermissionsByResource(tenantId: string, resource: string): Promise<PermissionWithRoles[]> {
    try {
      const permissions = await Permission.findAll({
        where: {
          tenantId,
          resource,
        },
        include: [
          {
            model: Role,
            as: 'roles',
            where: {
              tenantId,
            },
            required: false,
            through: {
              attributes: [],
            },
          },
        ],
        order: [['action', 'ASC']],
      });

      return permissions.map(permission => ({
        id: permission.id,
        tenantId: permission.tenantId,
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
        is_system: permission.is_system,
        roles: permission.roles?.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description,
        })) || [],
        created_at: permission.created_at,
        updated_at: permission.updated_at,
      }));
    } catch (error) {
      logger.error('Error getting permissions by resource:', error);
      throw new Error('Failed to retrieve permissions by resource');
    }
  }

  /**
   * Get permission statistics
   */
  async getPermissionStats(tenantId: string): Promise<{
    totalPermissions: number;
    systemPermissions: number;
    customPermissions: number;
    resources: string[];
  }> {
    try {
      const totalPermissions = await Permission.count({
        where: {
          tenantId,
        },
      });

      const systemPermissions = await Permission.count({
        where: {
          tenantId,
          is_system: true,
        },
      });

      // Get distinct resources using a simpler approach
      const permissions = await Permission.findAll({
        where: {
          tenantId,
        },
        attributes: ['resource'],
        group: ['resource'],
        raw: true,
      });

      const resources = permissions.map(p => (p as any).resource);

      return {
        totalPermissions,
        systemPermissions,
        customPermissions: totalPermissions - systemPermissions,
        resources,
      };
    } catch (error) {
      logger.error('Error getting permission stats:', error);
      throw new Error('Failed to retrieve permission statistics');
    }
  }

  /**
   * Check if permission name is available
   */
  async isPermissionNameAvailable(tenantId: string, name: string, excludePermissionId?: string): Promise<boolean> {
    try {
      const whereClause: any = {
        tenantId,
        name,
      };

      if (excludePermissionId) {
        whereClause.id = { [Op.ne]: excludePermissionId };
      }

      const existingPermission = await Permission.findOne({
        where: whereClause,
      });

      return !existingPermission;
    } catch (error) {
      logger.error('Error checking permission name availability:', error);
      throw new Error('Failed to check permission name availability');
    }
  }

  /**
   * Check if resource:action combination is available
   */
  async isResourceActionAvailable(tenantId: string, resource: string, action: string, excludePermissionId?: string): Promise<boolean> {
    try {
      const whereClause: any = {
        tenantId,
        resource,
        action,
      };

      if (excludePermissionId) {
        whereClause.id = { [Op.ne]: excludePermissionId };
      }

      const existingPermission = await Permission.findOne({
        where: whereClause,
      });

      return !existingPermission;
    } catch (error) {
      logger.error('Error checking resource:action availability:', error);
      throw new Error('Failed to check resource:action availability');
    }
  }
}

export default new PermissionService();