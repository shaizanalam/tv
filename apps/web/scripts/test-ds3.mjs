import fs from 'fs';

async function inspectDS3() {
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
      console.log('Found ds:3!');
      // Extract data
      const dataMatch = raw.match(/data:\s*([\s\S]*)/);
      if (dataMatch) {
        let jsonStr = dataMatch[1].trim();
        if (jsonStr.endsWith('}')) jsonStr = jsonStr.slice(0, -1).trim();
        // evaluate or parse
        try {
          const fn = new Function(`return (${jsonStr})`);
          const data = fn();
          console.log('Parsed ds:3 data successfully!');
          console.log('Data is array?', Array.isArray(data));
          console.log('Keys/Length:', data ? (Array.isArray(data) ? data.length : Object.keys(data)) : null);
          
          // Let's explore the structure
          if (Array.isArray(data)) {
            // Find where files are
            function findFiles(obj, depth = 0) {
              if (!obj || depth > 6) return;
              if (Array.isArray(obj)) {
                // Check if this array looks like a file item
                // Usually [null, "id", ...] or contains "image/"
                for (let i = 0; i < obj.length; i++) {
                  const item = obj[i];
                  if (Array.isArray(item)) {
                    // Check if item contains file info
                    const str = JSON.stringify(item);
                    if (str.includes('image/') || str.includes('video/')) {
                      // Count file-like children
                      console.log(`Depth ${depth}, item ${i} has media! Length: ${item.length}`);
                      if (item.length > 10) {
                        // sample first element
                        console.log('Sample child:', JSON.stringify(item[0]).slice(0, 200));
                      }
                    }
                    findFiles(item, depth + 1);
                  }
                }
              }
            }
            findFiles(data);
          }
        } catch (e) {
          console.error('Eval error:', e.message);
        }
      }
    }
  }
}
inspectDS3();
