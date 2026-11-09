import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  const { valid, payload } = await verifySessionToken(token);
  return NextResponse.json({
    authenticated: valid,
    expiresAt: valid && payload ? payload.exp : null,
  });
}

