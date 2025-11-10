import { Model, Optional } from 'sequelize';
export interface RoleAttributes {
    id: string;
    name: string;
    description?: string;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
    id: string;
    name: string;
    description?: string;
    isSystem: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly users?: any[];
    readonly permissions?: any[];
}
export default Role;
//# sourceMappingURL=role.model.d.ts.map