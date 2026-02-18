import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !fromNumber) {
  console.error('Missing Twilio configuration:', {
    accountSid: accountSid ? 'Present' : 'Missing',
    authToken: authToken ? 'Present' : 'Missing',
    fromNumber: fromNumber ? 'Present' : 'Missing'
  });
}

const client = twilio(accountSid!, authToken!);

export const sendSMS = async (to: string, body: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Format Israeli phone number for international use
    let formattedPhone = to;
    if (to.startsWith('0')) {
      formattedPhone = '+972' + to.slice(1);
    }
    
    // Remove any dashes or spaces
    formattedPhone = formattedPhone.replace(/[-\s]/g, '');
    
    console.log(`Sending SMS to: ${formattedPhone}`);
    
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: formattedPhone,
    });

    console.log(`SMS sent successfully. SID: ${message.sid}, Status: ${message.status}`);
    return { success: true };
    
  } catch (error: unknown) {
    console.error('SMS sending failed:', error);
    
    // Handle specific Twilio errors
    let errorMessage = 'שגיאה בשליחת SMS';
    const errCode = (error as { code?: number })?.code;
    
    if (errCode === 21211) {
      errorMessage = 'מספר טלפון לא חוקי';
    } else if (errCode === 21614) {
      errorMessage = 'מספר טלפון לא חוקי למדינה';
    } else if (errCode === 21610) {
      errorMessage = 'הודעה נחסמה - מספר לא קיים';
    } else if (errCode === 30007) {
      errorMessage = 'הודעה לא נשלחה - נסה שוב';
    }
    
    return { success: false, error: errorMessage };
  }
};