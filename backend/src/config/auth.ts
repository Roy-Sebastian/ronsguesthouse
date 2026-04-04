import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

import { prisma } from './prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
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
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.NODE_ENV === 'production' ? '.ronsguesthouse.com' : undefined,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
