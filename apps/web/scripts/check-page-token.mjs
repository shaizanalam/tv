import fs from 'fs';

const raw = fs.readFileSync('apps/web/scripts/ds3.txt', 'utf8');
const obj = new Function(`return (${raw})`)();
const d27_7_0 = obj.data[27][7][0];

console.log('d27_7_0 length:', d27_7_0.length);
for (let i = 0; i < d27_7_0.length; i++) {
  const item = d27_7_0[i];
  if (Array.isArray(item)) {
    console.log(`item[${i}] array length:`, item.length);
    if (item.length < 10) console.log(`  content:`, JSON.stringify(item));
  } else {
    console.log(`item[${i}]:`, typeof item, item);
  }
}

