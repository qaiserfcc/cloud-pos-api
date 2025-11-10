export interface CreateUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    defaultStoreId?: string;
    roleIds?: string[];
}
export interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    defaultStoreId?: string;
    isActive?: boolean;
    roleIds?: string[];
}
export interface UserWithAssociations {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | undefined;
    avatar: string | undefined;
    defaultStoreId: string | undefined;
    isActive: boolean;
    lastLoginAt: Date | undefined;
    tenantId: string;
    tenantName: string;
    defaultStoreName: string | undefined;
    roles: string[];
    roleCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class UserService {
    static getAllUsers(tenantId: string): Promise<UserWithAssociations[]>;
    static getUserById(userId: string, tenantId: string): Promise<UserWithAssociations>;
    static createUser(tenantId: string, userData: CreateUserData): Promise<UserWithAssociations>;
    static updateUser(userId: string, tenantId: string, updateData: UpdateUserData): Promise<UserWithAssociations>;
    static deleteUser(userId: string, tenantId: string): Promise<void>;
    static changePassword(userId: string, tenantId: string, currentPassword: string, newPassword: string): Promise<void>;
    static resetPassword(userId: string, tenantId: string, newPassword: string): Promise<void>;
    static getUserStats(tenantId: string): Promise<{
        totalUsers: number;
        activeUsers: number;
        inactiveUsers: number;
    }>;
    static isEmailAvailable(email: string, excludeUserId?: string): Promise<boolean>;
}
//# sourceMappingURL=user.service.d.ts.map