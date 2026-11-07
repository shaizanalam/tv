async function testAllFolders() {
  const key = 'AIzaSyAWGrfCCr7albM3lmCc937gx4uIphbpeKQ';
  const rootFolderId = '1qCPS0mAatpr5Yil7t2Zc7hcO9Lbt2ufi';

  const rootUrl = `https://www.googleapis.com/drive/v3/files?q=%27${rootFolderId}%27+in+parents+and+trashed%3Dfalse&pageSize=1000&fields=files(id,name,mimeType)&key=${key}`;
  const res = await fetch(rootUrl);
  const data = await res.json();
  console.log('Root folders found:', data.files?.length);
  for (const f of data.files || []) {
    // count items inside
    const subUrl = `https://www.googleapis.com/drive/v3/files?q=%27${f.id}%27+in+parents+and+trashed%3Dfalse&pageSize=1000&fields=files(id,name,mimeType)&key=${key}`;
    const subRes = await fetch(subUrl);
    const subData = await subRes.json();
    console.log(`- ${f.name} (${f.id}): ${subData.files?.length || 0} items`);
  }
}
testAllFolders();
