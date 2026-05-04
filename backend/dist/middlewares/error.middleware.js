"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const logger_1 = require("../config/logger");
const AppError_1 = require("../utils/AppError");
const globalErrorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    if (err instanceof AppError_1.AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }
    else if (typeof err.statusCode === 'number') {
        // Handle Object.assign(new Error(...), { statusCode }) pattern used across services
        statusCode = err.statusCode;
        message = err.message || message;
    }
    else {
        // Truly unexpected errors
        logger_1.logger.error('Unhandled Error:', err);
        message = err.message || message;
    }
    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.globalErrorHandler = globalErrorHandler;
