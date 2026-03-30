"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.guestAccessRateLimiter = exports.publicRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/** Strict limit for public/unauthenticated endpoints */
exports.publicRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60_000, // 1 minute
    max: 30, // 30 requests per IP per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
});
/** Strict limit for guest booking access to prevent brute force */
exports.guestAccessRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' },
});
/** Relaxed limit for authenticated endpoints */
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
});
