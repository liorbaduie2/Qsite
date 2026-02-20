// app/api/auth/verify-phone - from working backup 27.09.2025
import { NextRequest, NextResponse } from 'next/server';
import { devPhoneCodes } from '@/lib/dev-phone-codes';

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'מספר טלפון וקוד נדרשים' }, { status: 400 });
    }

    // Dev fallback: check in-memory codes when DB table doesn't exist
    if (process.env.NODE_ENV === 'development') {
      const devEntry = devPhoneCodes.get(phone);
      if (devEntry && devEntry.expiresAt > Date.now() && devEntry.code === code) {
        devPhoneCodes.delete(phone);
        return NextResponse.json({
          success: true,
          message: 'מספר הטלפון אומת בהצלחה'
        });
      }
      if (devEntry && devEntry.code !== code) {
        return NextResponse.json({ success: false, error: 'קוד אימות שגוי' }, { status: 400 });
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'שגיאת תצורת שרת' }, { status: 500 });
    }

    // Get the latest verification record for this phone
    const response = await fetch(
      `${supabaseUrl}/rest/v1/phone_verifications?phone=eq.${encodeURIComponent(phone)}&status=eq.pending&expires_at=gt.${new Date().toISOString()}&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'שגיאה בבדיקת קוד אימות' }, { status: 500 });
    }

    const verifications = await response.json();

    if (!Array.isArray(verifications) || verifications.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'קוד אימות לא נמצא או פג תוקף'
      }, { status: 400 });
    }

    const verification = verifications[0];

    // Check if code matches
    if (verification.code !== code) {
      await fetch(`${supabaseUrl}/rest/v1/phone_verifications?id=eq.${verification.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attempts: (verification.attempts || 0) + 1 })
      });

      return NextResponse.json({
        success: false,
        error: 'קוד אימות שגוי'
      }, { status: 400 });
    }

    // Mark verification as verified
    await fetch(`${supabaseUrl}/rest/v1/phone_verifications?id=eq.${verification.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'verified',
        verified_at: new Date().toISOString()
      })
    });

    return NextResponse.json({
      success: true,
      message: 'מספר הטלפון אומת בהצלחה'
    });

  } catch (error) {
    console.error('Verify phone error:', error);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
