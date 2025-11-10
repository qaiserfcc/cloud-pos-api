import { Model } from 'sequelize';
export interface RoleAttributes {
    id: string;
    tenant_id: string;
    name: string;
    description: string;
    is_system: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
}
export interface RoleCreationAttributes extends Omit<RoleAttributes, 'id' | 'created_at' | 'updated_at'> {
}
declare class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
    id: string;
    tenant_id: string;
    name: string;
    description: string;
    is_system: boolean;
    readonly created_at: Date;
    readonly updated_at: Date;
    readonly deleted_at?: Date;
    readonly tenant?: any;
    readonly users?: any[];
    readonly permissions?: any[];
}
export default Role;
//# sourceMappingURL=Role.d.ts.map