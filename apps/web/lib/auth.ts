// Shared Family Authentication & Session Management
// Works across Next.js Edge Middleware and Node.js route handlers

export const SESSION_COOKIE_NAME = 'driveframe_session';

// Constant-time string equality to prevent timing attacks
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// Universal Base64URL encoding/decoding for Edge & Node.js
export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlToBytes(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// PBKDF2 with SHA-256 (100,000 iterations)
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const passKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    passKey,
    256
  );
  const bytes = new Uint8Array(derived);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

// Verify entered password against environment configuration
export async function verifyPassword(inputPassword: string): Promise<boolean> {
  if (!inputPassword || typeof inputPassword !== 'string') return false;

  const envHash = process.env.FAMILY_PASSWORD_HASH?.trim();
  const envSalt = process.env.FAMILY_PASSWORD_SALT?.trim();
  const envPlain = process.env.FAMILY_PASSWORD?.trim();

  // Mode 1: Strong Salted Hash in environment
  if (envHash && envSalt) {
    try {
      const computedHash = await hashPasswordWithSalt(inputPassword, envSalt);
      return constantTimeEqual(computedHash.toLowerCase(), envHash.toLowerCase());
    } catch (err) {
      console.error('[AUTH] PBKDF2 hash verification error:', err);
      return false;
    }
  }

  // Mode 2: Plaintext password in environment
  if (envPlain) {
    return constantTimeEqual(inputPassword, envPlain);
  }

  // Mode 3: Development fallback with warning
  console.warn(
    '[SECURITY WARNING] No FAMILY_PASSWORD or FAMILY_PASSWORD_HASH configured in environment. Using development password "family2025".'
  );
  return constantTimeEqual(inputPassword, 'family2025');
}

// Session Token Signing with HMAC-SHA256
async function getSessionSigningKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET || 'driveframe-family-vault-hmac-secret-key-32bytes-min';
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSessionToken(maxAgeDays?: number): Promise<{ token: string; exp: number }> {
  const days = maxAgeDays || parseInt(process.env.SESSION_MAX_AGE_DAYS || '7', 10);
  const now = Math.floor(Date.now() / 1000);
  const exp = now + days * 24 * 60 * 60;

  const payload = {
    sub: 'family',
    iat: now,
    exp,
  };

  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const payloadB64 = bytesToBase64Url(payloadBytes);

  const key = await getSessionSigningKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
  const sigB64 = bytesToBase64Url(new Uint8Array(signature));

  return {
    token: `${payloadB64}.${sigB64}`,
    exp,
  };
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<{ valid: boolean; payload?: { sub: string; iat: number; exp: number }; reason?: string }> {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'missing_token' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'malformed_token' };
  }

  const [payloadB64, sigB64] = parts;

  try {
    const key = await getSessionSigningKey();
    const sigBytes = base64UrlToBytes(sigB64);
    const isValidSig = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      new TextEncoder().encode(payloadB64)
    );

    if (!isValidSig) {
      return { valid: false, reason: 'invalid_signature' };
    }

    const payloadJson = new TextDecoder().decode(base64UrlToBytes(payloadB64));
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, reason: 'session_expired' };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, reason: 'verification_failed' };
  }
}
