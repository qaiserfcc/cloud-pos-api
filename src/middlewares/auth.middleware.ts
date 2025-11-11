import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, Role, Permission } from '../db/models';
import logger from '../config/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    storeId?: string;
    roles: string[];
    permissions: string[];
  };
  tenantId?: string;
  storeId?: string;
  userRoles?: string[];
  userPermissions?: string[];
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Get user with roles and permissions
    const user = await User.findByPk(decoded.id, {
      include: [
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
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: 'User account is deactivated',
      });
      return;
    }

    // Extract roles and permissions
    const roles = user.roles?.map((role: any) => role.name) || [];
    const permissions = user.roles?.flatMap((role: any) =>
      role.permissions?.map((perm: any) => `${perm.resource}:${perm.action}`) || []
    ) || [];

    // Set user context
    const userContext: {
      id: string;
      tenantId: string;
      storeId?: string;
      roles: string[];
      permissions: string[];
    } = {
      id: user.id,
      tenantId: user.tenantId,
      roles: roles as string[],
      permissions: permissions as string[],
    };

    if (user.defaultStoreId) {
      userContext.storeId = user.defaultStoreId;
    }

    req.user = userContext;

    req.tenantId = user.tenantId;
    req.userRoles = roles;
    req.userPermissions = permissions;

    // Set store context from header or user's default store
    const storeId = req.headers['x-store-id'] as string;
    if (storeId) {
      req.storeId = storeId;
      if (req.user) {
        req.user.storeId = storeId;
      }
    } else if (user.defaultStoreId) {
      req.storeId = user.defaultStoreId;
    }

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Superadmin bypass
    if (req.userRoles?.includes('Super Admin')) {
      return next();
    }

    if (!req.userPermissions?.includes(permission)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

export const requireRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Superadmin bypass
    if (req.userRoles?.includes('Super Admin')) {
      return next();
    }

    if (!req.userRoles?.includes(role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient role permissions',
      });
      return;
    }

    next();
  };
};

export const requireTenantAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // Superadmin bypass
  if (req.userRoles?.includes('Super Admin')) {
    return next();
  }

  if (!req.tenantId) {
    res.status(400).json({
      success: false,
      error: 'Tenant context required',
    });
    return;
  }

  next();
};

export const requireStoreAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // Superadmin bypass
  if (req.userRoles?.includes('Super Admin')) {
    return next();
  }

  if (!req.storeId) {
    res.status(400).json({
      success: false,
      error: 'Store context required',
    });
    return;
  }

  next();
};