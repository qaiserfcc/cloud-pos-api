import { User } from '../models/user.model';
export interface LoginResult {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        tenant: any;
        defaultStore?: any;
        roles: string[];
        permissions: string[];
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    };
}
export interface RegisterResult {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        tenant?: any;
    };
}
export declare class AuthService {
    static authenticateUser(email: string, password: string): Promise<LoginResult>;
    static registerUser(email: string, password: string, firstName: string, lastName: string, tenantId?: string): Promise<RegisterResult>;
    static refreshUserToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    }>;
    static getUserProfile(userId: string): Promise<any>;
    static findUserByRefreshToken(refreshToken: string): Promise<User | null>;
}
//# sourceMappingURL=auth.service.d.ts.map