import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any; // To allow accessing req.user
    }
  }
}

export {};
