import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import expressWinston from 'express-winston';
import rateLimit from 'express-rate-limit';

import logger from './config/logger';
import { testConnection } from './config/database';

// Import models and setup associations
import { setupDbAssociations } from './db/models';

// Import routes
import authRoutes from './routes/auth.routes';
import tenantRoutes from './routes/tenant.routes';
import storeRoutes from './routes/store.routes';
import userRoutes from './routes/user.routes';
import roleRoutes from './routes/role.routes';
import permissionRoutes from './routes/permission.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import inventoryRoutes from './routes/inventory.routes';
import inventoryTransferRoutes from './routes/inventory-transfer.routes';
import bulkInventoryTransferRoutes from './routes/bulk-inventory-transfer.routes';
import inventoryRegionRoutes from './routes/inventory-region.routes';
import saleRoutes from './routes/sale.routes';
import customerRoutes from './routes/customer.routes';
// import orderRoutes from './routes/order.routes';
// import paymentRoutes from './routes/payment.routes';
import dashboardRoutes from './routes/dashboard.routes';
// import syncRoutes from './routes/sync.routes';
import auditRoutes from './routes/audit.routes';
import approvalRoutes from './routes/approval.routes';
import reportRoutes from './routes/report.routes';
import reportTemplateRoutes from './routes/report-template.routes';
import automatedReorderRuleRoutes from './routes/automated-reorder-rule.routes';
import swaggerBaseDefinition from './swagger/swagger-definition.json';

// Import middlewares
// import { errorHandler } from './middlewares/error.middleware';
// import { notFoundHandler } from './middlewares/notFound.middleware';

const app = express();

// Setup database associations
setupDbAssociations();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',  // Backend/Swagger docs
      'http://localhost:4000',  // Frontend development
      'http://localhost:5173',  // Vite dev server (common React port)
      'http://localhost:8080',  // Alternative frontend port
      'http://127.0.0.1:3000',
      'http://127.0.0.1:4000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8080',
    ];

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow if CORS_ORIGIN environment variable matches
    if (process.env.CORS_ORIGIN && origin === process.env.CORS_ORIGIN) {
      return callback(null, true);
    }

    // In production, you might want to restrict this further
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error('Not allowed by CORS'));
    }

    // For development, allow localhost origins
    if (origin.match(/^http:\/\/localhost:\d+$/) || origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Store-ID'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
  ignoreRoute: (req, res) => false,
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Register routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/stores', storeRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/permissions', permissionRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/inventory-transfers', inventoryTransferRoutes);
app.use('/api/v1/bulk-transfers', bulkInventoryTransferRoutes);
app.use('/api/v1/inventory-regions', inventoryRegionRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/customers', customerRoutes);
// app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
// app.use('/api/v1/sync', syncRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/approvals', approvalRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/report-templates', reportTemplateRoutes);
app.use('/api/v1/automated-reorder-rules', automatedReorderRuleRoutes);

// Swagger documentation
if (process.env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerJSDoc = require('swagger-jsdoc');

  const swaggerDefinition = {
    ...swaggerBaseDefinition,
    servers: (swaggerBaseDefinition.servers || []).map((server, index) => {
      if (index === 0) {
        return {
          ...server,
          url: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
        };
      }
      return server;
    }),
  };

  const options = {
    definition: swaggerDefinition,
    apis: [
      './src/controllers/*.ts',
      './src/routes/*.ts',
      './src/db/models/*.ts',
    ],
  };

  const swaggerSpec = swaggerJSDoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Error logging
app.use(expressWinston.errorLogger({
  winstonInstance: logger,
}));

// 404 handler
// app.use(notFoundHandler);

// Global error handler
// app.use(errorHandler);

export default app;