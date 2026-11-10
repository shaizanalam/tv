import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';

export const dynamic = 'force-dynamic';

function getCacheDir(): string {
  const cachePath = path.join(process.cwd(), '.cache', 'videos');
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath, { recursive: true });
  }
  return cachePath;
}

// In-progress downloads map to avoid duplicate parallel downloads for the same file
const activeDownloads = new Map<string, Promise<void>>();

async function ensureFileCached(id: string): Promise<string | null> {
  const cacheDir = getCacheDir();
  const filePath = path.join(cacheDir, `${id}.mp4`);
  const tmpPath = path.join(cacheDir, `${id}.mp4.tmp`);

  if (fs.existsSync(filePath)) {
    return filePath;
  }

  // If already downloading, wait for it
  if (activeDownloads.has(id)) {
    await activeDownloads.get(id);
    return fs.existsSync(filePath) ? filePath : null;
  }

  const downloadPromise = (async () => {
    try {
      const downloadUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;
      let res = await fetch(downloadUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      let contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const html = await res.text();
        const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/);
        const uuid = uuidMatch ? uuidMatch[1] : '';
        if (uuid) {
          const retryUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t&uuid=${uuid}`;
          res = await fetch(retryUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
          });
        }
      }

      if (!res.ok || !res.body) {
        return;
      }

      const fileStream = fs.createWriteStream(tmpPath);
      // @ts-ignore
      const nodeStream = Readable.fromWeb(res.body);
      await new Promise<void>((resolve, reject) => {
        nodeStream.pipe(fileStream);
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
        nodeStream.on('error', reject);
      });

      if (fs.existsSync(tmpPath)) {
        fs.renameSync(tmpPath, filePath);
      }
    } catch (err) {
      console.warn('Background caching failed for', id, err);
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch {}
    } finally {
      activeDownloads.delete(id);
    }
  })();

  activeDownloads.set(id, downloadPromise);
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  const cacheDir = getCacheDir();
  const cachedFilePath = path.join(cacheDir, `${id}.mp4`);

  // Parse HTTP Range header from browser
  const rangeHeader = req.headers.get('range');

  // CASE 1: Video is cached on disk (Instant 100MB/s streaming, 0ms lag!)
  if (fs.existsSync(cachedFilePath)) {
    const stat = fs.statSync(cachedFilePath);
    const fileSize = stat.size;

    let start = 0;
    let end = fileSize - 1;

    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
      if (match) {
        start = parseInt(match[1], 10);
        if (match[2]) {
          end = parseInt(match[2], 10);
        }
      }
    }

    if (start >= fileSize) {
      return new Response(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${fileSize}` },
      });
    }

    const chunkSize = end - start + 1;
    const fileStream = fs.createReadStream(cachedFilePath, { start, end });
    // @ts-ignore
    const webStream = Readable.toWeb(fileStream);

    return new Response(webStream as unknown as BodyInit, {
      status: rangeHeader ? 206 : 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': String(chunkSize),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=604800, immutable',
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'HIT-DISK',
      },
    });
  }

  // CASE 2: Live Direct Proxy from Google Drive with client Range header
  const clientRange = req.headers.get('range') || 'bytes=0-';
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

  // Trigger background caching for preloaded videos
  ensureFileCached(id).catch(() => {});

  const cacheDir = getCacheDir();
  const cachedFilePath = path.join(cacheDir, `${id}.mp4`);
  if (fs.existsSync(cachedFilePath)) {
    const stat = fs.statSync(cachedFilePath);
    return new Response(null, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': String(stat.size),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=604800, immutable',
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'HIT-DISK',
      },
    });
  }

  const headers = new Headers();
  headers.set('Content-Type', 'video/mp4');
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=86400');
  headers.set('Access-Control-Allow-Origin', '*');
  return new Response(null, { status: 200, headers });
}
