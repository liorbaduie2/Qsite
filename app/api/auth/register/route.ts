// app/api/auth/register/route.ts - COMPLETE FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

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
  console.log('=== Complete Fixed Hebrew Registration API Called ===');
  
  try {
    const supabase = getSupabaseAdmin();
    const { 
      phone, 
      email, 
      username, 
      password, 
      fullName = '', 
      applicationText = '',
      dateOfBirth,
      gender,
      birthGender
    } = await request.json();
    
    console.log('Registration data:', { 
      phone, 
      email, 
      username, 
      fullNameLength: fullName?.length,
      dateOfBirth,
      gender,
      birthGender,
      hasDateOfBirth: !!dateOfBirth 
    });
    
    // Validate required fields
    if (!phone || !email || !username || !password) {
      return NextResponse.json({ 
        error: 'כל השדות נדרשים',
        error_code: 'MISSING_FIELDS'
      }, { status: 400 });
    }

    // Validate Date of Birth
    if (!dateOfBirth) {
      return NextResponse.json({ 
        error: 'יש למלא תאריך לידה',
        error_code: 'MISSING_DOB'
      }, { status: 400 });
    }

    // Validate date format and calculate age
    let age;
    try {
      age = calculateAge(dateOfBirth);
    } catch {
      return NextResponse.json({ 
        error: 'פורמט תאריך לא תקין',
        error_code: 'INVALID_DATE_FORMAT'
      }, { status: 400 });
    }

    // Validate age (must be 16+)
    if (age < 16) {
      return NextResponse.json({ 
        error: `גיל מינימום לרישום הוא 16 שנים. הגיל שלך: ${age} שנים`,
        error_code: 'AGE_TOO_YOUNG'
      }, { status: 400 });
    }

    // Validate gender
    if (!gender || !['male', 'female', 'other'].includes(gender)) {
      return NextResponse.json({ 
        error: 'יש לבחור מגדר תקין',
        error_code: 'INVALID_GENDER'
      }, { status: 400 });
    }

    // Validate birth gender if gender is 'other'
    if (gender === 'other' && (!birthGender || !['male', 'female'].includes(birthGender))) {
      return NextResponse.json({ 
        error: 'יש לציין מגדר לידה (זכר או נקבה) כאשר נבחר "אחר"',
        error_code: 'MISSING_BIRTH_GENDER'
      }, { status: 400 });
    }

    // Validate username
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

    // Check if user already exists
    console.log('Checking for existing users...');
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

// NEW - This creates user WITHOUT sending any Supabase emails
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // Mark email as confirmed, skip Supabase emails completely
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
      return NextResponse.json({ 
        error: `שגיאה ביצירת חשבון: ${authError?.message || 'שגיאה לא ידועה'}`,
        error_code: 'AUTH_CREATE_ERROR'
      }, { status: 500 });
    }

    console.log('User created successfully:', authData.user.id);

    // Create or update profile (trigger may have already created it)
    console.log('Upserting profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: authData.user.id,
          username: username,
          full_name: fullName,
          phone: phone,
          email: email,
          date_of_birth: dateOfBirth,
          gender: gender,
          birth_gender: gender === 'other' ? birthGender : null,
          age: age,
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
          phone_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error('Profile upsert failed:', profileError);
      
      // Clean up: delete the auth user if profile creation failed
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json({ 
        error: 'שגיאה ביצירת פרופיל משתמש',
        error_code: 'PROFILE_CREATE_ERROR',
        details: profileError.message
      }, { status: 500 });
    }

    console.log('Profile upserted successfully');

    // Create user role manually
    console.log('Creating user role...');
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
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

    if (roleError) {
      console.error('Role creation failed but continuing:', roleError);
    } else {
      console.log('User role created successfully');
    }

    // Create user preferences manually (replaces the removed trigger functionality)
    console.log('Creating user preferences...');
    const { error: preferencesError } = await supabase
      .from('user_preferences')
      .insert({
        user_id: authData.user.id,
        theme_mode: 'system', // Default theme mode
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (preferencesError) {
      console.error('User preferences creation failed but continuing:', preferencesError);
    } else {
      console.log('User preferences created successfully');
    }

    // Create user application
    console.log('Creating user application...');
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
      // Continue anyway - admin can create application manually if needed
    } else {
      console.log('Application created successfully');
    }

    console.log('Registration completed successfully');
    return NextResponse.json({ 
      success: true,
      userId: authData.user.id,
      message: 'חשבון נוצר בהצלחה! בקשתך ממתינה לאישור מנהל. תקבל אימייל כשהחשבון יאושר.',
      userData: {
        username: username,
        email: email,
        age: age,
        gender: gender,
        phone: phone
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