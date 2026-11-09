import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyAWGrfCCr7albM3lmCc937gx4uIphbpeKQ';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  // 1. Ultra-fast direct Google Edge CDN stream (sub-second response, hardware range decoding, Content-Length preserved)
  const streamUrl = `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${GOOGLE_CLIENT_KEY}`;

  return NextResponse.redirect(streamUrl, 307);
}
