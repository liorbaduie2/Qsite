// app/api/auth/verify-phone/route.ts - uses Supabase admin client (same as register) 
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  console.log('=== Verify Phone API Called ===');

  try {
    const { phone, code } = await request.json();

    console.log('Verify phone request:', { phone, codeLength: code?.length });

    // Validate input
    if (!phone || !code) {
      return NextResponse.json({
        success: false,
        error: 'מספר טלפון וקוד נדרשים',
        error_code: 'MISSING_FIELDS'
      }, { status: 400 });
    }

    // Validate code format (should be 4 digits)
    if (!/^\d{4}$/.test(code)) {
      return NextResponse.json({
        success: false,
        error: 'קוד חייב להכיל 4 ספרות',
        error_code: 'INVALID_CODE_FORMAT'
      }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Get the latest verification record for this phone
    const now = new Date().toISOString();
    const { data: verifications, error: fetchError } = await supabase
      .from('phone_verifications')
      .select('id, code, attempts')
      .eq('phone', phone)
      .eq('status', 'pending')
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Verify phone Supabase error:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'שגיאה בבדיקת קוד אימות',
        error_code: 'DATABASE_ERROR'
      }, { status: 500 });
    }

    if (!verifications || verifications.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'קוד אימות לא נמצא או פג תוקף. אנא בקש קוד חדש.',
        error_code: 'CODE_NOT_FOUND_OR_EXPIRED'
      }, { status: 400 });
    }

    const verification = verifications[0];
    console.log('Verification record:', { id: verification.id, attempts: verification.attempts });

    // Check if too many attempts
    if ((verification.attempts ?? 0) >= 3) {
      await supabase
        .from('phone_verifications')
        .update({ status: 'failed' })
        .eq('id', verification.id);

      return NextResponse.json({
        success: false,
        error: 'יותר מדי ניסיונות. אנא בקש קוד חדש.',
        error_code: 'TOO_MANY_ATTEMPTS'
      }, { status: 400 });
    }

    // Check if code matches
    if (verification.code !== code) {
      const newAttempts = (verification.attempts ?? 0) + 1;
      await supabase
        .from('phone_verifications')
        .update({ attempts: newAttempts })
        .eq('id', verification.id);

      const attemptsLeft = 3 - newAttempts;
      return NextResponse.json({
        success: false,
        error: `קוד אימות שגוי. נותרו ${attemptsLeft} ניסיונות.`,
        error_code: 'INVALID_CODE',
        attempts_left: attemptsLeft
      }, { status: 400 });
    }

    // Code is correct - mark verification as verified
    const { error: updateError } = await supabase
      .from('phone_verifications')
      .update({ status: 'verified', verified_at: new Date().toISOString() })
      .eq('id', verification.id);

    if (updateError) {
      console.error('Failed to mark verification:', updateError);
      return NextResponse.json({
        success: false,
        error: 'שגיאה בעדכון סטטוס אימות',
        error_code: 'UPDATE_ERROR'
      }, { status: 500 });
    }

    console.log('Phone verification successful');
    return NextResponse.json({
      success: true,
      message: 'מספר הטלפון אומת בהצלחה'
    });

  } catch (error) {
    console.error('Verify phone error:', error);
    return NextResponse.json({
      success: false,
      error: 'שגיאת שרת בלתי צפויה',
      error_code: 'UNEXPECTED_ERROR'
    }, { status: 500 });
  }
}