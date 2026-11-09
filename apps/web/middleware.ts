import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Static Next.js assets, favicons, static images
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Allow Public Auth Endpoints
  const isAuthApi = pathname.startsWith('/api/auth/');
  const isLoginPage = pathname === '/login';

  // Check session cookie
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (sessionCookie) {
    const { valid } = await verifySessionToken(sessionCookie);
    isAuthenticated = valid;
  }

  // If user is already authenticated and visits /login, redirect directly to TV gallery
  if (isLoginPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/tv', req.url));
    }
    return NextResponse.next();
  }

  // Allow auth API routes to execute
  if (isAuthApi) {
    return NextResponse.next();
  }

  // 3. Protected Route & API Enforcement
  if (!isAuthenticated) {
    // Media and Remote APIs return 401 JSON - ZERO Drive URLs or metadata exposed!
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Private family memories require authentication. Please log in first.',
        },
        { status: 401 }
      );
    }

    // Web Pages redirect to premium password entrance
    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/' && pathname !== '') {
      loginUrl.searchParams.set('from', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

