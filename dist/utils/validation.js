"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePagination = exports.validateUUID = exports.validateCustomerUpdate = exports.validateCustomerCreation = exports.validatePaymentCreation = exports.validateOrderCreation = exports.validateProductUpdate = exports.validateProductCreation = exports.validateStoreUpdate = exports.validateStoreCreation = exports.validateTenantUpdate = exports.validateTenantCreation = exports.validateRefreshToken = exports.validateRegister = exports.validateLogin = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array(),
        });
        return;
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
exports.validateLogin = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
];
exports.validateRegister = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    (0, express_validator_1.body)('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('tenantId')
        .optional()
        .isUUID()
        .withMessage('Invalid tenant ID'),
];
exports.validateRefreshToken = [
    (0, express_validator_1.body)('refreshToken')
        .notEmpty()
        .withMessage('Refresh token is required'),
];
exports.validateTenantCreation = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Tenant name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('domain')
        .optional()
        .isFQDN()
        .withMessage('Invalid domain format'),
    (0, express_validator_1.body)('settings')
        .optional()
        .isObject()
        .withMessage('Settings must be a valid object'),
];
exports.validateTenantUpdate = [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid tenant ID'),
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Tenant name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('domain')
        .optional()
        .isFQDN()
        .withMessage('Invalid domain format'),
    (0, express_validator_1.body)('settings')
        .optional()
        .isObject()
        .withMessage('Settings must be a valid object'),
];
exports.validateStoreCreation = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Store name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('address')
        .optional()
        .isObject()
        .withMessage('Address must be a valid object'),
    (0, express_validator_1.body)('settings')
        .optional()
        .isObject()
        .withMessage('Settings must be a valid object'),
];
exports.validateStoreUpdate = [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid store ID'),
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Store name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('address')
        .optional()
        .isObject()
        .withMessage('Address must be a valid object'),
    (0, express_validator_1.body)('settings')
        .optional()
        .isObject()
        .withMessage('Settings must be a valid object'),
];
exports.validateProductCreation = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Product name must be between 1 and 200 characters'),
    (0, express_validator_1.body)('sku')
        .optional()
        .isLength({ max: 100 })
        .withMessage('SKU must be less than 100 characters'),
    (0, express_validator_1.body)('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    (0, express_validator_1.body)('categoryId')
        .optional()
        .isUUID()
        .withMessage('Invalid category ID'),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters'),
];
exports.validateProductUpdate = [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid product ID'),
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Product name must be between 1 and 200 characters'),
    (0, express_validator_1.body)('sku')
        .optional()
        .isLength({ max: 100 })
        .withMessage('SKU must be less than 100 characters'),
    (0, express_validator_1.body)('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    (0, express_validator_1.body)('categoryId')
        .optional()
        .isUUID()
        .withMessage('Invalid category ID'),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters'),
];
exports.validateOrderCreation = [
    (0, express_validator_1.body)('items')
        .isArray({ min: 1 })
        .withMessage('Order must contain at least one item'),
    (0, express_validator_1.body)('items.*.productId')
        .isUUID()
        .withMessage('Invalid product ID in items'),
    (0, express_validator_1.body)('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer'),
    (0, express_validator_1.body)('items.*.price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    (0, express_validator_1.body)('customerId')
        .optional()
        .isUUID()
        .withMessage('Invalid customer ID'),
    (0, express_validator_1.body)('discount')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Discount must be between 0 and 100'),
];
exports.validatePaymentCreation = [
    (0, express_validator_1.body)('orderId')
        .isUUID()
        .withMessage('Invalid order ID'),
    (0, express_validator_1.body)('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0'),
    (0, express_validator_1.body)('method')
        .isIn(['cash', 'card', 'bank_transfer', 'digital_wallet'])
        .withMessage('Invalid payment method'),
    (0, express_validator_1.body)('reference')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Reference must be less than 100 characters'),
];
exports.validateCustomerCreation = [
    (0, express_validator_1.body)('firstName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters'),
    (0, express_validator_1.body)('lastName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters'),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),
    (0, express_validator_1.body)('address')
        .optional()
        .isObject()
        .withMessage('Address must be a valid object'),
];
exports.validateCustomerUpdate = [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid customer ID'),
    (0, express_validator_1.body)('firstName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters'),
    (0, express_validator_1.body)('lastName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters'),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),
    (0, express_validator_1.body)('address')
        .optional()
        .isObject()
        .withMessage('Address must be a valid object'),
];
exports.validateUUID = [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid ID format'),
];
exports.validatePagination = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('sortBy')
        .optional()
        .isString()
        .withMessage('Sort by must be a string'),
    (0, express_validator_1.query)('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc'),
];
//# sourceMappingURL=validation.js.map