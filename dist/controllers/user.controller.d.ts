import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.controller';
export declare class UserController {
    static getAllUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static getUserById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static createUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static resetPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static getUserStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static checkEmailAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=user.controller.d.ts.map