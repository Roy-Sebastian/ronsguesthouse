// Kode 4.5 - Potongan Kode Rate Limiting
// File: backend/src/middlewares/rate-limit.middleware.ts

import rateLimit from 'express-rate-limit';

/** Limit untuk endpoint publik/tanpa autentikasi */
export const publicRateLimiter = rateLimit({
  windowMs: 60_000,  // 1 menit
  max: 30,           // Maks 30 request per IP per menit
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

/** Limit ketat untuk akses booking tamu — mencegah brute force kode booking */
export const guestAccessRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5,                   // Maks 5 request per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' },
});

/** Limit lebih longgar untuk endpoint yang memerlukan autentikasi */
export const authRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
