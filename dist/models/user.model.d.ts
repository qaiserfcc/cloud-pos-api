import { Model, Optional } from 'sequelize';
export interface UserAttributes {
    id: string;
    tenantId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    defaultStoreId?: string;
    isActive: boolean;
    lastLoginAt?: Date;
    passwordChangedAt?: Date;
    loginAttempts: number;
    lockoutUntil?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'loginAttempts'> {
}
export declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: string;
    tenantId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    defaultStoreId?: string;
    isActive: boolean;
    lastLoginAt?: Date;
    passwordChangedAt?: Date;
    loginAttempts: number;
    lockoutUntil?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly tenant?: any;
    readonly defaultStore?: any;
    readonly roles?: any[];
    readonly orders?: any[];
    readonly auditLogs?: any[];
}
export default User;
//# sourceMappingURL=user.model.d.ts.map