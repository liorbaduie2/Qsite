// app/api/auth/register/route.ts 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

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
  console.log('=== Hebrew Registration API with DOB & Gender Called ===');
  
  try {
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
    } catch (error) {
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

    // 🔥 KEY FIX: Use admin.createUser with email confirmed
    // We control access via approval_status, not email confirmation
    console.log('Creating Supabase Auth user with admin client...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 🔥 FIXED: Email confirmed, but pending admin approval
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

    // Wait a moment for potential trigger
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if profile was created by trigger
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (!existingProfile) {
      // Create profile manually
      console.log('Creating profile manually...');
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username,
          full_name: fullName,
          phone,
          email,
          date_of_birth: dateOfBirth,
          gender,
          birth_gender: gender === 'other' ? birthGender : null,
          age,
          approval_status: 'pending', // 🔥 KEY: Set to pending
          is_verified: false,
          is_moderator: false,
          reputation: 0,
          questions_count: 0,
          answers_count: 0,
          best_answers_count: 0,
          total_views: 0,
          phone_verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Manual profile creation failed:', profileError);
        // Continue anyway - could be handled later
      } else {
        console.log('Profile created manually with DOB and gender');
      }
    } else {
      // Update existing profile with new data
      console.log('Profile exists, updating with new data...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone,
          email,
          full_name: fullName,
          date_of_birth: dateOfBirth,
          gender,
          birth_gender: gender === 'other' ? birthGender : null,
          age, // This will trigger the age calculation trigger
          phone_verified_at: new Date().toISOString(),
          approval_status: 'pending', // 🔥 KEY: Ensure pending status
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
      } else {
        console.log('Profile updated with DOB and gender successfully');
      }
    }

    // Create user application
    console.log('Creating user application...');
    const finalApplicationText = applicationText || 
      'בקשה להצטרפות לקהילה. אני מעוניין להיות חלק מהקהילה ולתרום להיוניס.';

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
    } else {
      console.log('Application created successfully');
    }

    console.log('Registration completed successfully with DOB and gender - NO EMAIL SENT YET');
    
    // 🔥 KEY: Different success message - no mention of email confirmation
    return NextResponse.json({ 
      success: true,
      userId: authData.user.id,
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