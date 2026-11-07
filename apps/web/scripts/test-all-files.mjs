async function testAll() {
  const key = 'AIzaSyAWGrfCCr7albM3lmCc937gx4uIphbpeKQ';
  const folderId = '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za';
  let allFiles = [];
  let pageToken = '';

  do {
    const pageParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
    const url = `https://www.googleapis.com/drive/v3/files?q=%27${folderId}%27+in+parents+and+trashed%3Dfalse&pageSize=1000&fields=nextPageToken,files(id,name,mimeType,size,imageMediaMetadata,videoMediaMetadata)&key=${key}${pageParam}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      console.error('Error:', data);
      break;
    }
    console.log(`Fetched page with ${data.files.length} items`);
    allFiles = allFiles.concat(data.files);
    pageToken = data.nextPageToken;
  } while (pageToken);

  console.log(`TOTAL FILES IN DUBAI 2025:`, allFiles.length);
  const images = allFiles.filter(f => f.mimeType.startsWith('image/'));
  const videos = allFiles.filter(f => f.mimeType.startsWith('video/') || f.name.match(/\.(mp4|mov)$/i));
  console.log(`Images: ${images.length}, Videos: ${videos.length}`);
}
testAll();
