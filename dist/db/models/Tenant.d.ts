import { Model } from 'sequelize';
export interface TenantAttributes {
    id: string;
    name: string;
    domain: string;
    settings: object;
    isActive?: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export interface TenantCreationAttributes extends Omit<TenantAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
declare class Tenant extends Model<TenantAttributes, TenantCreationAttributes> implements TenantAttributes {
    id: string;
    name: string;
    domain: string;
    settings: object;
    isActive: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    readonly stores?: any[];
    readonly users?: any[];
}
export default Tenant;
//# sourceMappingURL=Tenant.d.ts.map