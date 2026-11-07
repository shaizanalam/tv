async function testRegex() {
  const res = await fetch('https://drive.google.com/drive/folders/1qCPS0mAatpr5Yil7t2Zc7hcO9Lbt2ufi', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  const subfolderMatches = [
    ...html.matchAll(
      /\[\[null,"([a-zA-Z0-9_-]{25,45})"\][\s\S]*?"application\/vnd\.google-apps\.folder"[\s\S]*?\[\[\["([^"]+)",null,1\]\]\]/g
    ),
  ];
  for (const m of subfolderMatches) {
    console.log('Regex extracted folder:', m[2], 'ID:', m[1]);
  }
}
testRegex();
