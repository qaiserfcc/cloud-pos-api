import 'dotenv/config';
import 'module-alias/register';

// Configure module aliases for runtime path resolution
import moduleAlias from 'module-alias';
moduleAlias.addAliases({
  '@': __dirname,
  '@/config': __dirname + '/config',
  '@/controllers': __dirname + '/controllers',
  '@/middlewares': __dirname + '/middlewares',
  '@/models': __dirname + '/db/models',
  '@/routes': __dirname + '/routes',
  '@/services': __dirname + '/services',
  '@/utils': __dirname + '/utils',
});

import app from './app';
import { testConnection } from './config/database';
import logger from './config/logger';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    logger.info('Database connection established successfully');

    // Start the server
    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`API documentation available at http://localhost:${PORT}/api-docs`);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();