import { Model } from 'sequelize';
export interface PermissionAttributes {
    id: string;
    tenant_id: string;
    name: string;
    resource: string;
    action: string;
    description: string;
    is_system: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
}
export interface PermissionCreationAttributes extends Omit<PermissionAttributes, 'id' | 'created_at' | 'updated_at'> {
}
declare class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
    id: string;
    tenant_id: string;
    name: string;
    resource: string;
    action: string;
    description: string;
    is_system: boolean;
    readonly created_at: Date;
    readonly updated_at: Date;
    readonly deleted_at?: Date;
    readonly tenant?: any;
    readonly roles?: any[];
}
export default Permission;
//# sourceMappingURL=Permission.d.ts.map