// app/api/auth/verify-phone/route.ts - COMPLETE FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('=== Verify Phone API Called ===');
  
  try {
    const { phone, code } = await request.json();
    
    console.log('Verify phone request:', { phone, codeLength: code?.length });
    
    // Validate input
    if (!phone || !code) {
      console.log('Missing phone or code');
      return NextResponse.json({ 
        success: false,
        error: 'מספר טלפון וקוד נדרשים',
        error_code: 'MISSING_FIELDS'
      }, { status: 400 });
    }

    // Validate code format (should be 4 digits)
    if (!/^\d{4}$/.test(code)) {
      console.log('Invalid code format:', code);
      return NextResponse.json({ 
        success: false,
        error: 'קוד חייב להכיל 4 ספרות',
        error_code: 'INVALID_CODE_FORMAT'
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json({ 
        success: false,
        error: 'שגיאת תצורת שרת',
        error_code: 'SERVER_CONFIG_ERROR'
      }, { status: 500 });
    }

    // Get the latest verification record for this phone
    console.log('Fetching verification records...');
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
      console.error('Database fetch failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Database error details:', errorText);
      return NextResponse.json({ 
        success: false,
        error: 'שגיאה בבדיקת קוד אימות',
        error_code: 'DATABASE_ERROR'
      }, { status: 500 });
    }

    const verifications = await response.json();
    console.log('Found verifications:', verifications.length);
    
    if (verifications.length === 0) {
      console.log('No valid verification found');
      return NextResponse.json({ 
        success: false, 
        error: 'קוד אימות לא נמצא או פג תוקף. אנא בקש קוד חדש.',
        error_code: 'CODE_NOT_FOUND_OR_EXPIRED'
      }, { status: 400 });
    }

    const verification = verifications[0];
    console.log('Verification record:', { 
      id: verification.id, 
      code: verification.code, 
      attempts: verification.attempts,
      inputCode: code 
    });

    // Check if too many attempts
    if (verification.attempts >= 3) {
      console.log('Too many attempts');
      // Mark as failed
      await fetch(`${supabaseUrl}/rest/v1/phone_verifications?id=eq.${verification.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'failed' })
      });

      return NextResponse.json({ 
        success: false, 
        error: 'יותר מדי ניסיונות. אנא בקש קוד חדש.',
        error_code: 'TOO_MANY_ATTEMPTS'
      }, { status: 400 });
    }

    // Check if code matches
    if (verification.code !== code) {
      console.log('Code mismatch');
      // Update attempts count
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/phone_verifications?id=eq.${verification.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attempts: verification.attempts + 1 })
      });

      if (!updateResponse.ok) {
        console.error('Failed to update attempts');
      }

      const attemptsLeft = 3 - (verification.attempts + 1);
      return NextResponse.json({ 
        success: false, 
        error: `קוד אימות שגוי. נותרו ${attemptsLeft} ניסיונות.`,
        error_code: 'INVALID_CODE',
        attempts_left: attemptsLeft
      }, { status: 400 });
    }

    // Code is correct - mark verification as verified
    console.log('Code is correct, marking as verified');
    const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/phone_verifications?id=eq.${verification.id}`, {
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

    if (!verifyResponse.ok) {
      console.error('Failed to mark verification as verified');
      const errorText = await verifyResponse.text();
      console.error('Verify response error:', errorText);
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