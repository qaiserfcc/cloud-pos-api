import { Model, Optional } from 'sequelize';
export interface PermissionAttributes {
    id: string;
    name: string;
    resource: string;
    action: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface PermissionCreationAttributes extends Optional<PermissionAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
    id: string;
    name: string;
    resource: string;
    action: string;
    description?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly roles?: any[];
}
export default Permission;
//# sourceMappingURL=permission.model.d.ts.map