import { NextRequest, NextResponse } from 'next/server';
import { checkVerification } from '@/lib/twilio';
import { generatePhoneVerificationToken } from '@/lib/registration-token';

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'מספר טלפון וקוד נדרשים' }, { status: 400 });
    }

    const result = await checkVerification(phone, code);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'קוד אימות שגוי'
      }, { status: 400 });
    }

    const verificationToken = generatePhoneVerificationToken(phone);

    return NextResponse.json({
      success: true,
      message: 'מספר הטלפון אומת בהצלחה',
      verificationToken
    });
  } catch (error) {
    console.error('Verify phone error:', error);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
