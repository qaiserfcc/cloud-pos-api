"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || 'info';
const logFile = process.env.LOG_FILE || './logs/app.log';
const fs_1 = __importDefault(require("fs"));
const logDir = path_1.default.dirname(logFile);
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
}));
const transports = [
    new winston_1.default.transports.Console({
        level: logLevel,
        format: consoleFormat,
        handleExceptions: true,
        handleRejections: true,
    }),
];
if (isProduction) {
    transports.push(new winston_1.default.transports.File({
        filename: logFile,
        level: logLevel,
        format: logFormat,
        handleExceptions: true,
        handleRejections: true,
        maxsize: 5242880,
        maxFiles: 5,
    }));
}
const logger = winston_1.default.createLogger({
    level: logLevel,
    format: logFormat,
    transports,
    exitOnError: false,
});
exports.default = logger;
//# sourceMappingURL=logger.js.map