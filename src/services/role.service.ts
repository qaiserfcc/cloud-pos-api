import { Op } from 'sequelize';
import { Role, Permission } from '../db/models';
import logger from '../config/logger';

export interface CreateRoleData {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface RoleWithPermissions {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  is_system: boolean;
  permissions: Array<{
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string;
  }>;
  created_at: Date;
  updated_at: Date;
}

class RoleService {
  /**
   * Get all roles for a tenant
   */
  async getAllRoles(tenantId: string): Promise<RoleWithPermissions[]> {
    try {
      const roles = await Role.findAll({
        where: {
          tenantId,
        },
        include: [
          {
            model: Permission,
            as: 'permissions',
            where: {
              tenantId,
            },
            required: false,
            through: {
              attributes: [],
            },
          },
        ],
        order: [['name', 'ASC']],
      });

      return roles.map(role => ({
        id: role.dataValues.id,
        tenantId: role.dataValues.tenantId,
        name: role.dataValues.name,
        description: role.dataValues.description,
        is_system: role.dataValues.is_system,
        permissions: role.permissions?.map(permission => ({
          id: permission.dataValues.id,
          name: permission.dataValues.name,
          resource: permission.dataValues.resource,
          action: permission.dataValues.action,
          description: permission.dataValues.description,
        })) || [],
        created_at: role.dataValues.created_at,
        updated_at: role.dataValues.updated_at,
      }));
    } catch (error) {
      logger.error('Error getting all roles:', error);
      throw new Error('Failed to retrieve roles');
    }
  }

