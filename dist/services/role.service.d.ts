export interface CreateRoleData {
    name: string;
    description?: string;
    permissionIds?: string[];
}
export interface UpdateRoleData {
    name?: string;
    description?: string;
    permissionIds?: string[];
}
export interface RoleWithPermissions {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    is_system: boolean;
    permissions: Array<{
        id: string;
        name: string;
        resource: string;
        action: string;
        description: string;
    }>;
    created_at: Date;
    updated_at: Date;
}
declare class RoleService {
    getAllRoles(tenantId: string): Promise<RoleWithPermissions[]>;
    getRoleById(roleId: string, tenantId: string): Promise<RoleWithPermissions | null>;
    createRole(tenantId: string, data: CreateRoleData): Promise<RoleWithPermissions>;
    updateRole(roleId: string, tenantId: string, data: UpdateRoleData): Promise<RoleWithPermissions>;
    deleteRole(roleId: string, tenantId: string): Promise<void>;
    getRoleStats(tenantId: string): Promise<{
        totalRoles: number;
        systemRoles: number;
        customRoles: number;
    }>;
    isRoleNameAvailable(tenantId: string, name: string, excludeRoleId?: string): Promise<boolean>;
}
declare const _default: RoleService;
export default _default;
//# sourceMappingURL=role.service.d.ts.map