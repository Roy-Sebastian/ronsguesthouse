// Kode 4.4 - Potongan Kode Pembuatan Session Token
// File: backend/src/config/auth.ts

export const auth = betterAuth({
  // ...
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 24 * 60 * 60, // Session berlaku 24 jam
    },
  },
  advanced: {
    // Mendukung cross-subdomain cookies untuk deployment multi-domain
    crossSubDomainCookies: {
      enabled: !!process.env.COOKIE_DOMAIN,
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
  },
  // ...
});

// Session divalidasi di setiap request melalui auth.middleware.ts:
const session = await auth.api.getSession({
  headers: normalizeHeaders(req.headers),
});

if (!session?.user) {
  return res.status(401).json({ error: 'Unauthorized' });
}

if (session.user.isActive === false) {
  return res.status(403).json({ error: 'Account is inactive' });
}
