import crypto from 'crypto';

const TOKEN_MAX_AGE_SECONDS = 600; // 10 minutes

function getSecret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function sign(payload: string): string {
  const signature = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${signature}`;
}

function verify(token: string, maxAge: number): string | null {
  try {
    const dotIdx = token.indexOf('.');
    if (dotIdx < 1) return null;

    const payloadB64 = token.slice(0, dotIdx);
    const signature = token.slice(dotIdx + 1);
    const payload = Buffer.from(payloadB64, 'base64url').toString();

    const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) {
      return null;
    }

    const parts = payload.split(':');
    const timestamp = parseInt(parts[parts.length - 1]);
    if (Math.floor(Date.now() / 1000) - timestamp > maxAge) return null;

    return payload;
  } catch {
    return null;
  }
}

/** Issued by verify-phone after Twilio confirms the OTP. */
export function generatePhoneVerificationToken(phone: string): string {
  const ts = Math.floor(Date.now() / 1000).toString();
  return sign(`phone:${phone}:${ts}`);
}

export function validatePhoneVerificationToken(token: string, expectedPhone: string): boolean {
  const payload = verify(token, TOKEN_MAX_AGE_SECONDS);
  if (!payload) return false;
  const [prefix, phone] = payload.split(':');
  return prefix === 'phone' && phone === expectedPhone;
}

/** Issued by register after user is created. */
export function generateRegistrationToken(userId: string): string {
  const ts = Math.floor(Date.now() / 1000).toString();
  return sign(`reg:${userId}:${ts}`);
}

export function validateRegistrationToken(token: string, expectedUserId: string): boolean {
  const payload = verify(token, TOKEN_MAX_AGE_SECONDS);
  if (!payload) return false;
  const [prefix, userId] = payload.split(':');
  return prefix === 'reg' && userId === expectedUserId;
}
