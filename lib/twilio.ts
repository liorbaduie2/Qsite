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

export async function sendSMS(
  to: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) {
    console.error('Missing TWILIO_PHONE_NUMBER');
    return { success: false, error: 'שגיאת הגדרת שרת' };
  }
  const client = getClient();
  if (!client) {
    return { success: false, error: 'שגיאת הגדרת שרת' };
  }
  try {
    let formattedPhone = to;
    if (to.startsWith('0')) {
      formattedPhone = '+972' + to.slice(1);
    }
    formattedPhone = formattedPhone.replace(/[-\s]/g, '');

    console.log('Sending SMS to:', formattedPhone);

    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: formattedPhone,
    });

    console.log('SMS sent. SID:', message.sid);
    return { success: true };
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string };
    console.error('SMS failed:', err.code, err.message);

    let errorMessage = 'שגיאה בשליחת SMS';
    if (err.code === 21211) errorMessage = 'מספר טלפון לא חוקי';
    else if (err.code === 21614) errorMessage = 'מספר טלפון לא חוקי למדינה';
    else if (err.code === 21610)
      errorMessage = 'חשבון Trial: יש לאמת את המספר ב-Twilio Console';
    else if (err.code === 30007) errorMessage = 'הודעה לא נשלחה - נסה שוב';
    else if (err.message) errorMessage = err.message;

    return { success: false, error: errorMessage };
  }
}
