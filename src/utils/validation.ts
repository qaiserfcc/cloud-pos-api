import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
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

// Auth validation rules
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

export const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('tenantId')
    .optional()
    .isUUID()
    .withMessage('Invalid tenant ID'),
];

export const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
];

// Tenant validation rules
export const validateTenantCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tenant name must be between 2 and 100 characters'),
  body('domain')
    .optional()
    .isFQDN()
    .withMessage('Invalid domain format'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be a valid object'),
];

export const validateTenantUpdate = [
  param('id')
    .isUUID()
    .withMessage('Invalid tenant ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tenant name must be between 2 and 100 characters'),
  body('domain')
    .optional()
    .isFQDN()
    .withMessage('Invalid domain format'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be a valid object'),
];

// Store validation rules
export const validateStoreCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Store name must be between 2 and 100 characters'),
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be a valid object'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be a valid object'),
];

export const validateStoreUpdate = [
  param('id')
    .isUUID()
    .withMessage('Invalid store ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Store name must be between 2 and 100 characters'),
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be a valid object'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be a valid object'),
];

// Product validation rules
export const validateProductCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Product name must be between 1 and 200 characters'),
  body('sku')
    .optional()
    .isLength({ max: 100 })
    .withMessage('SKU must be less than 100 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('Invalid category ID'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
];

export const validateProductUpdate = [
  param('id')
    .isUUID()
    .withMessage('Invalid product ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Product name must be between 1 and 200 characters'),
  body('sku')
    .optional()
    .isLength({ max: 100 })
    .withMessage('SKU must be less than 100 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('Invalid category ID'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
];

// Order validation rules
export const validateOrderCreation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.productId')
    .isUUID()
    .withMessage('Invalid product ID in items'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('items.*.price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('customerId')
    .optional()
    .isUUID()
    .withMessage('Invalid customer ID'),
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
];

// Payment validation rules
export const validatePaymentCreation = [
  body('orderId')
    .isUUID()
    .withMessage('Invalid order ID'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('method')
    .isIn(['cash', 'card', 'bank_transfer', 'digital_wallet'])
    .withMessage('Invalid payment method'),
  body('reference')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Reference must be less than 100 characters'),
];

// Customer validation rules
export const validateCustomerCreation = [
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be a valid object'),
];

export const validateCustomerUpdate = [
  param('id')
    .isUUID()
    .withMessage('Invalid customer ID'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be a valid object'),
];

// Common validation rules
export const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
];

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isString()
    .withMessage('Sort by must be a string'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];