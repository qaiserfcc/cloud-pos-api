import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.controller';
export declare class RoleController {
    static getAllRoles(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static getRoleById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static createRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static updateRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static deleteRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static getRoleStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static checkRoleNameAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=role.controller.d.ts.map