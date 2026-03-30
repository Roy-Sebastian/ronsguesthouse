import { NextRequest, NextResponse } from 'next/server';

const ROLE_REDIRECTS: Record<string, string> = {
  superadmin: '/superadmin',
  admin: '/admin',
  receptionist: '/receptionist',
  guest: '/guest',
};

const PROTECTED_PREFIXES = ['/superadmin', '/admin', '/receptionist', '/guest'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!isProtected) return NextResponse.next();

  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  let session = null;
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/get-session`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });
    if (response.ok) {
      session = await response.json();
    }
  } catch (e) {
    console.error('Proxy session fetch error:', e);
  }

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = (session as any)?.user?.role;
  const expectedPrefix = ROLE_REDIRECTS[userRole];

  if (expectedPrefix && !pathname.startsWith(expectedPrefix)) {
    return NextResponse.redirect(new URL(expectedPrefix, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/superadmin/:path*',
    '/admin/:path*',
    '/receptionist/:path*',
    '/guest/:path*',
  ],
};
