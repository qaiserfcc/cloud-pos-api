"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const logger_1 = __importDefault(require("./config/logger"));
const PORT = process.env.PORT || 3000;
const startServer = async () => {
    try {
        await (0, database_1.testConnection)();
        logger_1.default.info('Database connection established successfully');
        const server = app_1.default.listen(PORT, () => {
            logger_1.default.info(`Server is running on port ${PORT}`);
            logger_1.default.info(`Health check available at http://localhost:${PORT}/health`);
            if (process.env.NODE_ENV !== 'production') {
                logger_1.default.info(`API documentation available at http://localhost:${PORT}/api-docs`);
            }
        });
        process.on('SIGTERM', () => {
            logger_1.default.info('SIGTERM received, shutting down gracefully');
            server.close(() => {
                logger_1.default.info('Process terminated');
                process.exit(0);
            });
        });
        process.on('SIGINT', () => {
            logger_1.default.info('SIGINT received, shutting down gracefully');
            server.close(() => {
                logger_1.default.info('Process terminated');
                process.exit(0);
            });
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map