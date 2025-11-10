import { Tenant } from '../db/models';
export interface CreateTenantData {
    name: string;
    domain: string;
    settings?: object;
}
export interface UpdateTenantData {
    name?: string;
    domain?: string;
    settings?: object;
    isActive?: boolean;
}
export interface TenantWithStats {
    id: string;
    name: string;
    domain: string;
    settings: object;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    storeCount: number;
    userCount: number;
}
export declare class TenantService {
    static getAllTenants(): Promise<TenantWithStats[]>;
    static getTenantById(tenantId: string): Promise<TenantWithStats | null>;
    static createTenant(data: CreateTenantData): Promise<Tenant>;
    static updateTenant(tenantId: string, data: UpdateTenantData): Promise<Tenant>;
    static deleteTenant(tenantId: string): Promise<void>;
    static getTenantStats(tenantId: string): Promise<{
        storeCount: number;
        userCount: number;
        activeUserCount: number;
        totalRevenue?: number;
    }>;
    static isDomainAvailable(domain: string, excludeTenantId?: string): Promise<boolean>;
}
//# sourceMappingURL=tenant.service.d.ts.map