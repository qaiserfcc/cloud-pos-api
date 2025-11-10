import { Request, Response, NextFunction } from 'express';
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
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requirePermission: (permission: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireRole: (role: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireTenantAccess: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireStoreAccess: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map