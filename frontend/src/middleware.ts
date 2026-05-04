import { NextRequest, NextResponse } from 'next/server';

const ROLE_REDIRECTS: Record<string, string> = {
  superadmin: '/superadmin',
  admin: '/admin',
  receptionist: '/receptionist',
};

const PROTECTED_PREFIXES = ['/superadmin', '/admin', '/receptionist'];

function getRoleFromSessionData(value: string): string | null {
  try {
    const json = JSON.parse(atob(value));
    const expiresAt: number = json?.expiresAt ?? 0;
    if (expiresAt < Date.now()) return null;
    return (json?.session?.user?.role as string) ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  if (!isProtected) return NextResponse.next();

  // Fast path: read role from session_data cookie (no HTTP call needed)
  const sessionDataCookie =
    request.cookies.get('__Secure-better-auth.session_data')?.value ??
    request.cookies.get('better-auth.session_data')?.value;

  let userRole = sessionDataCookie
    ? getRoleFromSessionData(sessionDataCookie)
    : null;

  // Fallback: server-side check when session_data expired or missing
  if (!userRole) {
    const hasToken =
      request.cookies.get('__Secure-better-auth.session_token') ??
      request.cookies.get('better-auth.session_token');

    if (!hasToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const BACKEND_URL =
      process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      'http://localhost:3001';

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/get-session`, {
        headers: { cookie: request.headers.get('cookie') || '' },
      });
      if (response.ok) {
        const session = await response.json();
        userRole = session?.user?.role;
      }
    } catch (e) {
      console.error('Session fetch error:', e);
    }
  }

  if (!userRole) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const expectedPrefix = ROLE_REDIRECTS[userRole];

  if (expectedPrefix && !pathname.startsWith(expectedPrefix)) {
    return NextResponse.redirect(new URL(expectedPrefix, request.url));
  }

  if (!expectedPrefix) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/superadmin/:path*',
    '/admin/:path*',
    '/receptionist/:path*',
  ],
};
