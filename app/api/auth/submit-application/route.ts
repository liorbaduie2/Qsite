import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { validateRegistrationToken } from '@/lib/registration-token';

const DEFAULT_APPLICATION_TEXTS = [
  'בקשה להצטרפות לקהילה. אני מעוניין להיות חלק מהקהילה ולתרום לדיונים.',
  'בקשה אוטומטית להצטרפות לקהילה דרך טופס הרשמה.',
  'בקשה אוטומטית עבור משתמש קיים במערכת.'
];

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const { userId, applicationText, registrationToken } = await request.json();

    if (!userId || !applicationText) {
      return NextResponse.json({
        error: 'מזהה משתמש וטקסט בקשה נדרשים',
        error_code: 'MISSING_FIELDS'
      }, { status: 400 });
    }

    // ── Authentication: require a valid registration token ──
    if (!registrationToken || !validateRegistrationToken(registrationToken, userId)) {
      return NextResponse.json({
        error: 'אין הרשאה לעדכן בקשה זו',
        error_code: 'UNAUTHORIZED'
      }, { status: 403 });
    }

    if (applicationText.length < 10 || applicationText.length > 2000) {
      return NextResponse.json({
        error: 'טקסט הבקשה חייב להיות בין 10 ל-2000 תווים',
        error_code: 'INVALID_TEXT_LENGTH'
      }, { status: 400 });
    }

    const { data: existingApplication, error: checkError } = await supabase
      .from('user_applications')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Database error checking existing application:', checkError);
      return NextResponse.json({
        error: 'שגיאה בבדיקת בקשות קיימות',
        error_code: 'DATABASE_ERROR'
      }, { status: 500 });
    }

    if (existingApplication) {
      const existingTextNormalized = existingApplication.application_text?.trim() || '';
      const isDefaultText = DEFAULT_APPLICATION_TEXTS.some(t => t.trim() === existingTextNormalized);
      const isNewUserText = !DEFAULT_APPLICATION_TEXTS.some(t => t.trim() === applicationText.trim());

      if (isDefaultText && isNewUserText && existingApplication.status === 'pending') {
        const { data: updatedApplication, error: updateError } = await supabase
          .from('user_applications')
          .update({
            application_text: applicationText.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating application:', updateError);
          return NextResponse.json({
            error: 'שגיאה בעדכון הבקשה',
            error_code: 'UPDATE_ERROR'
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'הבקשה נשלחה בהצלחה! תקבל עדכון כאשר היא תאושר.',
          application: updatedApplication,
          action: 'updated_default_text'
        });
      }

      if (existingApplication.status === 'pending') {
        if (!isDefaultText) {
          return NextResponse.json({
            success: true,
            message: 'הבקשה שלך כבר נשלחה וממתינה לאישור מנהל',
            error_code: 'APPLICATION_PENDING'
          }, { status: 200 });
        }
      } else if (existingApplication.status === 'approved') {
        return NextResponse.json({
          success: true,
          message: 'הבקשה שלך כבר אושרה! אתה יכול להיכנס למערכת',
          error_code: 'APPLICATION_APPROVED'
        }, { status: 200 });
      } else if (existingApplication.status === 'rejected') {
        const { data: updatedApplication, error: updateError } = await supabase
          .from('user_applications')
          .update({
            application_text: applicationText.trim(),
            status: 'pending',
            reviewed_by: null,
            reviewed_at: null,
            admin_notes: null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating rejected application:', updateError);
          return NextResponse.json({
            error: 'שגיאה בעדכון הבקשה',
            error_code: 'UPDATE_ERROR'
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'הבקשה עודכנה בהצלחה וממתינה לבדיקה מחדש',
          application: updatedApplication,
          action: 'resubmitted'
        });
      }
    }

    // Create new application
    const { data: newApplication, error: createError } = await supabase
      .from('user_applications')
      .insert({
        user_id: userId,
        application_text: applicationText.trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating application:', createError);

      if (createError.code === '23505') {
        return NextResponse.json({
          success: true,
          message: 'הבקשה שלך כבר קיימת במערכת',
          error_code: 'DUPLICATE_APPLICATION'
        }, { status: 200 });
      }

      return NextResponse.json({
        error: 'שגיאה ביצירת הבקשה',
        error_code: 'CREATE_ERROR'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'הבקשה נשלחה בהצלחה! תקבל עדכון כאשר היא תאושר.',
      application: newApplication,
      action: 'created'
    });

  } catch (error) {
    console.error('Submit Application API Error:', error);
    return NextResponse.json({
      error: 'שגיאת שרת פנימית',
      error_code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        error: 'מזהה משתמש נדרש',
        error_code: 'MISSING_USER_ID'
      }, { status: 400 });
    }

    const { data: application, error } = await supabase
      .from('user_applications')
      .select('id, status, created_at, reviewed_at, admin_notes, application_text')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      return NextResponse.json({
        has_application: false,
        status: null
      });
    }

    if (error) {
      console.error('Error checking application status:', error);
      return NextResponse.json({
        error: 'שגיאה בבדיקת סטטוס הבקשה',
        error_code: 'STATUS_CHECK_ERROR'
      }, { status: 500 });
    }

    return NextResponse.json({
      has_application: true,
      application
    });

  } catch (error) {
    console.error('GET application status error:', error);
    return NextResponse.json({
      error: 'שגיאת שרת פנימית',
      error_code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}
