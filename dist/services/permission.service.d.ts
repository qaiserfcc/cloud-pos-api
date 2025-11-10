export interface CreatePermissionData {
    name: string;
    resource: string;
    action: string;
    description?: string;
}
export interface UpdatePermissionData {
    name?: string;
    resource?: string;
    action?: string;
    description?: string;
}
export interface PermissionWithRoles {
    id: string;
    tenantId: string;
    name: string;
    resource: string;
    action: string;
    description: string;
    is_system: boolean;
    roles: Array<{
        id: string;
        name: string;
        description: string;
    }>;
    created_at: Date;
    updated_at: Date;
}
declare class PermissionService {
    getAllPermissions(tenantId: string): Promise<PermissionWithRoles[]>;
    getPermissionById(permissionId: string, tenantId: string): Promise<PermissionWithRoles | null>;
    createPermission(tenantId: string, data: CreatePermissionData): Promise<PermissionWithRoles>;
    updatePermission(permissionId: string, tenantId: string, data: UpdatePermissionData): Promise<PermissionWithRoles>;
    deletePermission(permissionId: string, tenantId: string): Promise<void>;
    getPermissionsByResource(tenantId: string, resource: string): Promise<PermissionWithRoles[]>;
    getPermissionStats(tenantId: string): Promise<{
        totalPermissions: number;
        systemPermissions: number;
        customPermissions: number;
        resources: string[];
    }>;
    isPermissionNameAvailable(tenantId: string, name: string, excludePermissionId?: string): Promise<boolean>;
    isResourceActionAvailable(tenantId: string, resource: string, action: string, excludePermissionId?: string): Promise<boolean>;
}
declare const _default: PermissionService;
export default _default;
//# sourceMappingURL=permission.service.d.ts.map