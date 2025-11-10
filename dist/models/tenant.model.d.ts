import { Model, Optional } from 'sequelize';
export interface TenantAttributes {
    id: string;
    name: string;
    domain?: string;
    settings?: object;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface TenantCreationAttributes extends Optional<TenantAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class Tenant extends Model<TenantAttributes, TenantCreationAttributes> implements TenantAttributes {
    id: string;
    name: string;
    domain?: string;
    settings?: object;
    isActive: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly stores?: any[];
    readonly users?: any[];
}
export default Tenant;
//# sourceMappingURL=tenant.model.d.ts.map