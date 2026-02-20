// app/api/auth/check-availability - uses Supabase admin client (same as register)
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

const ALLOWED_FIELDS = ['phone', 'email', 'username'] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

// Map form field to profiles column (currently 1:1)
const PROFILES_COLUMN: Record<AllowedField, string> = {
  phone: 'phone',
  email: 'email',
  username: 'username',
};

export async function POST(request: NextRequest) {
  try {
    let body: { field?: string; value?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'שדה וערך נדרשים' }, { status: 400 });
    }
    const { field, value } = body ?? {};
    if (!field || value === undefined || value === null || String(value).trim() === '') {
      return NextResponse.json({ error: 'שדה וערך נדרשים' }, { status: 400 });
    }

    if (!ALLOWED_FIELDS.includes(field as AllowedField)) {
      return NextResponse.json({ error: 'שדה לא חוקי' }, { status: 400 });
    }

    const column = PROFILES_COLUMN[field as AllowedField];
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq(column, String(value).trim())
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Check availability Supabase error:', error);
      return NextResponse.json(
        { error: 'שגיאה בבדיקת זמינות', details: error.message },
        { status: 500 }
      );
    }

    const isAvailable = data == null;
    return NextResponse.json({
      available: isAvailable,
      message: isAvailable ? 'זמין' : 'כבר תפוס',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Check availability error:', message, err);
    return NextResponse.json(
      { error: message.includes('Missing Supabase') ? 'שגיאת הגדרה' : 'שגיאת שרת' },
      { status: 500 }
    );
  }
}
