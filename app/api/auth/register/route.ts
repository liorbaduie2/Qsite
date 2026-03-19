import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { validatePhoneVerificationToken, generateRegistrationToken } from '@/lib/registration-token';

const PHONE_REGEX = /^0(5[0-9]|7[7|6|8|9])(-?)([0-9]{3})(-?)([0-9]{4})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const {
      phone,
      email,
      username,
      password,
      fullName = '',
      applicationText = '',
      dateOfBirth,
      gender,
      birthGender,
      phoneVerificationToken
    } = await request.json();

    // ── Validate required fields ──
    if (!phone || !email || !username || !password) {
      return NextResponse.json({
        error: 'כל השדות נדרשים',
        error_code: 'MISSING_FIELDS'
      }, { status: 400 });
    }

    // ── Server-side phone verification (CRITICAL security check) ──
    if (!phoneVerificationToken || !validatePhoneVerificationToken(phoneVerificationToken, phone)) {
      return NextResponse.json({
        error: 'יש לאמת את מספר הטלפון לפני הרשמה',
        error_code: 'PHONE_NOT_VERIFIED'
      }, { status: 403 });
    }

    // ── Server-side format validation ──
    if (!PHONE_REGEX.test(phone)) {
      return NextResponse.json({
        error: 'פורמט מספר טלפון לא חוקי',
        error_code: 'INVALID_PHONE_FORMAT'
      }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({
        error: 'פורמט אימייל לא חוקי',
        error_code: 'INVALID_EMAIL_FORMAT'
      }, { status: 400 });
    }

    if (!dateOfBirth) {
      return NextResponse.json({
        error: 'יש למלא תאריך לידה',
        error_code: 'MISSING_DOB'
      }, { status: 400 });
    }

    let age: number;
    try {
      age = calculateAge(dateOfBirth);
    } catch {
      return NextResponse.json({
        error: 'פורמט תאריך לא תקין',
        error_code: 'INVALID_DATE_FORMAT'
      }, { status: 400 });
    }

    if (age < 16) {
      return NextResponse.json({
        error: `גיל מינימום לרישום הוא 16 שנים. הגיל שלך: ${age} שנים`,
        error_code: 'AGE_TOO_YOUNG'
      }, { status: 400 });
    }

    if (!gender || !['male', 'female', 'other'].includes(gender)) {
      return NextResponse.json({
        error: 'יש לבחור מגדר תקין',
        error_code: 'INVALID_GENDER'
      }, { status: 400 });
    }

    if (gender === 'other' && (!birthGender || !['male', 'female'].includes(birthGender))) {
      return NextResponse.json({
        error: 'יש לציין מגדר לידה (זכר או נקבה) כאשר נבחר "אחר"',
        error_code: 'MISSING_BIRTH_GENDER'
      }, { status: 400 });
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({
        error: 'שם המשתמש חייב להיות בין 3 ל-20 תווים',
        error_code: 'INVALID_USERNAME_LENGTH'
      }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({
        error: 'סיסמה חייבת להיות לפחות 8 תווים',
        error_code: 'INVALID_PASSWORD_LENGTH'
      }, { status: 400 });
    }

    // ── Duplicate check (application-level, DB UNIQUE is the real guard) ──
    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('phone, email, username')
      .or(`phone.eq.${phone},email.eq.${email},username.eq.${username}`);

    if (existingUsers && existingUsers.length > 0) {
      const existing = existingUsers[0];
      if (existing.phone === phone) {
        return NextResponse.json({
          error: 'מספר הטלפון כבר רשום במערכת',
          error_code: 'PHONE_EXISTS'
        }, { status: 400 });
      }
      if (existing.email === email) {
        return NextResponse.json({
          error: 'כתובת האימייל כבר רשומה במערכת',
          error_code: 'EMAIL_EXISTS'
        }, { status: 400 });
      }
      if (existing.username === username) {
        return NextResponse.json({
          error: 'שם המשתמש כבר תפוס',
          error_code: 'USERNAME_EXISTS'
        }, { status: 400 });
      }
    }

    // ── Create auth user ──
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        phone,
        full_name: fullName,
        date_of_birth: dateOfBirth,
        gender,
        birth_gender: gender === 'other' ? birthGender : null,
        age
      }
    });

    if (authError || !authData.user) {
      console.error('Auth signup error:', authError);

      if (authError?.message?.includes('already been registered')) {
        return NextResponse.json({
          error: 'כתובת האימייל כבר רשומה במערכת',
          error_code: 'EMAIL_EXISTS'
        }, { status: 400 });
      }

      return NextResponse.json({
        error: `שגיאה ביצירת חשבון: ${authError?.message || 'שגיאה לא ידועה'}`,
        error_code: 'AUTH_CREATE_ERROR'
      }, { status: 500 });
    }

    // Wait for handle_new_user trigger to create base profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    const profilePayload = {
      phone,
      email,
      full_name: fullName,
      date_of_birth: dateOfBirth,
      gender,
      birth_gender: gender === 'other' ? birthGender : null,
      age,
      phone_verified_at: new Date().toISOString(),
      approval_status: 'pending',
      updated_at: new Date().toISOString()
    };

    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username,
          ...profilePayload,
          reputation: 50,
          account_state: 'active',
          is_verified: false,
          is_moderator: false,
          questions_count: 0,
          answers_count: 0,
          best_answers_count: 0,
          total_views: 0,
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Manual profile creation failed:', profileError);
        if (profileError.code === '23505') {
          return NextResponse.json({
            error: 'מספר הטלפון או האימייל כבר רשומים במערכת',
            error_code: 'DUPLICATE_ENTRY'
          }, { status: 400 });
        }
      }
    } else {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profilePayload)
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        if (updateError.code === '23505') {
          return NextResponse.json({
            error: 'מספר הטלפון או האימייל כבר רשומים במערכת',
            error_code: 'DUPLICATE_ENTRY'
          }, { status: 400 });
        }
      }
    }

    // ── Create user application ──
    const finalApplicationText = applicationText ||
      'בקשה להצטרפות לקהילה. אני מעוניין להיות חלק מהקהילה ולתרום לדיונים.';

    const { error: applicationError } = await supabase
      .from('user_applications')
      .insert({
        user_id: authData.user.id,
        application_text: finalApplicationText,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (applicationError) {
      console.error('Application creation error:', applicationError);
    }

    const registrationToken = generateRegistrationToken(authData.user.id);

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      registrationToken,
      message: 'חשבון נוצר בהצלחה! בקשתך ממתינה לאישור מנהל. תקבל אימייל כשהחשבון יאושר.',
      userData: {
        username,
        email,
        age,
        gender,
        phone
      }
    });

  } catch (error) {
    console.error('Unexpected registration error:', error);
    return NextResponse.json({
      error: 'שגיאה לא צפויה בתהליך הרישום',
      error_code: 'UNEXPECTED_ERROR'
    }, { status: 500 });
  }
}
