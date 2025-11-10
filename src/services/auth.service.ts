import { User } from '../models/user.model';
import { Tenant } from '../models/tenant.model';
import { Store } from '../models/store.model';
import { Role } from '../models/role.model';
import { Permission } from '../models/permission.model';
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
} from '../utils/jwt';
import logger from '../config/logger';

export interface LoginResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenant: any;
    defaultStore?: any;
    roles: string[];
    permissions: string[];
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export interface RegisterResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenant?: any;
  };
}

export class AuthService {
  /**
   * Authenticate user with email and password
   */
  static async authenticateUser(email: string, password: string): Promise<LoginResult> {
    // Find user with tenant and roles
    const user = await User.findOne({
      where: { email, isActive: true },
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'isActive'],
        },
        {
          model: Store,
          as: 'defaultStore',
          attributes: ['id', 'name', 'is_active'],
          required: false,
        },
        {
          model: Role,
          as: 'roles',
          required: false,
          include: [
            {
              model: Permission,
              as: 'permissions',
              required: false,
              attributes: ['id', 'resource', 'action'],
            },
          ],
        },
      ],
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is locked out
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new Error('Account is temporarily locked due to too many failed login attempts');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      // Increment login attempts
      user.loginAttempts += 1;

      // Lock account after 5 failed attempts for 30 minutes
      if (user.loginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }

      await user.save();
      throw new Error('Invalid credentials');
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lastLoginAt = new Date();
    await user.save();

    // Get user roles and permissions
    const roles = user.roles?.map((role: any) => role.name) || [];
    const permissions = user.roles?.flatMap((role: any) =>
      role.permissions?.map((perm: any) => `${perm.resource}:${perm.action}`) || []
    ) || [];

    // Generate tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      storeId: user.defaultStoreId,
      roles,
      permissions,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: user.id });

    logger.info(`User ${user.email} logged in successfully`, {
      userId: user.id,
      tenantId: user.tenantId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenant: user.tenant,
        defaultStore: user.defaultStore,
        roles,
        permissions,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      },
    };
  }

  /**
   * Register a new user
   */
  static async registerUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    tenantId?: string
  ): Promise<RegisterResult> {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      tenantId: tenantId!, // Will be validated by controller
      isActive: true,
      loginAttempts: 0,
    });

    // Get user with associations
    const userWithAssociations = await User.findByPk(user.id, {
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name'],
        },
      ],
    });

    logger.info(`New user registered: ${email}`, {
      userId: user.id,
      tenantId: user.tenantId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenant: userWithAssociations?.tenant,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshUserToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  }> {
    // This will be implemented when we have proper refresh token storage
    // For now, we'll verify the refresh token and generate new tokens
    throw new Error('Refresh token functionality not yet implemented');
  }

  /**
   * Get user profile with full details
   */
  static async getUserProfile(userId: string): Promise<any> {
    const user = await User.findOne({
      where: { id: userId, isActive: true },
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'is_active'],
        },
        {
          model: Store,
          as: 'defaultStore',
          attributes: ['id', 'name', 'is_active'],
          required: false,
        },
        {
          model: Role,
          as: 'roles',
          required: false,
          include: [
            {
              model: Permission,
              as: 'permissions',
              required: false,
              attributes: ['id', 'resource', 'action'],
            },
          ],
        },
      ],
    });

    if (!user) {
      throw new Error('User not found');
    }

    const roles = user.roles?.map((role: any) => role.name) || [];
    const permissions = user.roles?.flatMap((role: any) =>
      role.permissions?.map((perm: any) => `${perm.resource}:${perm.action}`) || []
    ) || [];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      tenant: user.tenant,
      defaultStore: user.defaultStore,
      roles,
      permissions,
      lastLoginAt: user.lastLoginAt,
      isActive: user.isActive,
    };
  }

  /**
   * Find user by refresh token (placeholder for future implementation)
   */
  static async findUserByRefreshToken(refreshToken: string): Promise<User | null> {
    // This will be implemented when we add refresh token storage
    // For now, return null
    return null;
  }
}