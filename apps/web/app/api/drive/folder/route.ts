import { NextRequest, NextResponse } from 'next/server';

export interface DriveFolderItem {
  id: string;
  fileId: string;
  name: string;
  mimeType: string;
  size?: number;
  thumbnailLink: string;
  previewUrl: string;
  width?: number;
  height?: number;
  isFolder: boolean;
  trashed: boolean;
}

export interface DriveSubfolder {
  id: string;
  folderId: string;
  title: string;
  coverThumbnailUrl: string;
  photoCount?: number;
}

// Known high-res real cover images for the user's trip folders
const KNOWN_COVERS: Record<string, string> = {
  '17rjsvO8qP2dAime91juLLN1q68ADloZS': 'https://lh3.googleusercontent.com/d/1GDyj4qioexLHWgWOow3johLzVJrt7DBi=s1000', // Ajmer Agra 25
  '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za': 'https://lh3.googleusercontent.com/d/1DOaXMzGoetWQVf4zaqTXlCnYjZQeQXyz=s1000', // Dubai 2025
  '1IBD6D1qvMTG90WueDHNhiJc6K63hRdDp': 'https://lh3.googleusercontent.com/d/1IYhsZ6Y1jbaBolp4_U38QfDzaRUnwz6Z=s1000', // GoPro-Exports
  '15lQOoy7sjDZvTGB1MP9SI1v-2hMLo-Gs': 'https://lh3.googleusercontent.com/d/1GXYdHksps-F99oQpQHIwPUiEb8eg2XO0=s1000', // Meccah & Madina
  '1OcPf822VdQ2VqqdfPuIap_2V_jJnByzC': 'https://lh3.googleusercontent.com/d/17Z3gnh-D9jrhm94oLyJySnX4k0bA-t91=s1000', // Pachmari
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get('folder') || '1qCPS0mAatpr5Yil7t2Zc7hcO9Lbt2ufi';

  // Extract folder ID
  let folderId = input.trim();
  const folderMatch = folderId.match(/folders\/([a-zA-Z0-9_-]+)/);
  const idMatch = folderId.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (folderMatch) {
    folderId = folderMatch[1];
  } else if (idMatch) {
    folderId = idMatch[1];
  }

  folderId = folderId.split('?')[0].split('&')[0].replace(/\/$/, '');

  if (!folderId) {
    return NextResponse.json({ error: 'Folder ID or URL required' }, { status: 400 });
  }

  try {
    const driveUrl = `https://drive.google.com/drive/folders/${folderId}`;
    const driveRes = await fetch(driveUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      next: { revalidate: 300 },
    });

    if (!driveRes.ok) {
      throw new Error(`Google Drive returned status: ${driveRes.status}`);
    }

    const html = await driveRes.text();

    // 1. Extract Folder Title
    let folderTitle = 'Trip';
    const titleMatch = html.match(/<title>([^<]+)–\s*Google\s*Drive<\/title>/i);
    if (titleMatch) {
      folderTitle = titleMatch[1].trim();
    }

    // 2. Extract Subfolders
    const subfolderMatches = [
      ...html.matchAll(
        /\[\[null,"([a-zA-Z0-9_-]{25,45})"\][\s\S]*?"application\/vnd\.google-apps\.folder"[\s\S]*?\[\[\["([^"]+)",null,1\]\]\]/g
      ),
    ];

    const subfolders: DriveSubfolder[] = [];
    const seenFolders = new Set<string>();

    for (const m of subfolderMatches) {
      const id = m[1];
      let title = m[2];
      try {
        title = JSON.parse(`"${title}"`);
      } catch {}

      if (!seenFolders.has(id)) {
        seenFolders.add(id);
        const cover = KNOWN_COVERS[id] || `https://lh3.googleusercontent.com/d/${id}=s800`;
        subfolders.push({
          id,
          folderId: id,
          title,
          coverThumbnailUrl: cover,
          photoCount: 50,
        });
      }
    }

    // 3. Extract Files (Images & Videos)
    const fileMatches = [
      ...html.matchAll(
        /\[\[null,"([a-zA-Z0-9_-]{25,45})"\][^\]]*?"(image\/[^"]+|video\/[^"]+)"[\s\S]*?\[\[\["([^"]+\.[a-zA-Z0-9]{3,4})",null,1\]\]\]/g
      ),
    ];

    const items: DriveFolderItem[] = [];
    const seenFiles = new Set<string>();

    for (const m of fileMatches) {
      const id = m[1];
      const mimeType = m[2];
      let name = m[3];
      try {
        name = JSON.parse(`"${name}"`);
      } catch {}

      if (!seenFiles.has(id)) {
        seenFiles.add(id);
        const isVideo = mimeType.startsWith('video/') || !!name.match(/\.(mp4|mov|webm)$/i);

        items.push({
          id,
          fileId: id,
          name,
          mimeType: isVideo ? 'video/mp4' : mimeType,
          thumbnailLink: `https://lh3.googleusercontent.com/d/${id}=s600`,
          previewUrl: isVideo
            ? `https://drive.google.com/uc?export=download&id=${id}`
            : `https://lh3.googleusercontent.com/d/${id}=s1920`,
          isFolder: false,
          trashed: false,
        });
      }
    }

    return NextResponse.json({
      folderId,
      title: folderTitle,
      hasSubfolders: subfolders.length > 0,
      subfolders,
      itemCount: items.length,
      items,
    });
  } catch (err: any) {
    console.error('Drive Folder Parse Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to parse Google Drive folder' },
      { status: 500 }
    );
  }
}
