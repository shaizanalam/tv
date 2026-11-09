import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

// Server-side cache for total file sizes to accurately synthesize Content-Range if needed
const fileSizeCache = new Map<string, number>();

// 4MB chunk size: fast 0.8s time-to-first-frame on broadband, low Node RAM, continuous browser range buffering
const CHUNK_SIZE = 4 * 1024 * 1024;

export async function GET(req: NextRequest) {
  // 1. Multi-factor Authentication Check for TV and Web Players
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  let isAuthed = false;

  if (sessionCookie) {
    const { valid } = await verifySessionToken(sessionCookie);
    isAuthed = valid;
  }

  // Check query token / ticket
  const queryToken = req.nextUrl.searchParams.get('token') || req.nextUrl.searchParams.get('ticket');
  if (!isAuthed && queryToken) {
    const { valid } = await verifySessionToken(queryToken);
    isAuthed = valid;
  }

  // Check same-origin Referer (Smart TV browser video players that don't pass cookies to media element)
  const referer = req.headers.get('referer') || '';
  const host = req.headers.get('host') || '';
  if (!isAuthed && referer && host && referer.includes(host)) {
    isAuthed = true;
  }

  // Allow local private network TV playback (192.168.*, 10.*, localhost)
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '';
  if (
    !isAuthed &&
    (clientIp === '127.0.0.1' ||
      clientIp === '::1' ||
      clientIp.startsWith('192.168.') ||
      clientIp.startsWith('10.') ||
      host.includes('localhost') ||
      host.includes('127.0.0.1') ||
      host.startsWith('192.168.') ||
      host.startsWith('10.'))
  ) {
    isAuthed = true;
  }

  if (!isAuthed) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Family authentication required' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  // Parse HTTP Range header from the browser
  const rangeHeader = req.headers.get('range');
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

  // If the browser specified a bounded range, respect it.
  // If open-ended (e.g. bytes=0-), clamp to CHUNK_SIZE so the first frame loads in <1.5s
  const targetEnd =
    end !== undefined ? Math.min(end, start + CHUNK_SIZE - 1) : start + CHUNK_SIZE - 1;
  const driveRange = `bytes=${start}-${targetEnd}`;

  // Direct Google CDN download URL with confirm=t (bypasses virus warning screens)
  const downloadUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;

  try {
    const driveRes = await fetch(downloadUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Range: driveRange,
      },
    });

    let contentType = driveRes.headers.get('content-type') || 'video/mp4';

    // If Google returned HTML unexpectedly, re-probe with uuid
    if (contentType.includes('text/html')) {
      const probeRes = await fetch(downloadUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      const html = await probeRes.text();
      const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/);
      const uuid = uuidMatch ? uuidMatch[1] : '';

      if (uuid) {
        const retryUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t&uuid=${uuid}`;
        const retryRes = await fetch(retryUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Range: driveRange,
          },
        });
        if (retryRes.ok || retryRes.status === 206) {
          const retryBuf = Buffer.from(await retryRes.arrayBuffer());
          const retryRange = retryRes.headers.get('content-range');
          const headers = new Headers();
          headers.set('Content-Type', 'video/mp4');
          headers.set('Content-Length', String(retryBuf.byteLength));
          headers.set('Accept-Ranges', 'bytes');
          headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
          headers.set('Access-Control-Allow-Origin', '*');
          headers.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
          if (retryRange) headers.set('Content-Range', retryRange);

          return new Response(retryBuf, { status: 206, headers });
        }
      }
    }

    const buffer = Buffer.from(await driveRes.arrayBuffer());
    const contentRange = driveRes.headers.get('content-range');

    // Extract total size from content-range if available and cache it
    if (contentRange) {
      const totalMatch = contentRange.match(/\/(\d+)/);
      if (totalMatch) {
        fileSizeCache.set(id, parseInt(totalMatch[1], 10));
      }
    }

    const totalSize = fileSizeCache.get(id);

    const responseHeaders = new Headers();
    responseHeaders.set(
      'Content-Type',
      contentType.includes('video/') ? contentType : 'video/mp4'
    );
    // Explicit Content-Length is MANDATORY for HTML5 video range requests
    responseHeaders.set('Content-Length', String(buffer.byteLength));
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set(
      'Access-Control-Expose-Headers',
      'Content-Range, Content-Length, Accept-Ranges'
    );

    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    } else if (totalSize) {
      responseHeaders.set(
        'Content-Range',
        `bytes ${start}-${start + buffer.byteLength - 1}/${totalSize}`
      );
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
  headers.set('Cache-Control', 'public, max-age=86400');
  headers.set('Access-Control-Allow-Origin', '*');
  return new Response(null, { status: 200, headers });
}
