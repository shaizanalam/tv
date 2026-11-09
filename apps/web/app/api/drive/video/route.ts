import { NextRequest, NextResponse } from 'next/server';

const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB chunks for instant streaming without memory spikes

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  const rangeHeader = req.headers.get('range');

  try {
    // Determine the byte range to request from Drive
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
    const targetEnd = end !== undefined ? Math.min(end, start + CHUNK_SIZE - 1) : start + CHUNK_SIZE - 1;
    const driveRange = `bytes=${start}-${targetEnd}`;

    const directUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;

    let driveRes = await fetch(directUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Range: driveRange,
      },
    });

    let contentType = driveRes.headers.get('content-type') || 'video/mp4';

    // If Google returned HTML (virus confirmation page for >100MB files)
    if (contentType.includes('text/html')) {
      const html = await driveRes.text();
      const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/);
      const confirmToken = uuidMatch ? uuidMatch[1] : 't';

      const confirmUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=${confirmToken}&uuid=${confirmToken}`;

      driveRes = await fetch(confirmUrl, {
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
    responseHeaders.set('Content-Type', contentType.includes('video/') ? contentType : 'video/mp4');
    responseHeaders.set('Content-Length', String(buffer.byteLength));
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=7200, must-revalidate');

    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    } else {
      responseHeaders.set('Content-Range', `bytes ${start}-${start + buffer.byteLength - 1}/${buffer.byteLength}`);
    }

    return new Response(buffer, {
      status: 206,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('Failed to proxy video stream:', err);
    return NextResponse.json({ error: 'Failed to stream video' }, { status: 502 });
  }
}
