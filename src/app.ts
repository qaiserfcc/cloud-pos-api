import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import expressWinston from 'express-winston';
import rateLimit from 'express-rate-limit';

import logger from './config/logger';
import { testConnection } from './config/database';

// Import models and setup associations
import { setupAssociations } from './models';

// Import routes
import authRoutes from './routes/auth.routes';
import tenantRoutes from './routes/tenant.routes';
import storeRoutes from './routes/store.routes';
// import userRoutes from './routes/user.routes';
// import productRoutes from './routes/product.routes';
// import inventoryRoutes from './routes/inventory.routes';
// import orderRoutes from './routes/order.routes';
// import paymentRoutes from './routes/payment.routes';
// import customerRoutes from './routes/customer.routes';
// import dashboardRoutes from './routes/dashboard.routes';
// import syncRoutes from './routes/sync.routes';
// import auditRoutes from './routes/audit.routes';
// import reportRoutes from './routes/report.routes';

// Import middlewares
// import { errorHandler } from './middlewares/error.middleware';
// import { notFoundHandler } from './middlewares/notFound.middleware';

const app = express();

// Setup database associations
setupAssociations();

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

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/stores', storeRoutes);
// app.use('/api/v1/users', userRoutes);
// app.use('/api/v1/products', productRoutes);
// app.use('/api/v1/inventory', inventoryRoutes);
// app.use('/api/v1/orders', orderRoutes);
// app.use('/api/v1/payments', paymentRoutes);
// app.use('/api/v1/customers', customerRoutes);
// app.use('/api/v1/dashboard', dashboardRoutes);
// app.use('/api/v1/sync', syncRoutes);
// app.use('/api/v1/audit', auditRoutes);
// app.use('/api/v1/reports', reportRoutes);

// Swagger documentation
if (process.env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerDocument = require('../swagger.json');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
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