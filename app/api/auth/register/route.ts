// app/api/auth/register/route.ts
// Supports both simple registration (email, password, username, fullName) and full Hebrew flow
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

// Helper function to calculate age
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
      phone = '',
      email,
      username,
      password,
      fullName = '',
      applicationText = '',
      dateOfBirth,
      gender,
      birthGender
    } = await request.json();

    // Simple registration mode: only email, username, password required (like old AuthModal flow)
    const isSimpleMode = !dateOfBirth && !gender;

    // Validate required fields (email, username, password always required)
    if (!email || !username || !password) {
      return NextResponse.json({
        error: 'כל השדות נדרשים (אימייל, שם משתמש, סיסמה)',
        error_code: 'MISSING_FIELDS'
      }, { status: 400 });
    }

    // Full mode: require phone, dateOfBirth, gender
    if (!isSimpleMode) {
      if (!phone) {
        return NextResponse.json({
          error: 'מספר הטלפון נדרש',
          error_code: 'MISSING_PHONE'
        }, { status: 400 });
      }
      if (!dateOfBirth) {
        return NextResponse.json({
          error: 'יש למלא תאריך לידה',
          error_code: 'MISSING_DOB'
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
    }

    // Validate username (2-50 chars, AuthModal uses 3+ so we allow 2 for compatibility)
    if (username.length < 2 || username.length > 50) {
      return NextResponse.json({
        error: 'שם המשתמש חייב להיות בין 2 ל-50 תווים',
        error_code: 'INVALID_USERNAME_LENGTH'
      }, { status: 400 });
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json({
        error: 'סיסמה חייבת להיות לפחות 8 תווים',
        error_code: 'INVALID_PASSWORD_LENGTH'
      }, { status: 400 });
    }

    // Age validation (full mode only)
    let age: number | undefined;
    if (dateOfBirth) {
      try {
        age = calculateAge(dateOfBirth);
        if (age < 16) {
          return NextResponse.json({
            error: `גיל מינימום לרישום הוא 16 שנים. הגיל שלך: ${age} שנים`,
            error_code: 'AGE_TOO_YOUNG'
          }, { status: 400 });
        }
      } catch {
        return NextResponse.json({
          error: 'פורמט תאריך לא תקין',
          error_code: 'INVALID_DATE_FORMAT'
        }, { status: 400 });
      }
    }

    // Check for existing users - build OR filter based on provided fields
    const orFilters: string[] = [`email.eq.${email}`, `username.eq.${username}`];
    if (phone && phone.trim()) {
      orFilters.push(`phone.eq.${phone}`);
    }
    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('phone, email, username')
      .or(orFilters.join(','));

    if (existingUsers && existingUsers.length > 0) {
      const existing = existingUsers[0];
      if (phone && existing.phone === phone) {
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

    // Build user_metadata (only include provided fields)
    const userMetadata: Record<string, unknown> = {
      username,
      full_name: fullName || ''
    };
    if (phone) userMetadata.phone = phone;
    if (dateOfBirth) userMetadata.date_of_birth = dateOfBirth;
    if (gender) userMetadata.gender = gender;
    if (gender === 'other' && birthGender) userMetadata.birth_gender = birthGender;
    if (age != null) userMetadata.age = age;

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata
    });

    if (authError || !authData.user) {
      console.error('Auth signup error:', authError);
      return NextResponse.json({
        error: `שגיאה ביצירת חשבון: ${authError?.message || 'שגיאה לא ידועה'}`,
        error_code: 'AUTH_CREATE_ERROR'
      }, { status: 500 });
    }

    // Build profile upsert - only include fields we have
    const profileData: Record<string, unknown> = {
      id: authData.user.id,
      username,
      full_name: fullName || null,
      email,
      approval_status: 'pending',
      is_verified: false,
      is_moderator: false,
      reputation: 0,
      questions_count: 0,
      answers_count: 0,
      best_answers_count: 0,
      total_views: 0,
      behavior_score: 100.00,
      credibility_score: 100.00,
      theme_role: 'user',
      status: 'active',
      updated_at: new Date().toISOString()
    };
    if (phone) profileData.phone = phone;
    if (dateOfBirth) profileData.date_of_birth = dateOfBirth;
    if (gender) profileData.gender = gender;
    if (gender === 'other' && birthGender) profileData.birth_gender = birthGender;
    if (age != null) profileData.age = age;
    if (phone) profileData.phone_verified_at = new Date().toISOString();

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile upsert failed:', profileError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({
        error: 'שגיאה ביצירת פרופיל משתמש',
        error_code: 'PROFILE_CREATE_ERROR',
        details: profileError.message
      }, { status: 500 });
    }

    // Create user role
    await supabase.from('user_roles').insert({
      user_id: authData.user.id,
      role: 'user',
      role_name_hebrew: 'משתמש',
      granted_at: new Date().toISOString(),
      is_hidden: false,
      max_reputation_deduction: 0,
      temporary_permissions: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Create user preferences
    await supabase.from('user_preferences').insert({
      user_id: authData.user.id,
      theme_mode: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Create user application (min 10 chars)
    const finalApplicationText = (applicationText && applicationText.length >= 10)
      ? applicationText
      : 'בקשה להצטרפות לקהילה. אני מעוניין להיות חלק מהקהילה ולתרום לדיונים.';

    await supabase.from('user_applications').insert({
      user_id: authData.user.id,
      application_text: finalApplicationText,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      message: 'חשבון נוצר בהצלחה! בקשתך ממתינה לאישור מנהל. תקבל אימייל כשהחשבון יאושר.',
      userData: {
        username,
        email,
        ...(age != null && { age }),
        ...(gender && { gender }),
        ...(phone && { phone })
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
