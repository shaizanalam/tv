import fs from 'fs';

const raw = fs.readFileSync('apps/web/scripts/ds3.txt', 'utf8');
const obj = new Function(`return (${raw})`)();
const data = obj.data;

console.log('data length:', data.length);
for (let i = 0; i < data.length; i++) {
  const item = data[i];
  const type = typeof item;
  if (Array.isArray(item)) {
    console.log(`data[${i}]: Array (length ${item.length})`);
    // print some sample contents
    console.log(`  preview:`, JSON.stringify(item).slice(0, 150));
  } else if (item && typeof item === 'object') {
    console.log(`data[${i}]: Object (keys: ${Object.keys(item)})`);
  } else {
    console.log(`data[${i}]: ${type} =`, item);
  }
}
