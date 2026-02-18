// app/api/auth/submit-application/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🔥 FIXED: Make sure this matches EXACTLY what's created in registration
const DEFAULT_APPLICATION_TEXTS = [
  'בקשה להצטרפות לקהילה. אני מעוניין להיות חלק מהקהילה ולתרום להיוניס.', // ← FIXED: matches registration
  'בקשה להצטרפות לקהילה. אני מעוניין להיות חלק מהקהילה ולתרום לדיונים.',
  'בקשה אוטומטית להצטרפות לקהילה דרך טופס הרשמה.',
  'בקשה אוטומטית עבור משתמש קיים במערכת.'
];

export async function POST(request: NextRequest) {
  console.log('=== Submit Application API Called ===');

  try {
    const { userId, applicationText } = await request.json();
    console.log('Application data:', { userId, applicationText, textLength: applicationText?.length });

    if (!userId || !applicationText) {
      console.log('Missing required fields');
      return NextResponse.json({
        error: 'מזהה משתמש וטקסט בקשה נדרשים',
        error_code: 'MISSING_FIELDS'
      }, { status: 400 });
    }

    if (applicationText.length < 10 || applicationText.length > 2000) {
      console.log('Invalid text length:', applicationText.length);
      return NextResponse.json({
        error: 'טקסט הבקשה חייב להיות בין 10 ל-2000 תווים',
        error_code: 'INVALID_TEXT_LENGTH'
      }, { status: 400 });
    }

    // Check if user already has an application
    console.log('Checking for existing application...');
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
      console.log('Found existing application:', existingApplication);

      // 🔥 FIXED: Better matching logic with trimming and normalization
      const existingTextNormalized = existingApplication.application_text?.trim() || '';
      const isDefaultText = DEFAULT_APPLICATION_TEXTS.some(defaultText =>
        defaultText.trim() === existingTextNormalized
      );
      const isNewUserText = !DEFAULT_APPLICATION_TEXTS.some(defaultText =>
        defaultText.trim() === applicationText.trim()
      );

      console.log('🔍 Text analysis:', {
        existing_text: existingTextNormalized,
        new_text: applicationText.trim(),
        is_default_text: isDefaultText,
        is_new_user_text: isNewUserText,
        should_update: isDefaultText && isNewUserText,
        all_default_texts: DEFAULT_APPLICATION_TEXTS
      });

      // If existing application has default text and user is providing real text, update it
      if (isDefaultText && isNewUserText && existingApplication.status === 'pending') {
        console.log('✅ Updating default application with user text...');

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

        console.log('✅ Application updated with user text successfully');
        return NextResponse.json({
          success: true,
          message: 'הבקשה נשלחה בהצלחה! תקבל עדכון כאשר היא תאושר.',
          application: updatedApplication,
          action: 'updated_default_text'
        });
      }

      // Handle different existing application statuses
      if (existingApplication.status === 'pending') {
        // If it's already a real user application (not default text)
        if (!isDefaultText) {
          console.log('ℹ️ User already has real application text');
          return NextResponse.json({
            success: true,
            message: 'הבקשה שלך כבר נשלחה וממתינה לאישור מנהל',
            error_code: 'APPLICATION_PENDING'
          }, { status: 200 });
        }

      } else if (existingApplication.status === 'approved') {
        console.log('✅ Application already approved');
        return NextResponse.json({
          success: true,
          message: 'הבקשה שלך כבר אושרה! אתה יכול להיכנס למערכת',
          error_code: 'APPLICATION_APPROVED'
        }, { status: 200 });

      } else if (existingApplication.status === 'rejected') {
        // Allow resubmission for rejected applications
        console.log('🔄 Updating rejected application...');

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

        console.log('✅ Rejected application updated successfully');
        return NextResponse.json({
          success: true,
          message: 'הבקשה עודכנה בהצלחה וממתינה לבדיקה מחדש',
          application: updatedApplication,
          action: 'resubmitted'
        });
      }
    }

    // Create new application (if no existing application found)
    console.log('➕ Creating new application...');
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
        console.log('Duplicate detected, this should have been caught above');
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

    console.log('✅ New application created successfully');
    return NextResponse.json({
      success: true,
      message: 'הבקשה נשלחה בהצלחה! תקבל עדכון כאשר היא תאושר.',
      application: newApplication,
      action: 'created'
    });

  } catch (error) {
    console.error('=== Submit Application API Error ===');
    console.error('Error:', error);

    return NextResponse.json({
      error: 'שגיאת שרת פנימית',
      error_code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
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
      application: application
    });

  } catch (error) {
    console.error('GET application status error:', error);
    return NextResponse.json({
      error: 'שגיאת שרת פנימית',
      error_code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}
