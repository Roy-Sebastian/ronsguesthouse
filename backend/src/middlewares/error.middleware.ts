import { Request, Response, NextFunction } from 'express';

import { logger } from '../config/logger';
import { AppError } from '../utils/AppError';

export const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (typeof (err as any).statusCode === 'number') {
    // Handle Object.assign(new Error(...), { statusCode }) pattern used across services
    statusCode = (err as any).statusCode;
    message = err.message || message;
  } else {
    // Truly unexpected errors
    logger.error('Unhandled Error:', err);
    message = err.message || message;
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
