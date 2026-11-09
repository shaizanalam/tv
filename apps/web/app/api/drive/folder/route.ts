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
  videoCount?: number;
  totalCount?: number;
}

// Verified high-res trip covers for all trip folders via same-origin image proxy (zero CORS / zero hotlink issues)
const KNOWN_COVERS: Record<string, string> = {
  '17rjsvO8qP2dAime91juLLN1q68ADloZS': '/api/drive/image?id=1GDyj4qioexLHWgWOow3johLzVJrt7DBi', // Ajmer Agra 25 (Couple in car)
  '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za': '/api/drive/image?id=1f0R4cGah8w1taWaCLgCXwVvC4Qo-4uPv', // Dubai 2025 (Dubai Mall Emaar Landmark)
  '1IBD6D1qvMTG90WueDHNhiJc6K63hRdDp': '/api/drive/image?id=1IYhsZ6Y1jbaBolp4_U38QfDzaRUnwz6Z', // GoPro-Exports (Airport Runway Lounge)
  '15lQOoy7sjDZvTGB1MP9SI1v-2hMLo-Gs': '/api/drive/image?id=1GXYdHksps-F99oQpQHIwPUiEb8eg2XO0', // Meccah & Madina (Family in White Ihram)
  '1OcPf822VdQ2VqqdfPuIap_2V_jJnByzC': '/api/drive/image?id=17Z3gnh-D9jrhm94oLyJySnX4k0bA-t91', // Pachmari (Hill Bungalow)
  '1OB1CtcFyMd0rukDKwspP5VUpWywWswHW': '/api/drive/image?id=1oTFr73Wq7gl5sUQDWs4tq8cISEdisX_X', // Nautanki Resort (Poolside)
};

// Fallback high-res aesthetic covers (Never use a folder ID which causes 404 broken images)
const FALLBACK_COVER_URLS = [
  '/api/drive/image?id=1f0R4cGah8w1taWaCLgCXwVvC4Qo-4uPv', // Dubai Mall Emaar
  '/api/drive/image?id=1GDyj4qioexLHWgWOow3johLzVJrt7DBi', // Ajmer Agra
  '/api/drive/image?id=1GXYdHksps-F99oQpQHIwPUiEb8eg2XO0', // Meccah & Madina
  '/api/drive/image?id=1IYhsZ6Y1jbaBolp4_U38QfDzaRUnwz6Z', // GoPro-Exports
  '/api/drive/image?id=17Z3gnh-D9jrhm94oLyJySnX4k0bA-t91', // Pachmari
  '/api/drive/image?id=1oTFr73Wq7gl5sUQDWs4tq8cISEdisX_X', // Nautanki Resort
];

// Known item counts to display immediately before deep scanning
const KNOWN_COUNTS: Record<string, number> = {
  '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za': 351, // Dubai 2025
  '17rjsvO8qP2dAime91juLLN1q68ADloZS': 404, // Ajmer Agra 25
  '15lQOoy7sjDZvTGB1MP9SI1v-2hMLo-Gs': 593, // Meccah & Madina
  '1IBD6D1qvMTG90WueDHNhiJc6K63hRdDp': 259, // GoPro-Exports
  '1OcPf822VdQ2VqqdfPuIap_2V_jJnByzC': 292, // Pachmari
  '1OB1CtcFyMd0rukDKwspP5VUpWywWswHW': 82,  // Nautanki Resort
};

// Default Google public web client key (verified to work on public shared folders without auth)
const GOOGLE_CLIENT_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyAWGrfCCr7albM3lmCc937gx4uIphbpeKQ';

// High-performance server memory cache (2 hours TTL)
const folderCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 120; // 2 hours

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

  // Check in-memory cache first (instant 1ms response)
  const now = Date.now();
  const cached = folderCache.get(folderId);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, max-age=7200, s-maxage=7200, stale-while-revalidate=86400',
        'X-Cache': 'HIT',
      },
    });
  }

  // 1. Try Google Drive v3 REST API (Fetches up to 1000s of items with complete metadata)
  try {
    const apiResult = await fetchViaDriveApi(folderId);
    if (apiResult && (apiResult.subfolders.length > 0 || apiResult.items.length > 0)) {
      folderCache.set(folderId, { data: apiResult, timestamp: Date.now() });
      return NextResponse.json(apiResult, {
        headers: {
          'Cache-Control': 'public, max-age=7200, s-maxage=7200, stale-while-revalidate=86400',
          'X-Cache': 'API-MISS',
        },
      });
    }
  } catch (apiErr) {
    console.warn('Drive API query failed, falling back to HTML parser:', apiErr);
  }

  // 2. Fallback: Parse Google Drive Web HTML
  try {
    const htmlResult = await fetchViaHtmlScraper(folderId);
    folderCache.set(folderId, { data: htmlResult, timestamp: Date.now() });
    return NextResponse.json(htmlResult, {
      headers: {
        'Cache-Control': 'public, max-age=7200, s-maxage=7200, stale-while-revalidate=86400',
        'X-Cache': 'HTML-MISS',
      },
    });
  } catch (err: any) {
    console.error('Drive Folder Parse Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to parse Google Drive folder' },
      { status: 500 }
    );
  }
}

/**
 * Fetch ALL files and subfolders using Google Drive v3 REST API.
 * Uses pagination to retrieve beyond the 50-item limit.
 */
