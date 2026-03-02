import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

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
      .from('admin_roles_config')
      .select(
        'role_name, role_name_hebrew, max_reputation_deduction, max_suspension_hours, default_reputation_deduction, default_suspension_hours',
      )
      .order('role_name');

    if (error) {
      console.error('Error fetching admin roles config:', error);
      return NextResponse.json(
        { error: 'שגיאה בטעינת הגדרות תפקידים' },
        { status: 500 },
      );
    }

    return NextResponse.json({ roles: data ?? [] });
  } catch (error) {
    console.error('Admin roles GET error:', error);
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
    const {
      roleName,
      maxReputationDeduction,
      maxSuspensionHours,
      defaultReputationDeduction,
      defaultSuspensionHours,
    } = body as {
      roleName: string;
      maxReputationDeduction: number | null;
      maxSuspensionHours: number | null;
      defaultReputationDeduction: number | null;
      defaultSuspensionHours: number | null;
    };

    if (!roleName) {
      return NextResponse.json(
        { error: 'חסר שם תפקיד' },
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
      .from('admin_roles_config')
      .update({
        max_reputation_deduction: maxReputationDeduction,
        max_suspension_hours: maxSuspensionHours,
        default_reputation_deduction: defaultReputationDeduction,
        default_suspension_hours: defaultSuspensionHours,
        updated_at: new Date().toISOString(),
      })
      .eq('role_name', roleName);

    if (error) {
      console.error('Error updating admin role config:', error);
      return NextResponse.json(
        { error: 'שגיאה בעדכון הגדרות תפקיד' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin roles PUT error:', error);
    return NextResponse.json(
      { error: 'שגיאה פנימית בשרת' },
      { status: 500 },
    );
  }
}

