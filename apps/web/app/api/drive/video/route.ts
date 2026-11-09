import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  // Range request header from browser <video>
  const range = req.headers.get('range');

  try {
    // 1. Fetch initial download url from Google Drive
    const directUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;

    const driveRes = await fetch(directUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...(range ? { Range: range } : {}),
      },
    });

    const contentType = driveRes.headers.get('content-type') || 'video/mp4';

    // If Google returned HTML (virus warning page for large files), follow the confirmation form
    if (contentType.includes('text/html')) {
      const html = await driveRes.text();
      // Extract form action or uuid token
      const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/);
      const confirmToken = uuidMatch ? uuidMatch[1] : 't';
      
      const confirmUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=${confirmToken}&uuid=${confirmToken}`;

      const streamRes = await fetch(confirmUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          ...(range ? { Range: range } : {}),
        },
      });

      return new NextResponse(streamRes.body as any, {
        status: streamRes.status,
        headers: {
          'Content-Type': streamRes.headers.get('content-type') || 'video/mp4',
          'Content-Length': streamRes.headers.get('content-length') || '',
          'Content-Range': streamRes.headers.get('content-range') || '',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    return new NextResponse(driveRes.body as any, {
      status: driveRes.status,
      headers: {
        'Content-Type': contentType,
        'Content-Length': driveRes.headers.get('content-length') || '',
        'Content-Range': driveRes.headers.get('content-range') || '',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to stream video' }, { status: 502 });
  }
}
