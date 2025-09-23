//app\api\auth\verify-phone
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();
    
    if (!phone || !code) {
      return NextResponse.json({ error: 'מספר טלפון וקוד נדרשים' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Get the latest verification record for this phone
    const response = await fetch(
      `${supabaseUrl}/rest/v1/phone_verifications?phone=eq.${phone}&status=eq.pending&expires_at=gt.${new Date().toISOString()}&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': serviceKey!,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'שגיאה בבדיקת קוד אימות' }, { status: 500 });
    }

    const verifications = await response.json();
    
    if (verifications.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'קוד אימות לא נמצא או פג תוקף' 
      }, { status: 400 });
    }

    const verification = verifications[0];

    // Check if code matches
    if (verification.code !== code) {
      // Update attempts count
      await fetch(`${supabaseUrl}/rest/v1/phone_verifications?id=eq.${verification.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey!,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attempts: verification.attempts + 1 })
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
        'apikey': serviceKey!,
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