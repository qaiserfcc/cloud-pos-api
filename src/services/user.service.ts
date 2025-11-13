import { User, Tenant, Store, Role, Permission } from '../db/models';
import { hashPassword, comparePassword } from '../utils/jwt';
import { Op, literal } from 'sequelize';
import logger from '../config/logger';

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  defaultStoreId?: string;
  roleIds?: string[];
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  defaultStoreId?: string;
  isActive?: boolean;
  roleIds?: string[];
}

export interface UserWithAssociations {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | undefined;
  avatar: string | undefined;
  defaultStoreId: string | undefined;
  isActive: boolean;
  lastLoginAt: Date | undefined;
  tenantId: string;
  tenantName: string;
  defaultStoreName: string | undefined;
  roles: string[];
  roleCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  /**
   * Get all users for a tenant
   */
  static async getAllUsers(tenantId: string): Promise<UserWithAssociations[]> {
    const users = await User.findAll({
      where: { tenantId },
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['name'],
        },
        {
          model: Store,
          as: 'defaultStore',
          attributes: ['name'],
          required: false,
        },
        {
          model: Role,
          as: 'roles',
          required: false,
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return users.map(user => ({
      id: user.dataValues.id,
      email: user.dataValues.email,
      firstName: user.dataValues.firstName,
      lastName: user.dataValues.lastName,
      phone: user.dataValues.phone,
      avatar: user.dataValues.avatar,
      defaultStoreId: user.dataValues.defaultStoreId,
      isActive: user.dataValues.isActive,
      lastLoginAt: user.dataValues.lastLoginAt,
      tenantId: user.dataValues.tenantId,
      tenantName: (user as any).tenant?.name || '',
      defaultStoreName: (user as any).defaultStore?.name,
      roles: (user as any).roles?.map((role: any) => role.name) || [],
      roleCount: (user as any).roles?.length || 0,
      createdAt: user.dataValues.createdAt,
      updatedAt: user.dataValues.updatedAt,
    }));
  }

  /**
   * Get user by ID with associations
   */
  static async getUserById(userId: string, tenantId: string): Promise<UserWithAssociations> {
    const user = await User.findOne({
      where: { id: userId, tenantId },
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['name'],
        },
        {
          model: Store,
          as: 'defaultStore',
          attributes: ['name'],
          required: false,
        },
        {
          model: Role,
          as: 'roles',
          required: false,
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.dataValues.id,
      email: user.dataValues.email,
      firstName: user.dataValues.firstName,
      lastName: user.dataValues.lastName,
      phone: user.dataValues.phone,
      avatar: user.dataValues.avatar,
      defaultStoreId: user.dataValues.defaultStoreId,
      isActive: user.dataValues.isActive,
      lastLoginAt: user.dataValues.lastLoginAt,
      tenantId: user.dataValues.tenantId,
      tenantName: (user as any).tenant?.name || '',
      defaultStoreName: (user as any).defaultStore?.name,
      roles: (user as any).roles?.map((role: any) => role.name) || [],
      roleCount: (user as any).roles?.length || 0,
      createdAt: user.dataValues.createdAt,
      updatedAt: user.dataValues.updatedAt,
    };
  }

  /**
   * Create a new user
   */
  static async createUser(tenantId: string, userData: CreateUserData): Promise<UserWithAssociations> {
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Validate default store belongs to tenant if provided
    if (userData.defaultStoreId) {
      const store = await Store.findOne({
        where: { id: userData.defaultStoreId, tenantId }
      });
      if (!store) {
        throw new Error('Default store not found or does not belong to this tenant');
      }
    }

    // Validate roles belong to tenant if provided
    if (userData.roleIds && userData.roleIds.length > 0) {
      const roles = await Role.findAll({
        where: {
          id: { [Op.in]: userData.roleIds },
          tenantId
        } as any
      });
      if (roles.length !== userData.roleIds.length) {
        throw new Error('One or more roles not found or do not belong to this tenant');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const userDataToCreate: any = {
      tenantId,
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isActive: true,
      loginAttempts: 0,
    };

    // Add optional fields only if they are defined
    if (userData.phone !== undefined) userDataToCreate.phone = userData.phone;
    if (userData.avatar !== undefined) userDataToCreate.avatar = userData.avatar;
    if (userData.defaultStoreId !== undefined) userDataToCreate.defaultStoreId = userData.defaultStoreId;

    const user = await User.create(userDataToCreate);

    // Assign roles if provided
    if (userData.roleIds && userData.roleIds.length > 0) {
      const roles = await Role.findAll({
        where: {
          id: { [Op.in]: userData.roleIds },
          tenantId
        } as any
      });
      await (user as any).setRoles(roles);
    }

    logger.info(`User created: ${userData.email}`, {
      userId: user.dataValues.id,
      tenantId,
    });

    // Return user with associations
    return UserService.getUserById(user.dataValues.id, tenantId);
  }

  /**
   * Update user
   */
  static async updateUser(userId: string, tenantId: string, updateData: UpdateUserData): Promise<UserWithAssociations> {
    const user = await User.findOne({
      where: { id: userId, tenantId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Validate default store belongs to tenant if provided
    if (updateData.defaultStoreId) {
      const store = await Store.findOne({
        where: { id: updateData.defaultStoreId, tenantId }
      });
      if (!store) {
        throw new Error('Default store not found or does not belong to this tenant');
      }
    }

    // Validate roles belong to tenant if provided
    if (updateData.roleIds && updateData.roleIds.length > 0) {
      const roles = await Role.findAll({
        where: {
          id: { [Op.in]: updateData.roleIds },
          tenantId
        } as any
      });
      if (roles.length !== updateData.roleIds.length) {
        throw new Error('One or more roles not found or do not belong to this tenant');
      }
    }

    // Update user fields
    const updateFields: any = {};
    if (updateData.firstName !== undefined) updateFields.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) updateFields.lastName = updateData.lastName;
    if (updateData.phone !== undefined) updateFields.phone = updateData.phone;
    if (updateData.avatar !== undefined) updateFields.avatar = updateData.avatar;
    if (updateData.defaultStoreId !== undefined) updateFields.defaultStoreId = updateData.defaultStoreId;
    if (updateData.isActive !== undefined) updateFields.isActive = updateData.isActive;

    await user.update(updateFields);

    // Update roles if provided
    if (updateData.roleIds !== undefined) {
      if (updateData.roleIds.length > 0) {
        const roles = await Role.findAll({
          where: {
            id: { [Op.in]: updateData.roleIds },
            tenantId
          } as any
        });
        await (user as any).setRoles(roles);
      } else {
        await (user as any).setRoles([]);
      }
    }

    logger.info(`User updated: ${userId}`, {
      userId: user.dataValues.id,
      tenantId,
    });    // Return updated user
    return UserService.getUserById(userId, tenantId);
  }

  /**
   * Delete user (soft delete by setting isActive to false)
   */
  static async deleteUser(userId: string, tenantId: string): Promise<void> {
    const user = await User.findOne({
      where: { id: userId, tenantId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Soft delete by deactivating
    await user.update({ isActive: false });

    // Remove all role assignments
    await (user as any).setRoles([]);

    logger.info(`User deleted: ${user.dataValues.email}`, {
      userId,
      tenantId,
    });
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, tenantId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findOne({
      where: { id: userId, tenantId, isActive: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.dataValues.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await user.update({
      password: hashedNewPassword,
      passwordChangedAt: new Date(),
    });

    logger.info(`Password changed for user: ${user.dataValues.email}`, {
      userId,
      tenantId,
    });
  }

  /**
   * Reset user password (admin function)
   */
  static async resetPassword(userId: string, tenantId: string, newPassword: string): Promise<void> {
    const user = await User.findOne({
      where: { id: userId, tenantId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await user.update({
      password: hashedNewPassword,
      passwordChangedAt: new Date(),
      loginAttempts: 0,
    });

    // Clear lockout if it exists
    if (user.dataValues.lockoutUntil) {
      await user.update({ lockoutUntil: literal('NULL') });
    }

    logger.info(`Password reset for user: ${user.dataValues.email}`, {
      userId,
      tenantId,
    });
  }

  /**
   * Get user statistics for a tenant
   */
  static async getUserStats(tenantId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
  }> {
    const [totalResult, activeResult] = await Promise.all([
      User.count({ where: { tenantId } }),
      User.count({ where: { tenantId, isActive: true } }),
    ]);

    return {
      totalUsers: totalResult,
      activeUsers: activeResult,
      inactiveUsers: totalResult - activeResult,
    };
  }

  /**
   * Check if email is available
   */
  static async isEmailAvailable(email: string, excludeUserId?: string): Promise<boolean> {
    const whereClause: any = { email };
    if (excludeUserId) {
      whereClause.id = { [require('sequelize').Op.ne]: excludeUserId };
    }

    const existingUser = await User.findOne({ where: whereClause });
    return !existingUser;
  }

  /**
   * Get all roles assigned to a user
   */
  static async getUserRoles(userId: string, tenantId: string): Promise<any[]> {
    const user = await User.findOne({
      where: { id: userId, tenantId },
      include: [
        {
          model: Role,
          as: 'roles',
          required: false,
          attributes: ['id', 'name', 'description', 'is_system'],
          include: [
            {
              model: Permission,
              as: 'permissions',
              required: false,
              attributes: ['id', 'name', 'resource', 'action', 'description'],
            },
          ],
        },
      ],
    });

    if (!user) {
      throw new Error('User not found');
    }

    return (user as any).roles || [];
  }

  /**
   * Assign roles to a user
   */
  static async assignRolesToUser(userId: string, tenantId: string, roleIds: string[]): Promise<void> {
    const user = await User.findOne({
      where: { id: userId, tenantId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Validate all roles exist and belong to the tenant
    const roles = await Role.findAll({
      where: {
        id: { [Op.in]: roleIds },
        tenantId
      } as any
    });

    if (roles.length !== roleIds.length) {
      throw new Error('One or more roles not found or do not belong to this tenant');
    }

    // Get current roles to check for duplicates
    const currentRoles = await (user as any).getRoles();
    const currentRoleIds = currentRoles.map((role: any) => role.dataValues.id);
    const newRoleIds = roleIds.filter(roleId => !currentRoleIds.includes(roleId));

    if (newRoleIds.length === 0) {
      throw new Error('All specified roles are already assigned to this user');
    }

    // Add new roles
    const newRoles = roles.filter(role => newRoleIds.includes(role.dataValues.id));
    await (user as any).addRoles(newRoles);

    logger.info(`Roles assigned to user: ${user.dataValues.email}`, {
      userId,
      tenantId,
      roleIds: newRoleIds,
    });
  }

  /**
   * Remove a role from a user
   */
  static async removeRoleFromUser(userId: string, tenantId: string, roleId: string): Promise<void> {
    const user = await User.findOne({
      where: { id: userId, tenantId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if role exists and belongs to tenant
    const role = await Role.findOne({
      where: { id: roleId, tenantId }
    });

    if (!role) {
      throw new Error('Role not found or does not belong to this tenant');
    }

    // Check if user has this role
    const userRoles = await (user as any).getRoles();
    const hasRole = userRoles.some((userRole: any) => userRole.dataValues.id === roleId);

    if (!hasRole) {
      throw new Error('User does not have this role assigned');
    }

    // Remove the role
    await (user as any).removeRole(role);

    logger.info(`Role removed from user: ${user.dataValues.email}`, {
      userId,
      tenantId,
      roleId,
    });
  }
}