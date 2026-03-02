import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

type AdminRoleKey = 'owner' | 'guardian' | 'admin' | 'moderator' | 'user';

export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient();

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'חסר אימות' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'אימות לא חוקי' }, { status: 401 });
    }

    // Only owner may manage the matrix
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'owner') {
      return NextResponse.json(
        { error: 'גישה נדחתה - נדרשות הרשאות בעלים' },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from('role_permission_matrix')
      .select('role, permission_key, allowed');

    if (error) {
      console.error('Error fetching permissions matrix:', error);
      return NextResponse.json(
        { error: 'שגיאה בטעינת מטריצת הרשאות' },
        { status: 500 },
      );
    }

    return NextResponse.json({ rows: data ?? [] });
  } catch (error) {
    console.error('Permissions matrix GET error:', error);
    return NextResponse.json(
      { error: 'שגיאה פנימית בשרת' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const body = await request.json();
    const { role, permissionKey, allowed } = body as {
      role: AdminRoleKey;
      permissionKey: string;
      allowed: boolean;
    };

    if (!role || !permissionKey || typeof allowed !== 'boolean') {
      return NextResponse.json(
        { error: 'נתוני בקשה חסרים או לא חוקיים' },
        { status: 400 },
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'חסר אימות' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'אימות לא חוקי' }, { status: 401 });
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'owner') {
      return NextResponse.json(
        { error: 'גישה נדחתה - נדרשות הרשאות בעלים' },
        { status: 403 },
      );
    }

    const { error } = await supabase
      .from('role_permission_matrix')
      .upsert(
        {
          role,
          permission_key: permissionKey,
          allowed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'role,permission_key' },
      );

    if (error) {
      console.error('Error updating permissions matrix:', error);
      return NextResponse.json(
        { error: 'שגיאה בעדכון מטריצת הרשאות' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Permissions matrix PUT error:', error);
    return NextResponse.json(
      { error: 'שגיאה פנימית בשרת' },
      { status: 500 },
    );
  }
}

