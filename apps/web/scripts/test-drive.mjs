async function test() {
  const res = await fetch('https://drive.google.com/drive/folders/1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  const idRegex = /\[\[null,"([a-zA-Z0-9_-]{25,45})"\]/g;
  const matches = [...html.matchAll(idRegex)];
  console.log('Total file-like IDs in HTML:', matches.length);

  const afRegex = /AF_initDataCallback\(([\s\S]*?)\);/g;
  let m;
  let count = 0;
  while ((m = afRegex.exec(html)) !== null) {
    const data = m[1];
    if (data.includes('image/') || data.includes('video/')) {
      console.log(`AF block ${count} has media. Length:`, data.length);
      // Let's inspect the JSON structure if parseable
      const keyMatch = data.match(/key:\s*'([^']+)'/);
      console.log('Key:', keyMatch ? keyMatch[1] : 'none');
      // Look for page token or next page indicators
      const tokenMatch = data.match(/nextPageToken|pageToken|continuationToken|token/i);
      console.log('Token occurrences:', tokenMatch);
    }
    count++;
  }
}
test();
