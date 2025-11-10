import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare class StoreController {
    private storeService;
    constructor();
    getAllStores(req: AuthRequest, res: Response): Promise<void>;
    getStoreById(req: AuthRequest, res: Response): Promise<void>;
    createStore(req: AuthRequest, res: Response): Promise<void>;
    updateStore(req: AuthRequest, res: Response): Promise<void>;
    deleteStore(req: AuthRequest, res: Response): Promise<void>;
    getStoreStats(req: AuthRequest, res: Response): Promise<void>;
    checkStoreCode(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=store.controller.d.ts.map