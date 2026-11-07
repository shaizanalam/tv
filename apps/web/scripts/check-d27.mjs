import fs from 'fs';

const raw = fs.readFileSync('apps/web/scripts/ds3.txt', 'utf8');
const obj = new Function(`return (${raw})`)();
const d27 = obj.data[27];

console.log('d27 length:', d27.length);
for (let i = 0; i < d27.length; i++) {
  const item = d27[i];
  if (Array.isArray(item)) {
    console.log(`d27[${i}]: Array length ${item.length}`);
  } else {
    console.log(`d27[${i}]:`, typeof item, item);
  }
}

// Let's check d27[7]
const d27_7 = d27[7];
console.log('d27[7] length:', d27_7?.length);
for (let i = 0; i < d27_7.length; i++) {
  const sub = d27_7[i];
  console.log(`d27_7[${i}]: Array?`, Array.isArray(sub), 'length:', sub?.length);
  // Is there a next page token or continuation token in d27 or d27_7?
}

// Let's search string for any token in obj
console.log('Searching for page token strings in d27...');
function findTokens(n, path = '') {
  if (typeof n === 'string' && n.length > 20 && !n.startsWith('http') && !n.includes(' ') && !n.includes('/') && !n.includes('.')) {
    console.log(`String at ${path}: "${n}" (len ${n.length})`);
  } else if (Array.isArray(n)) {
    n.forEach((c, idx) => findTokens(c, `${path}[${idx}]`));
  } else if (n && typeof n === 'object') {
    Object.keys(n).forEach(k => findTokens(n[k], `${path}.${k}`));
  }
}
findTokens(d27, 'd27');
