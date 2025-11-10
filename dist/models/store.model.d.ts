import { Model, Optional } from 'sequelize';
export interface StoreAttributes {
    id: string;
    tenantId: string;
    name: string;
    address?: object;
    settings?: object;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface StoreCreationAttributes extends Optional<StoreAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class Store extends Model<StoreAttributes, StoreCreationAttributes> implements StoreAttributes {
    id: string;
    tenantId: string;
    name: string;
    address?: object;
    settings?: object;
    isActive: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly tenant?: any;
    readonly users?: any[];
    readonly products?: any[];
    readonly orders?: any[];
}
export default Store;
//# sourceMappingURL=store.model.d.ts.map