import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import expressWinston from 'express-winston';
import rateLimit from 'express-rate-limit';

import logger from './config/logger';
import { testConnection } from './config/database';

// Import models and setup associations
// import { setupAssociations } from './models';
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

// Import middlewares
// import { errorHandler } from './middlewares/error.middleware';
// import { notFoundHandler } from './middlewares/notFound.middleware';

const app = express();

// Setup database associations
// setupAssociations();
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
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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
    openapi: '3.0.0',
    info: {
      title: 'Cloud POS API',
      version: '1.0.0',
      description: 'Multi-tenant Point-of-Sale API with offline synchronization',
      contact: {
        name: 'API Support',
        email: 'support@cloudpos.com',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        Sale: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            saleNumber: {
              type: 'string',
              example: 'SALE-2024-001',
            },
            tenantId: {
              type: 'string',
              format: 'uuid',
            },
            storeId: {
              type: 'string',
              format: 'uuid',
            },
            customerId: {
              type: 'string',
              format: 'uuid',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'cancelled'],
            },
            paymentStatus: {
              type: 'string',
              enum: ['pending', 'partial', 'paid', 'refunded'],
            },
            subtotal: {
              type: 'number',
              example: 100.00,
            },
            taxAmount: {
              type: 'number',
              example: 10.00,
            },
            discountAmount: {
              type: 'number',
              example: 5.00,
            },
            totalAmount: {
              type: 'number',
              example: 105.00,
            },
            paidAmount: {
              type: 'number',
              example: 105.00,
            },
            changeAmount: {
              type: 'number',
              example: 0.00,
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: {
                    type: 'string',
                    format: 'uuid',
                  },
                  productName: {
                    type: 'string',
                  },
                  quantity: {
                    type: 'number',
                  },
                  unitPrice: {
                    type: 'number',
                  },
                  discount: {
                    type: 'number',
                  },
                  total: {
                    type: 'number',
                  },
                },
              },
            },
            payments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  amount: {
                    type: 'number',
                  },
                  method: {
                    type: 'string',
                    enum: ['cash', 'card', 'bank_transfer', 'digital_wallet', 'other'],
                  },
                  reference: {
                    type: 'string',
                  },
                  processedAt: {
                    type: 'string',
                    format: 'date-time',
                  },
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  };

  const options = {
    swaggerDefinition,
    apis: [
      './src/controllers/*.ts',
      './src/routes/*.ts',
      './src/models/*.ts',
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