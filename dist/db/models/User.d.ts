import { Model } from 'sequelize';
export interface UserAttributes {
    id: string;
    tenantId: string;
    defaultStoreId?: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    isActive: boolean;
    lastLoginAt?: Date;
    passwordChangedAt?: Date;
    loginAttempts: number;
    lockoutUntil?: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export interface UserCreationAttributes extends Omit<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: string;
    tenantId: string;
    defaultStoreId?: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    isActive: boolean;
    lastLoginAt?: Date;
    passwordChangedAt?: Date;
    loginAttempts: number;
    lockoutUntil?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    readonly tenant?: any;
    readonly defaultStore?: any;
    readonly roles?: any[];
}
export default User;
//# sourceMappingURL=User.d.ts.map