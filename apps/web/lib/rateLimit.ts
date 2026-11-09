// Server-side In-Memory Rate Limiter for Authentication
// Protects against automated password guessing / brute-force attacks

interface RateLimitRecord {
  attempts: number;
  firstAttempt: number;
  lockedUntil: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes sliding window
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

export function checkLoginRateLimit(ip: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  // Check if currently locked out
  if (record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  // Reset if window has elapsed
  if (now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
    loginAttempts.delete(ip);
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - record.attempts);
  return { allowed: remaining > 0, remainingAttempts: remaining };
}

export function recordFailedLogin(ip: string): {
  locked: boolean;
  retryAfterSeconds?: number;
  remainingAttempts: number;
} {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
    loginAttempts.set(ip, {
      attempts: 1,
      firstAttempt: now,
      lockedUntil: 0,
    });
    return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - 1 };
  }

  record.attempts += 1;

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    const retryAfterSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
    return { locked: true, retryAfterSeconds, remainingAttempts: 0 };
  }

  return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - record.attempts };
}

export function resetLoginRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}