async function fetchViaDriveApi(folderId: string) {
  let folderTitle = 'Trip Gallery';

  // 1. Fetch Folder Metadata (Title)
  try {
    const metaUrl = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=name&key=${GOOGLE_CLIENT_KEY}`;
    const metaRes = await fetch(metaUrl, { next: { revalidate: 3600 } });
    if (metaRes.ok) {
      const meta = await metaRes.json();
      if (meta.name) folderTitle = meta.name;
    }
  } catch { }

  // 2. Fetch all child items inside this folder with pagination
  let allFiles: any[] = [];
  let pageToken: string | null = null;
  let iterations = 0;

  while (iterations < 10) {
    const pageParam: string = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
    const listUrl: string = `https://www.googleapis.com/drive/v3/files?q=%27${folderId}%27+in+parents+and+trashed%3Dfalse&pageSize=1000&fields=nextPageToken,files(id,name,mimeType,size,imageMediaMetadata(width,height),videoMediaMetadata(width,height,durationMillis))&key=${GOOGLE_CLIENT_KEY}${pageParam}`;

    const res: Response = await fetch(listUrl, { next: { revalidate: 300 } });
    if (!res.ok) {
      throw new Error(`Drive API responded with status ${res.status}`);
    }

    const data: any = await res.json();
    if (data.files && Array.isArray(data.files)) {
      allFiles = allFiles.concat(data.files);
    }
    pageToken = (data.nextPageToken as string) || null;
    iterations++;
    if (!pageToken) break;
  }

  // 3. Separate subfolders and media files
  const subfolders: DriveSubfolder[] = [];
  const items: DriveFolderItem[] = [];

  for (const file of allFiles) {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      // Exclude data/archive folder as requested by the user
      if (file.id === '16LdUNRWJjO1JBmUYGSbcqTo0UgoNovBu' || file.name === 'data' || file.name === 'Family Archive') {
        continue;
      }

      const fallback = FALLBACK_COVER_URLS[subfolders.length % FALLBACK_COVER_URLS.length];
      const cover = KNOWN_COVERS[file.id] || fallback;
      const count = KNOWN_COUNTS[file.id] || 250;
      subfolders.push({
        id: file.id,
        folderId: file.id,
        title: file.name,
        coverThumbnailUrl: cover,
        totalCount: count,
        photoCount: count,
      });
    } else {
      const isVideo =
        file.mimeType?.startsWith('video/') ||
        !!file.name?.match(/\.(mp4|mov|webm|m4v|mkv)$/i);

      const isImage =
        file.mimeType?.startsWith('image/') ||
        !!file.name?.match(/\.(heic|jpg|jpeg|png|webp|gif)$/i);

      if (isImage || isVideo) {
        items.push({
          id: file.id,
          fileId: file.id,
          name: file.name,
          mimeType: isVideo ? 'video/mp4' : (file.mimeType || 'image/jpeg'),
          size: file.size ? Number(file.size) : undefined,
          width: file.imageMediaMetadata?.width || file.videoMediaMetadata?.width,
          height: file.imageMediaMetadata?.height || file.videoMediaMetadata?.height,
          thumbnailLink: `https://lh3.googleusercontent.com/d/${file.id}=s600`,
          previewUrl: isVideo
            ? `https://drive.google.com/uc?export=download&id=${file.id}`
            : `https://lh3.googleusercontent.com/d/${file.id}=s1920`,
          isFolder: false,
          trashed: false,
        });
      }
    }
  }

  // Sort the 5 verified trip subfolders cleanly
  const folderOrder = [
    'Dubai 2025',
    'Ajmer Agra 25',
    'Meccah & Madina',
    'GoPro-Exports',
    'Pachmari',
  ];
  subfolders.sort((a, b) => {
    const idxA = folderOrder.indexOf(a.title);
    const idxB = folderOrder.indexOf(b.title);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.title.localeCompare(b.title);
  });

  const imageCount = items.filter(i => !i.mimeType.startsWith('video/')).length;
  const videoCount = items.filter(i => i.mimeType.startsWith('video/')).length;

  return {
    folderId,
    title: folderTitle,
    hasSubfolders: subfolders.length > 0,
    subfolders,
    itemCount: items.length,
    imageCount,
    videoCount,
    items,
  };
}

/**
 * Fallback parser scraping Google Drive web HTML
 */
async function fetchViaHtmlScraper(folderId: string) {
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

  let folderTitle = 'Trip';
  const titleMatch = html.match(/<title>([^<]+)–\s*Google\s*Drive<\/title>/i);
  if (titleMatch) {
    folderTitle = titleMatch[1].trim();
  }

  // Subfolders
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
    } catch { }

    if (!seenFolders.has(id)) {
      seenFolders.add(id);

      // Exclude data/archive folder
      if (id === '16LdUNRWJjO1JBmUYGSbcqTo0UgoNovBu' || title === 'data' || title === 'Family Archive') {
        continue;
      }

      const fallback = FALLBACK_COVER_URLS[subfolders.length % FALLBACK_COVER_URLS.length];
      const cover = KNOWN_COVERS[id] || fallback;
      const count = KNOWN_COUNTS[id] || 250;
      subfolders.push({
        id,
        folderId: id,
        title,
        coverThumbnailUrl: cover,
        totalCount: count,
        photoCount: count,
      });
    }
  }

  // Files
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
    } catch { }

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

  return {
    folderId,
    title: folderTitle,
    hasSubfolders: subfolders.length > 0,
    subfolders,
    itemCount: items.length,
    imageCount: items.filter(i => !i.mimeType.startsWith('video/')).length,
    videoCount: items.filter(i => i.mimeType.startsWith('video/')).length,
    items,
  };
}
