import { Model } from 'sequelize';
export interface StoreAttributes {
    id: string;
    tenantId: string;
    name: string;
    code: string;
    address: string;
    phone?: string;
    email?: string;
    settings: object;
    isActive?: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export interface StoreCreationAttributes extends Omit<StoreAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
declare class Store extends Model<StoreAttributes, StoreCreationAttributes> implements StoreAttributes {
    id: string;
    tenantId: string;
    name: string;
    code: string;
    address: string;
    phone?: string;
    email?: string;
    settings: object;
    isActive: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    readonly tenant?: any;
    readonly storeUsers?: any[];
}
export default Store;
//# sourceMappingURL=Store.d.ts.map