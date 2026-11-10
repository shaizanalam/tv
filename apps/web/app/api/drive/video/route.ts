import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  // Forward client HTTP Range header directly to Google Drive
  const clientRange = req.headers.get('range') || 'bytes=0-';

  // Primary Direct Google CDN download URL with confirm=t (bypasses virus warnings)
  const downloadUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;

  try {
    let driveRes = await fetch(downloadUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Range: clientRange,
      },
    });

    let contentType = driveRes.headers.get('content-type') || 'video/mp4';

    // If Google returned an HTML confirmation screen (for files >100MB), extract uuid and re-fetch
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
        driveRes = await fetch(retryUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Range: clientRange,
          },
        });
        contentType = driveRes.headers.get('content-type') || 'video/mp4';
      }
    }

    // Safety fallback: if Google still returned HTML or failed, try alternative drive endpoint
    if (contentType.includes('text/html') || (!driveRes.ok && driveRes.status !== 206)) {
      const altUrl = `https://drive.google.com/uc?export=download&id=${id}&confirm=t`;
      driveRes = await fetch(altUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Range: clientRange,
        },
      });
      contentType = driveRes.headers.get('content-type') || 'video/mp4';
    }

    const responseHeaders = new Headers();
    responseHeaders.set(
      'Content-Type',
      contentType.includes('video/') ? contentType : 'video/mp4'
    );
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set(
      'Access-Control-Expose-Headers',
      'Content-Range, Content-Length, Accept-Ranges'
    );
    responseHeaders.set(
      'Cache-Control',
      'public, max-age=86400, stale-while-revalidate=604800'
    );

    const contentLength = driveRes.headers.get('content-length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    const contentRange = driveRes.headers.get('content-range');
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    // Return the live ReadableStream directly: zero memory overhead, instant time-to-first-frame (<1s), uninterrupted continuous playback
    return new Response(driveRes.body, {
      status: driveRes.status === 200 || driveRes.status === 206 ? driveRes.status : 206,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('Error streaming video from Drive CDN:', err);
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
