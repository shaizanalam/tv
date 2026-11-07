import { NextRequest, NextResponse } from 'next/server';

// Server-side in-memory cache for ultra-fast instant image responses
const imageCache = new Map<string, { buffer: Buffer; contentType: string; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
  }

  // Check server memory cache first (instant 1ms delivery!)
  const cached = imageCache.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return new NextResponse(new Uint8Array(cached.buffer), {
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, immutable',
        'X-Proxy-Cache': 'HIT',
      },
    });
  }

  // List of high-speed Google CDN URLs to try in order
  const sources = [
    `https://lh3.googleusercontent.com/d/${id}=s1200`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w1200`,
    `https://lh3.googleusercontent.com/d/${id}=s600`,
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

        // Store in memory cache
        imageCache.set(id, { buffer, contentType, timestamp: Date.now() });

        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400, s-maxage=86400, immutable',
            'X-Proxy-Cache': 'MISS',
          },
        });
      }
    } catch {}
  }

  return NextResponse.json({ error: 'Failed to retrieve image from Google Drive' }, { status: 502 });
}
