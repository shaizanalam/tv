async function inspectAF() {
  const res = await fetch('https://drive.google.com/drive/folders/1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  const afRegex = /AF_initDataCallback\(([\s\S]*?)\);/g;
  let m;
  while ((m = afRegex.exec(html)) !== null) {
    const raw = m[1];
    if (raw.includes("key: 'ds:3'") || raw.includes('key: "ds:3"')) {
      console.log('Raw start:', raw.slice(0, 300));
      console.log('Raw end:', raw.slice(-200));
      // Save raw to a file for analysis
      import('fs').then(fs => fs.writeFileSync('apps/web/scripts/ds3.txt', raw));
    }
  }
}
inspectAF();
