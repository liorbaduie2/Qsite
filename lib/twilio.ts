import twilio, { Twilio } from 'twilio';

let _client: Twilio | null = null;

function getClient(): Twilio | null {
  if (_client) return _client;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    console.error('Missing Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)');
    return null;
  }
  _client = twilio(accountSid, authToken);
  return _client;
}

function formatPhoneE164(phone: string): string {
  let formatted = phone;
  if (formatted.startsWith('0')) {
    formatted = '+972' + formatted.slice(1);
  }
  return formatted.replace(/[-\s]/g, '');
}

function getVerifyServiceSid(): string | null {
  return process.env.TWILIO_VERIFY_SERVICE_SID || null;
}

export async function sendVerification(
  phone: string
): Promise<{ success: boolean; error?: string }> {
  const client = getClient();
  const serviceSid = getVerifyServiceSid();
  if (!client || !serviceSid) {
    return { success: false, error: 'שגיאת הגדרת שרת' };
  }
  try {
    const formattedPhone = formatPhoneE164(phone);
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: formattedPhone, channel: 'sms' });

    return { success: verification.status === 'pending' };
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string; status?: number };
    console.error('Twilio Verify send error:', err.code, err.message);

    if (err.code === 60203) return { success: false, error: 'יותר מדי ניסיונות. נסה שוב מאוחר יותר' };
    if (err.code === 60200) return { success: false, error: 'מספר טלפון לא חוקי' };
    if (err.status === 429) return { success: false, error: 'יותר מדי בקשות. נסה שוב בעוד דקה' };

    return { success: false, error: 'שגיאה בשליחת SMS' };
  }
}

export async function checkVerification(
  phone: string,
  code: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  const client = getClient();
  const serviceSid = getVerifyServiceSid();
  if (!client || !serviceSid) {
    return { success: false, error: 'שגיאת הגדרת שרת' };
  }
  try {
    const formattedPhone = formatPhoneE164(phone);
    const check = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: formattedPhone, code });

    return { success: check.status === 'approved', status: check.status };
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string; status?: number };
    console.error('Twilio Verify check error:', err.code, err.message);

    if (err.code === 60202) return { success: false, error: 'יותר מדי ניסיונות. הקוד פג תוקף' };
    if (err.code === 20404) return { success: false, error: 'קוד אימות פג תוקף או לא נמצא' };

    return { success: false, error: 'שגיאה באימות הקוד' };
  }
}
