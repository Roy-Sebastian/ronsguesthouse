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
  } else {
    // Other unknown errors (e.g. Prisma errors, generic exceptions)
    logger.error('Unhandled Error:', err);
    message = err.message || message;
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
