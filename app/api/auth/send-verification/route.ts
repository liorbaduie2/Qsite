// app/api/auth/send-verification - uses Supabase admin client (same as register/check-availability)
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
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

    const supabase = getAdminClient();

    // Check if there's a recent verification request (within last 1 minute)
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentVerifications } = await supabase
      .from('phone_verifications')
      .select('id')
      .eq('phone', phone)
      .gte('created_at', oneMinuteAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentVerifications && recentVerifications.length > 0) {
      console.log('Recent verification found, preventing spam');
      return NextResponse.json({
        error: 'נשלח קוד לאחרונה. אנא המתן דקה לפני בקשה נוספת'
      }, { status: 429 });
    }

    // Mark any existing pending verifications as expired
    await supabase
      .from('phone_verifications')
      .update({ status: 'expired' })
      .eq('phone', phone)
      .eq('status', 'pending');

    // Generate 4-digit verification code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    console.log('Generated verification code:', code);

    // Store new verification code in database
    const { error: dbError } = await supabase
      .from('phone_verifications')
      .insert({
        phone,
        code,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      });

    if (dbError) {
      console.error('Failed to store verification code:', dbError);
      return NextResponse.json({
        error: process.env.NODE_ENV === 'development' ? `DB: ${dbError.message}` : 'שגיאה בשמירת קוד אימות'
      }, { status: 500 });
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