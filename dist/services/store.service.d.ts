import { Store } from '../db/models';
export interface CreateStoreData {
    tenantId: string;
    name: string;
    code: string;
    address: string;
    phone?: string;
    email?: string;
    settings?: object;
}
export interface UpdateStoreData {
    name?: string;
    code?: string;
    address?: string;
    phone?: string;
    email?: string;
    settings?: object;
    isActive?: boolean;
}
export interface StoreWithStats {
    id: string;
    tenantId: string;
    name: string;
    code: string;
    address: string;
    phone: string;
    email: string;
    settings: object;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    userCount: number;
    tenantName?: string;
}
export declare class StoreService {
    static getAllStores(tenantId: string): Promise<StoreWithStats[]>;
    static getStoreById(storeId: string, tenantId?: string): Promise<StoreWithStats | null>;
    static createStore(data: CreateStoreData): Promise<Store>;
    static updateStore(storeId: string, tenantId: string, data: UpdateStoreData): Promise<Store>;
    static deleteStore(storeId: string, tenantId: string): Promise<void>;
    static getStoreStats(storeId: string, tenantId: string): Promise<{
        userCount: number;
        activeUserCount: number;
        totalRevenue?: number;
    }>;
    static isStoreCodeAvailable(tenantId: string, code: string, excludeStoreId?: string): Promise<boolean>;
    static getStoresByTenant(tenantId: string): Promise<StoreWithStats[]>;
}
//# sourceMappingURL=store.service.d.ts.map