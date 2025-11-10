import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.controller';
export declare class PermissionController {
    static getAllPermissions(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static getPermissionById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static createPermission(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static updatePermission(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static deletePermission(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static getPermissionsByResource(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static getPermissionStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static checkPermissionNameAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static checkResourceActionAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=permission.controller.d.ts.map