  /**
   * Get role by ID with permissions
   */
  async getRoleById(roleId: string, tenantId: string): Promise<RoleWithPermissions | null> {
    try {
      const role = await Role.findOne({
        where: {
          id: roleId,
          tenantId,
        },
        include: [
          {
            model: Permission,
            as: 'permissions',
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

      if (!role) {
        return null;
      }

      return {
        id: role.dataValues.id,
        tenantId: role.dataValues.tenantId,
        name: role.dataValues.name,
        description: role.dataValues.description,
        is_system: role.dataValues.is_system,
        permissions: role.permissions?.map(permission => ({
          id: permission.dataValues.id,
          name: permission.dataValues.name,
          resource: permission.dataValues.resource,
          action: permission.dataValues.action,
          description: permission.dataValues.description,
        })) || [],
        created_at: role.dataValues.created_at,
        updated_at: role.dataValues.updated_at,
      };
    } catch (error) {
      logger.error('Error getting role by ID:', error);
      throw new Error('Failed to retrieve role');
    }
  }

  /**
   * Create a new role
   */
  async createRole(tenantId: string, data: CreateRoleData): Promise<RoleWithPermissions> {
    try {
      // Check if role name already exists for this tenant
      const existingRole = await Role.findOne({
        where: {
          tenantId,
          name: data.name,
        },
      });

      if (existingRole) {
        throw new Error('Role name already exists for this tenant');
      }

      // Create the role
      const role = await Role.create({
        tenantId,
        name: data.name,
        description: data.description || '',
        is_system: false,
      });

      // Assign permissions if provided
      if (data.permissionIds && data.permissionIds.length > 0) {
        const permissions = await Permission.findAll({
          where: {
            id: { [Op.in]: data.permissionIds },
            tenantId,
          },
        });

        if (permissions.length !== data.permissionIds.length) {
          // Some permissions not found, clean up and throw error
          await role.destroy();
          throw new Error('One or more permissions not found');
        }

        await (role as any).setPermissions(permissions);
      }

      // Return the created role with permissions
      return await this.getRoleById(role.dataValues.id, tenantId) as RoleWithPermissions;
    } catch (error) {
      logger.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Update an existing role
   */
  async updateRole(roleId: string, tenantId: string, data: UpdateRoleData): Promise<RoleWithPermissions> {
    try {
      const role = await Role.findOne({
        where: {
          id: roleId,
          tenantId,
        },
      });

      if (!role) {
        throw new Error('Role not found');
      }

      // Prevent updating system roles
      if (role.dataValues.is_system) {
        throw new Error('Cannot update system roles');
      }

      // Check name uniqueness if name is being updated
      if (data.name && data.name !== role.dataValues.name) {
        const existingRole = await Role.findOne({
          where: {
            tenantId,
            name: data.name,
            id: { [Op.ne]: roleId },
          },
        });

        if (existingRole) {
          throw new Error('Role name already exists for this tenant');
        }
      }

      // Update role fields
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;

      await role.update(updateData);

      // Update permissions if provided
      if (data.permissionIds !== undefined) {
        if (data.permissionIds.length === 0) {
          // Remove all permissions
          await (role as any).setPermissions([]);
        } else {
          // Set new permissions
          const permissions = await Permission.findAll({
            where: {
              id: { [Op.in]: data.permissionIds },
              tenantId,
            },
          });

          if (permissions.length !== data.permissionIds.length) {
            throw new Error('One or more permissions not found');
          }

          await (role as any).setPermissions(permissions);
        }
      }

      // Return updated role with permissions
      return await this.getRoleById(roleId, tenantId) as RoleWithPermissions;
    } catch (error) {
      logger.error('Error updating role:', error);
      throw error;
    }
  }

  /**
   * Delete a role (soft delete)
   */
  async deleteRole(roleId: string, tenantId: string): Promise<void> {
    try {
      const role = await Role.findOne({
        where: {
          id: roleId,
          tenantId,
        },
      });

      if (!role) {
        throw new Error('Role not found');
      }

      // Prevent deleting system roles
      if (role.dataValues.is_system) {
        throw new Error('Cannot delete system roles');
      }

      // Check if role is assigned to any users
      const userCount = await (role as any).countUsers();
      if (userCount > 0) {
        throw new Error('Cannot delete role that is assigned to users');
      }

      // Soft delete the role
      await role.destroy();
    } catch (error) {
      logger.error('Error deleting role:', error);
      throw error;
    }
  }

  /**
   * Get role statistics
   */
  async getRoleStats(tenantId: string): Promise<{
    totalRoles: number;
    systemRoles: number;
    customRoles: number;
  }> {
    try {
      const totalRoles = await Role.count({
        where: {
          tenantId,
        },
      });

      const systemRoles = await Role.count({
        where: {
          tenantId,
          is_system: true,
        },
      });

      return {
        totalRoles,
        systemRoles,
        customRoles: totalRoles - systemRoles,
      };
    } catch (error) {
      logger.error('Error getting role stats:', error);
      throw new Error('Failed to retrieve role statistics');
    }
  }

  /**
   * Check if role name is available
   */
  async isRoleNameAvailable(tenantId: string, name: string, excludeRoleId?: string): Promise<boolean> {
    try {
      const whereClause: any = {
        tenantId,
        name,
      };

      if (excludeRoleId) {
        whereClause.id = { [Op.ne]: excludeRoleId };
      }

      const existingRole = await Role.findOne({
        where: whereClause,
      });

      return !existingRole;
    } catch (error) {
      logger.error('Error checking role name availability:', error);
      throw new Error('Failed to check role name availability');
    }
  }

  /**
   * Get permissions for a specific role
   */
  async getRolePermissions(tenantId: string, roleId: string): Promise<any[]> {
    try {
      const role = await Role.findOne({
        where: {
          id: roleId,
          tenantId,
        },
        include: [
          {
            model: Permission,
            as: 'permissions',
            where: {
              tenantId,
            },
            required: false,
          },
        ],
      });

      if (!role) {
        throw new Error('Role not found');
      }

      return role.permissions || [];
    } catch (error) {
      logger.error('Error getting role permissions:', error);
      throw new Error('Failed to retrieve role permissions');
    }
  }

  /**
   * Assign permissions to a role
   */
  async assignPermissionsToRole(tenantId: string, roleId: string, permissionIds: string[]): Promise<void> {
    try {
      const role = await Role.findOne({
        where: {
          id: roleId,
          tenantId,
        },
      });

      if (!role) {
        throw new Error('Role not found');
      }

      if (role.dataValues.is_system) {
        throw new Error('Cannot modify permissions for system roles');
      }

      // Verify all permissions exist and belong to the tenant
      const permissions = await Permission.findAll({
        where: {
          id: { [Op.in]: permissionIds },
          tenantId,
        },
      });

      if (permissions.length !== permissionIds.length) {
        throw new Error('One or more permissions not found');
      }

      // Set the permissions for the role
      await (role as any).setPermissions(permissions);
    } catch (error) {
      logger.error('Error assigning permissions to role:', error);
      throw new Error('Failed to assign permissions to role');
    }
  }

  /**
   * Remove permission from a role
   */
  async removePermissionFromRole(tenantId: string, roleId: string, permissionId: string): Promise<void> {
    try {
      const role = await Role.findOne({
        where: {
          id: roleId,
          tenantId,
        },
      });

      if (!role) {
        throw new Error('Role not found');
      }

      if (role.dataValues.is_system) {
        throw new Error('Cannot modify permissions for system roles');
      }

      const permission = await Permission.findOne({
        where: {
          id: permissionId,
          tenantId,
        },
      });

      if (!permission) {
        throw new Error('Permission not found');
      }

      // Remove the permission from the role
      await (role as any).removePermission(permission);
    } catch (error) {
      logger.error('Error removing permission from role:', error);
      throw new Error('Failed to remove permission from role');
    }
  }
}

export default new RoleService();