import { Request, Response, NextFunction } from 'express';
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateLogin: import("express-validator").ValidationChain[];
export declare const validateRegister: import("express-validator").ValidationChain[];
export declare const validateRefreshToken: import("express-validator").ValidationChain[];
export declare const validateTenantCreation: import("express-validator").ValidationChain[];
export declare const validateTenantUpdate: import("express-validator").ValidationChain[];
export declare const validateStoreCreation: import("express-validator").ValidationChain[];
export declare const validateStoreUpdate: import("express-validator").ValidationChain[];
export declare const validateProductCreation: import("express-validator").ValidationChain[];
export declare const validateProductUpdate: import("express-validator").ValidationChain[];
export declare const validateOrderCreation: import("express-validator").ValidationChain[];
export declare const validatePaymentCreation: import("express-validator").ValidationChain[];
export declare const validateCustomerCreation: import("express-validator").ValidationChain[];
export declare const validateCustomerUpdate: import("express-validator").ValidationChain[];
export declare const validateUUID: import("express-validator").ValidationChain[];
export declare const validatePagination: import("express-validator").ValidationChain[];
//# sourceMappingURL=validation.d.ts.map