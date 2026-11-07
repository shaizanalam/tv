import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const envKey = process.env.DRIVE_TOKEN_ENCRYPTION_KEY;
  if (!envKey) {
    // Fallback deterministic key for local dev warning
    console.warn('[SECURITY WARNING] DRIVE_TOKEN_ENCRYPTION_KEY not set. Using dev fallback.');
    return crypto.createHash('sha256').update('driveframe-local-dev-fallback-key').digest();
  }
  return Buffer.from(envKey, 'hex');
}

export interface EncryptedPayload {
  cipherText: string;
  iv: string;
  tag: string;
}

export function encryptToken(token: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    cipherText: encrypted,
    iv: iv.toString('hex'),
    tag,
  };
}

export function decryptToken(payload: EncryptedPayload): string {
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(payload.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));
  let decrypted = decipher.update(payload.cipherText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

