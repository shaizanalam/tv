import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  // Redirect directly to Google Drive's high-speed usercontent CDN
  // Using 307 preserves byte-range requests from HTML5 video players
  const directUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;

  return NextResponse.redirect(directUrl, {
    status: 307,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
