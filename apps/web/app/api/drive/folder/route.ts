import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get('folder') || '';

  // Extract folder ID from URL, query parameter, or bare ID
  let folderId = input.trim();
  const folderMatch = folderId.match(/folders\/([a-zA-Z0-9_-]+)/);
  const idMatch = folderId.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (folderMatch) {
    folderId = folderMatch[1];
  } else if (idMatch) {
    folderId = idMatch[1];
  }

  // Strip any trailing query parameters or slashes
  folderId = folderId.split('?')[0].split('&')[0].replace(/\/$/, '');

  if (!folderId) {
    return NextResponse.json({ error: 'Folder ID or URL required' }, { status: 400 });
  }

  try {
    // Check if an API key or credentials are provided
    const apiKey = process.env.GOOGLE_API_KEY;

    if (apiKey) {
      const drive = google.drive({ version: 'v3', auth: apiKey });

      // List all images and videos inside the folder
      const res = await drive.files.list({
        q: `'${folderId}' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed = false`,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, thumbnailLink, imageMediaMetadata, videoMediaMetadata)',
        pageSize: 100,
      });

      const items = (res.data.files || []).map(f => ({
        id: f.id!,
        fileId: f.id!,
        name: f.name || 'Untitled',
        mimeType: f.mimeType || 'image/jpeg',
        size: parseInt(f.size || '0', 10),
        driveCreatedTime: f.createdTime || null,
        thumbnailLink: f.thumbnailLink ? f.thumbnailLink.replace(/=s\d+.*$/, '=s1920') : null,
        width: f.imageMediaMetadata?.width || f.videoMediaMetadata?.width || 1920,
        height: f.imageMediaMetadata?.height || f.videoMediaMetadata?.height || 1080,
        isFolder: false,
        trashed: false,
      }));

      return NextResponse.json({
        folderId,
        count: items.length,
        items,
      });
    }

    // If no API key configured yet, return a clean simulated response with sample files
    return NextResponse.json({
      folderId,
      notice: 'Demo mode active. Add GOOGLE_API_KEY to your .env to fetch live private Drive folders.',
      count: 4,
      items: [
        {
          id: 'p-1',
          fileId: 'photo-1',
          name: 'Mountain Sunrise.jpg',
          mimeType: 'image/jpeg',
          size: 4200000,
          driveCreatedTime: '2025-08-14T06:30:00Z',
          thumbnailLink: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&q=85',
          width: 3840,
          height: 2160,
          isFolder: false,
          trashed: false,
        },
        {
          id: 'p-2',
          fileId: 'photo-2',
          name: 'Family Celebration at Sunset.jpg',
          mimeType: 'image/jpeg',
          size: 3800000,
          driveCreatedTime: '2025-10-22T18:45:00Z',
          thumbnailLink: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1920&q=85',
          width: 3840,
          height: 2160,
          isFolder: false,
          trashed: false,
        },
        {
          id: 'p-3',
          fileId: 'photo-3',
          name: 'Misty Alpine Lake.jpg',
          mimeType: 'image/jpeg',
          size: 4500000,
          driveCreatedTime: '2025-11-04T09:15:00Z',
          thumbnailLink: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=85',
          width: 3840,
          height: 2160,
          isFolder: false,
          trashed: false,
        },
        {
          id: 'p-4',
          fileId: 'photo-4',
          name: 'Snowy Peak Panorama.jpg',
          mimeType: 'image/jpeg',
          size: 5100000,
          driveCreatedTime: '2025-12-25T14:20:00Z',
          thumbnailLink: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=85',
          width: 3840,
          height: 2160,
          isFolder: false,
          trashed: false,
        },
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

