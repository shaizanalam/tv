import { NextRequest, NextResponse } from 'next/server';

// Server-side in-memory cache for resolved Google CDN video URLs (6 hours TTL)
const videoUrlCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB chunk size for instantaneous buffering, zero lag, and deep playhead buffer

// Helper to resolve the authenticated direct Google CDN download URL (bypasses virus warnings)
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

  const rangeHeader = req.headers.get('range');

  try {
    // 1. Calculate byte range for instant delivery
    let start = 0;
    let end: number | undefined;

    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
      if (match) {
        start = parseInt(match[1], 10);
        if (match[2]) {
          end = parseInt(match[2], 10);
        }
      }
    }

    // Limit chunk size so video starts playing immediately and memory stays low
    const targetEnd =
      end !== undefined ? Math.min(end, start + CHUNK_SIZE - 1) : start + CHUNK_SIZE - 1;
    const driveRange = `bytes=${start}-${targetEnd}`;

    let targetUrl = await resolveGoogleDownloadUrl(id);

    let driveRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Range: driveRange,
      },
    });

    // If cached URL was invalidated by Google, force refresh and retry once
    if (driveRes.status === 403 || driveRes.status === 404) {
      targetUrl = await resolveGoogleDownloadUrl(id, true);
      driveRes = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Range: driveRange,
        },
      });
    }

    let contentType = driveRes.headers.get('content-type') || 'video/mp4';

    // If Google returned an HTML page unexpectedly, refresh token once
    if (contentType.includes('text/html')) {
      targetUrl = await resolveGoogleDownloadUrl(id, true);
      driveRes = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Range: driveRange,
        },
      });
      contentType = driveRes.headers.get('content-type') || 'video/mp4';
    }

    const contentRange = driveRes.headers.get('content-range');
    const buffer = await driveRes.arrayBuffer();

    const responseHeaders = new Headers();
    responseHeaders.set(
      'Content-Type',
      contentType.includes('video/') ? contentType : 'video/mp4'
    );
    responseHeaders.set('Content-Length', String(buffer.byteLength));
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=14400, must-revalidate');
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    } else {
      responseHeaders.set(
        'Content-Range',
        `bytes ${start}-${start + buffer.byteLength - 1}/${buffer.byteLength}`
      );
    }

    return new Response(buffer, {
      status: 206,
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
  headers.set('Cache-Control', 'public, max-age=14400');
  headers.set('Access-Control-Allow-Origin', '*');
  return new Response(null, { status: 200, headers });
}
