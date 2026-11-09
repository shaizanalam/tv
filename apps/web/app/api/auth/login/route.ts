import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { checkLoginRateLimit, recordFailedLogin, resetLoginRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  // Extract client IP address for brute-force rate limiting
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '127.0.0.1';

  // 1. Check rate limit
  const rateLimit = checkLoginRateLimit(ip);
  if (!rateLimit.allowed) {
    const mins = Math.ceil((rateLimit.retryAfterSeconds || 60) / 60);
    return NextResponse.json(
      {
        success: false,
        error: `Too many failed attempts. For family privacy, entrance is locked for ${mins} minutes.`,
        locked: true,
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { password, from } = body as { password?: string; from?: string };

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please enter the family password.' },
        { status: 400 }
      );
    }

    // 2. Server-side constant-time password check
    const isValid = await verifyPassword(password);

    if (!isValid) {
      const failStatus = recordFailedLogin(ip);
      if (failStatus.locked) {
        return NextResponse.json(
          {
            success: false,
            error: 'Too many incorrect attempts. Entrance locked for 15 minutes.',
            locked: true,
            retryAfterSeconds: failStatus.retryAfterSeconds,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `Incorrect password. Please try again. (${failStatus.remainingAttempts} attempts remaining)`,
          remainingAttempts: failStatus.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // 3. Password is valid: Clear rate limiter & generate signed session token
    resetLoginRateLimit(ip);
    const { token, exp } = await createSessionToken();
    const maxAgeSeconds = exp - Math.floor(Date.now() / 1000);

    // Sanitize destination redirect
    let destination = '/tv';
    if (from && from.startsWith('/') && !from.startsWith('//') && !from.includes('..')) {
      destination = from;
    }

    const response = NextResponse.json({
      success: true,
      redirect: destination,
    });

    // 4. Secure HttpOnly, Secure, SameSite=Lax cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds,
    });

    return response;
  } catch (err) {
    console.error('[AUTH LOGIN ERROR]', err);
    return NextResponse.json(
      { success: false, error: 'Authentication service error. Please try again.' },
      { status: 500 }
    );
  }
}

