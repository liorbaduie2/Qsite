//app\api\auth\send-verification
import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  console.log('=== Send Verification API Called ===');
  
  try {
    const { phone } = await request.json();
    console.log('Phone verification request for:', phone);
    
    if (!phone) {
      return NextResponse.json({ error: 'מספר טלפון נדרש' }, { status: 400 });
    }

    // Validate Israeli phone number format
    const phoneRegex = /^0(5[0-9]|7[7|6|8|9])(-?)([0-9]{3})(-?)([0-9]{4})$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: 'פורמט מספר טלפון לא חוקי' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('Missing Supabase config: url=', !!supabaseUrl, 'serviceKey=', !!serviceKey);
      return NextResponse.json({ error: 'שגיאת הגדרת שרת' }, { status: 500 });
    }

    // Check if there's a recent verification request (within last 1 minute)
    const recentCheck = await fetch(
      `${supabaseUrl}/rest/v1/phone_verifications?phone=eq.${encodeURIComponent(phone)}&created_at=gte.${new Date(Date.now() - 60000).toISOString()}&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const recentVerifications = await recentCheck.json();
    const hasRecent = Array.isArray(recentVerifications) && recentVerifications.length > 0;
    
    if (hasRecent) {
      console.log('Recent verification found, preventing spam');
      return NextResponse.json({ 
        error: 'נשלח קוד לאחרונה. אנא המתן דקה לפני בקשה נוספת' 
      }, { status: 429 });
    }

    // Mark any existing pending verifications as expired
    await fetch(`${supabaseUrl}/rest/v1/phone_verifications?phone=eq.${encodeURIComponent(phone)}&status=eq.pending`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ status: 'expired' })
    });

    // Generate 4-digit verification code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    console.log('Generated verification code:', code);

    // Store new verification code in database
    const dbResponse = await fetch(`${supabaseUrl}/rest/v1/phone_verifications`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        phone,
        code,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      })
    });

    if (!dbResponse.ok) {
      const errText = await dbResponse.text();
      console.error('Failed to store verification code:', dbResponse.status, errText);
      const errMsg = process.env.NODE_ENV === 'development' && errText
        ? `DB: ${errText.slice(0, 200)}`
        : 'שגיאה בשמירת קוד אימות';
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    // Send SMS using Twilio
    const smsMessage = `קוד אימות חדש: ${code}\nתוקף: 5 דקות`;
    console.log('Sending SMS message:', smsMessage);
    
    const smsResult = await sendSMS(phone, smsMessage);
    
    if (!smsResult.success) {
      console.error('SMS sending failed:', smsResult.error);
      
      // If SMS fails, still return success but mention possible delay
      return NextResponse.json({ 
        success: true,
        message: 'קוד אימות נשלח. אם לא הגיע, נסה שוב בעוד דקה',
        warning: 'ייתכן עיכוב במסירה',
        ...(process.env.NODE_ENV === 'development' && { demoCode: code })
      });
    }

    console.log('SMS sent successfully to:', phone);
    
    return NextResponse.json({ 
      success: true,
      message: 'קוד אימות נשלח בהצלחה',
      ...(process.env.NODE_ENV === 'development' && { demoCode: code })
    });

  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}