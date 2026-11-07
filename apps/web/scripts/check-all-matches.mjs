import fs from 'fs';

async function checkAllMatches() {
  const res = await fetch('https://drive.google.com/drive/folders/1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  
  // Find all file IDs
  const idRegex = /\[\[null,"([a-zA-Z0-9_-]{28,45})"\]/g;
  const ids = new Set();
  let m;
  while ((m = idRegex.exec(html)) !== null) {
    ids.add(m[1]);
  }
  console.log('Unique IDs matching [[null,"..."]]:', ids.size);
  console.log('Sample IDs:', [...ids].slice(0, 10));

  // Also check if any file names appear in the HTML
  const nameRegex = /"([^"\\]+\.(?:heic|jpg|jpeg|png|mp4|mov|webp))"/gi;
  const names = new Set();
  while ((m = nameRegex.exec(html)) !== null) {
    names.add(m[1]);
  }
  console.log('Unique media file names found in HTML:', names.size);
  console.log('Sample filenames:', [...names].slice(0, 10));
}

checkAllMatches();
