import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

// Server-side in-memory cache for ultra-fast instant image responses
const imageCache = new Map<string, { buffer: Buffer; contentType: string; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days cache

export async function GET(req: NextRequest) {
  // Session Authentication Check
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Family authentication required' },
      { status: 401 }
    );
  }
  const { valid } = await verifySessionToken(sessionCookie);
  if (!valid) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or expired session' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const size = searchParams.get('sz') || '1200';

  if (!id) {
    return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
  }

  const cacheKey = `${id}_${size}`;

  // Check server memory cache first (instant 1ms delivery!)
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return new NextResponse(new Uint8Array(cached.buffer), {
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=604800, s-maxage=604800, immutable',
        'X-Proxy-Cache': 'HIT',
      },
    });
  }

  // Fast direct CDN URLs
  const sources = [
    `https://lh3.googleusercontent.com/d/${id}=s${size}`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`,
  ];

  for (const url of sources) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
        next: { revalidate: 86400 },
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        imageCache.set(cacheKey, {
          buffer,
          contentType,
          timestamp: Date.now(),
        });

        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=604800, s-maxage=604800, immutable',
            'X-Proxy-Cache': 'MISS',
          },
        });
      }
    } catch {
      // Try next CDN source
    }
  }

  return NextResponse.json({ error: 'Image not accessible' }, { status: 404 });
}
