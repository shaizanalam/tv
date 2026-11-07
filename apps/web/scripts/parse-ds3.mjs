import fs from 'fs';

const raw = fs.readFileSync('apps/web/scripts/ds3.txt', 'utf8');

// The raw string is an object literal: {key: 'ds:3', hash: '4', data: [...], sideChannel: {}}
// We can wrap it in parenthesis and evaluate it with Function
try {
  const obj = new Function(`return (${raw})`)();
  console.log('Parsed successfully!');
  console.log('Keys of obj:', Object.keys(obj));
  const data = obj.data;
  console.log('data[0]:', data[0]);
  console.log('data[1]:', data[1]);

  // Let's search inside data for files
  // Find all arrays that have a file ID
  let totalFiles = 0;
  let totalFolders = 0;
  let items = [];

  function walk(node, path = '') {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      // Check if this array represents a Drive item
      // In Drive Web, an item usually has [ [null, "fileId"], mimeType, ... ] or similar
      // Let's check if node has a 28-35 char alphanumeric id and a filename or mimeType
      if (node.length >= 3 && Array.isArray(node[0]) && typeof node[0][1] === 'string' && /^[a-zA-Z0-9_-]{25,45}$/.test(node[0][1])) {
        const id = node[0][1];
        // Check if there's a mimeType or name in node
        const str = JSON.stringify(node);
        // Find filename
        const nameMatch = str.match(/"([^"]+\.[a-zA-Z0-9]{3,4})"/);
        const mimeMatch = str.match(/"(image\/[^"]+|video\/[^"]+|application\/vnd\.google-apps\.folder)"/);
        if (nameMatch || mimeMatch) {
          items.push({
            id,
            name: nameMatch ? nameMatch[1] : undefined,
            mime: mimeMatch ? mimeMatch[1] : undefined
          });
          return;
        }
      }
      for (let i = 0; i < node.length; i++) {
        walk(node[i], `${path}[${i}]`);
      }
    }
  }

  walk(data);
  console.log('Found items count via structured walk:', items.length);
  if (items.length > 0) {
    console.log('First 5 items:', items.slice(0, 5));
    console.log('Last 5 items:', items.slice(-5));
  }
} catch (e) {
  console.error('Error:', e);
}

