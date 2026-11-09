#!/usr/bin/env node

/**
 * DriveFrame TV - Family Password Salted Hash Generator
 * 
 * Usage:
 *   node scripts/generate-password-hash.mjs "YourFamilyPasswordHere"
 */

import crypto from 'node:crypto';

const password = process.argv[2] || 'family2025';

// 1. Generate cryptographically secure random 16-byte salt
const salt = crypto.randomBytes(16).toString('hex');

// 2. Derive strong 256-bit PBKDF2 key with 100,000 iterations of SHA-256
const derived = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
const hash = derived.toString('hex');

console.log('\n======================================================');
console.log('   DriveFrame TV - Family Password Hash Generated');
console.log('======================================================\n');
console.log(`Password: "${password}"\n`);
console.log('Add the following lines to your .env.local file or Vercel Environment Variables:\n');
console.log(`FAMILY_PASSWORD_SALT=${salt}`);
console.log(`FAMILY_PASSWORD_HASH=${hash}\n`);
console.log('Or alternatively, you can simply use:');
console.log(`FAMILY_PASSWORD=${password}\n`);
console.log('======================================================\n');
