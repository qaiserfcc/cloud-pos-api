export declare const generateToken: (payload: object) => string;
export declare const verifyToken: (token: string) => any;
export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hashedPassword: string) => Promise<boolean>;
export declare const generateRefreshToken: (payload: object) => string;
export declare const verifyRefreshToken: (token: string) => any;
//# sourceMappingURL=jwt.d.ts.map