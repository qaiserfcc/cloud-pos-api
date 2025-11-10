import { Request, Response, NextFunction } from 'express';
export declare class TenantController {
    static getAllTenants(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getTenantById(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createTenant(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updateTenant(req: Request, res: Response, next: NextFunction): Promise<void>;
    static deleteTenant(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getTenantStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    static checkDomainAvailability(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=tenant.controller.d.ts.map