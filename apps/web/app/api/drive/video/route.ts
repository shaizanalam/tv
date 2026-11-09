import { NextRequest, NextResponse } from 'next/server';

// Server-side in-memory cache for resolved Google CDN video URLs (15 minutes TTL to avoid expired tokens/UUIDs)
const videoUrlCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

// Helper to resolve the direct Google CDN download URL (bypassing virus warnings and confirmation gates)
async function resolveGoogleDownloadUrl(fileId: string, forceFresh = false): Promise<string> {
  if (!forceFresh) {
    const cached = videoUrlCache.get(fileId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.url;
    }
  }

  const probeUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
  try {
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
        streamUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=${confirm}&uuid=${uuid}`;
      } else {
        streamUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
      }
    }

    videoUrlCache.set(fileId, { url: streamUrl, timestamp: Date.now() });
    return streamUrl;
  } catch {
    return `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  const clientRange = req.headers.get('range');
  const targetRange = clientRange || 'bytes=0-';

  try {
    let targetUrl = await resolveGoogleDownloadUrl(id);

    let driveRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Range: targetRange,
      },
    });

    // If cached URL was invalidated by Google or returned HTML, force refresh and retry immediately
    let contentType = driveRes.headers.get('content-type') || '';
    if (driveRes.status === 403 || driveRes.status === 404 || contentType.includes('text/html')) {
      targetUrl = await resolveGoogleDownloadUrl(id, true);
      driveRes = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Range: targetRange,
        },
      });
      contentType = driveRes.headers.get('content-type') || '';
    }

    // Safety guard: never serve HTML virus scan pages to the HTML5 video element
    if (contentType.includes('text/html') || !driveRes.ok && driveRes.status !== 206) {
      console.warn('Google Drive returned unexpected non-video response:', driveRes.status, contentType);
      return NextResponse.json(
        { error: 'Video stream temporarily unavailable from Google CDN' },
        { status: 502 }
      );
    }

    const responseHeaders = new Headers();
    responseHeaders.set(
      'Content-Type',
      contentType.includes('video/') ? contentType : 'video/mp4'
    );
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set(
      'Access-Control-Expose-Headers',
      'Content-Range, Content-Length, Accept-Ranges'
    );

    const contentLength = driveRes.headers.get('content-length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    const contentRange = driveRes.headers.get('content-range');
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    // Pass the native ReadableStream directly to client with zero intermediate buffering
    return new Response(driveRes.body, {
      status: driveRes.status === 200 || driveRes.status === 206 ? driveRes.status : 206,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('Error proxying video stream:', err);
    return NextResponse.json({ error: 'Failed to stream video' }, { status: 502 });
  }
}

export async function HEAD(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return new Response(null, { status: 400 });

  const headers = new Headers();
  headers.set('Content-Type', 'video/mp4');
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=86400');
  headers.set('Access-Control-Allow-Origin', '*');
  return new Response(null, { status: 200, headers });
}
