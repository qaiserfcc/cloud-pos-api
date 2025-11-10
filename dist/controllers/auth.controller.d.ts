import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        tenantId: string;
        storeId?: string;
        roles: string[];
        permissions: string[];
    };
}
export declare class AuthController {
    static login(req: Request, res: Response, next: NextFunction): Promise<void>;
    static register(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static refreshToken(req: Request, res: Response, next: NextFunction): Promise<void>;
    static logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map