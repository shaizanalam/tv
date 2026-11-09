import { NextRequest, NextResponse } from 'next/server';

// Server-side in-memory cache for resolved direct Google CDN video URLs (6 hours TTL)
const videoUrlCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  // Check cached direct Google CDN URL
  const cached = videoUrlCache.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.redirect(cached.url, 307);
  }

  try {
    const probeUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download`;
    const res = await fetch(probeUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'manual',
    });

    let streamUrl = probeUrl;

    if (res.status === 302 || res.status === 303) {
      streamUrl = res.headers.get('location') || probeUrl;
    } else if (res.status === 200) {
      const html = await res.text();
      const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/);
      const confirmMatch = html.match(/name="confirm"\s+value="([^"]+)"/);
      const uuid = uuidMatch ? uuidMatch[1] : '';
      const confirm = confirmMatch ? confirmMatch[1] : 't';

      if (uuid) {
        streamUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=${confirm}&uuid=${uuid}`;
      } else {
        streamUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;
      }
    }

    // Cache the resolved direct Google CDN stream URL
    videoUrlCache.set(id, { url: streamUrl, timestamp: Date.now() });

    return NextResponse.redirect(streamUrl, 307);
  } catch (err) {
    console.error('Error resolving video stream URL:', err);
    // Reliable fallback
    const fallbackUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;
    return NextResponse.redirect(fallbackUrl, 307);
  }
}

