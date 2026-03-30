import rateLimit from 'express-rate-limit';

/** Strict limit for public/unauthenticated endpoints */
export const publicRateLimiter = rateLimit({
  windowMs: 60_000,  // 1 minute
  max: 30,           // 30 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

/** Strict limit for guest booking access to prevent brute force */
export const guestAccessRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                   // 5 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' },
});

/** Relaxed limit for authenticated endpoints */
export const authRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
