"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const prisma_1 = require("better-auth/adapters/prisma");
const prisma_2 = require("./prisma");
exports.auth = (0, better_auth_1.betterAuth)({
    database: (0, prisma_1.prismaAdapter)(prisma_2.prisma, {
        provider: 'postgresql',
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutes
        },
    },
    user: {
        additionalFields: {
            permissions: {
                type: 'string[]',
                required: false,
                defaultValue: [],
                input: false,
            },
            role: {
                type: 'string',
                required: false,
                defaultValue: 'guest',
                input: true,
            },
            phone: {
                type: 'string',
                required: false,
                input: true,
            },
            isActive: {
                type: 'boolean',
                required: false,
                defaultValue: true,
                input: false,
            },
        },
    },
    trustedOrigins: [
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
        process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
});
