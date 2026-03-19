import { NextRequest, NextResponse } from 'next/server';
import { sendVerification } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'מספר טלפון נדרש' }, { status: 400 });
    }

    const phoneRegex = /^0(5[0-9]|7[7|6|8|9])(-?)([0-9]{3})(-?)([0-9]{4})$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: 'פורמט מספר טלפון לא חוקי' }, { status: 400 });
    }

    const result = await sendVerification(phone);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'שגיאה בשליחת קוד אימות'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'קוד אימות נשלח בהצלחה'
    });
  } catch (error) {
    const err = error as Error;
    console.error('Send verification error:', err?.message);
    return NextResponse.json(
      { error: 'שגיאת שרת' },
      { status: 500 }
    );
  }
}
