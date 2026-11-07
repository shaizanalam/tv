async function testDriveAPI() {
  const keys = [
    'AIzaSyB-cPcIPE_o4mYfAz0ebn_mMRcfxq5PXT4',
    'AIzaSyDKPo3lyh1TvNSku7gw7jDDlYr1zo7tHQs',
    'AIzaSyAWGrfCCr7albM3lmCc937gx4uIphbpeKQ',
    'AIzaSyC1qbk75NzWBvSaDh6KnsjjA9pIrP4lYIE',
    'AIzaSyD_InbmSFufIEps5UAt2NmB_3LvBH3Sz_8'
  ];

  const folderId = '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za';

  for (const k of keys) {
    console.log(`Testing key: ${k}...`);
    try {
      const url = `https://www.googleapis.com/drive/v3/files?q=%27${folderId}%27+in+parents+and+trashed%3Dfalse&pageSize=100&fields=nextPageToken,files(id,name,mimeType,size,thumbnailLink)&key=${k}`;
      const res = await fetch(url);
      const json = await res.json();
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        console.log(`SUCCESS! Files count:`, json.files?.length);
        console.log(`nextPageToken:`, json.nextPageToken);
        return;
      } else {
        console.log(`Error message:`, json.error?.message);
      }
    } catch (e) {
      console.error('Fetch err:', e.message);
    }
  }
}
testDriveAPI();

