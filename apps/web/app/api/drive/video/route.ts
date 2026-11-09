import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  const range = req.headers.get('range');

  try {
    const directUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;

    const driveRes = await fetch(directUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...(range ? { Range: range } : {}),
      },
    });

    const contentType = driveRes.headers.get('content-type') || 'video/mp4';

    // If Google returned HTML (virus confirmation page for >100MB files)
    if (contentType.includes('text/html')) {
      const html = await driveRes.text();
      const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/);
      const confirmToken = uuidMatch ? uuidMatch[1] : 't';

      const confirmUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=${confirmToken}&uuid=${confirmToken}`;

      const streamRes = await fetch(confirmUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          ...(range ? { Range: range } : {}),
        },
      });

      const responseHeaders = new Headers();
      responseHeaders.set('Content-Type', streamRes.headers.get('content-type') || 'video/mp4');
      if (streamRes.headers.get('content-length')) {
        responseHeaders.set('Content-Length', streamRes.headers.get('content-length')!);
      }
      if (streamRes.headers.get('content-range')) {
        responseHeaders.set('Content-Range', streamRes.headers.get('content-range')!);
      }
      responseHeaders.set('Accept-Ranges', 'bytes');
      responseHeaders.set('Cache-Control', 'public, max-age=7200');

      return new Response(streamRes.body, {
        status: streamRes.status,
        headers: responseHeaders,
      });
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', contentType);
    if (driveRes.headers.get('content-length')) {
      responseHeaders.set('Content-Length', driveRes.headers.get('content-length')!);
    }
    if (driveRes.headers.get('content-range')) {
      responseHeaders.set('Content-Range', driveRes.headers.get('content-range')!);
    }
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=7200');

    return new Response(driveRes.body, {
      status: driveRes.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('Failed to proxy video stream:', err);
    return NextResponse.json({ error: 'Failed to stream video' }, { status: 502 });
  }
}
