import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const { targetUserId, isHidden } = await request.json();

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json(
        { error: 'חסר מזהה משתמש יעד' },
        { status: 400 },
      );
    }

    if (typeof isHidden !== 'boolean') {
      return NextResponse.json(
        { error: 'ערך isHidden חייב להיות מסוג boolean' },
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

    // Only owner can change role-tag visibility
    const { data: perms, error: permsError } = await supabase.rpc(
      'get_user_admin_permissions',
      {
        user_id: user.id,
      },
    );

    if (permsError) {
      console.error('get_user_admin_permissions error:', permsError);
      return NextResponse.json(
        { error: 'שגיאה בבדיקת הרשאות' },
        { status: 500 },
      );
    }

    if (!perms || perms.role !== 'owner') {
      return NextResponse.json(
        { error: 'רק בעלים יכול לשנות נראות תג תפקיד' },
        { status: 403 },
      );
    }

    // Load current role row for target user
    const {
      data: roleRow,
      error: roleError,
    } = await supabase
      .from('user_roles')
      .select('role, is_hidden')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (roleError) {
      console.error('Error loading user role:', roleError);
      return NextResponse.json(
        { error: 'שגיאה בטעינת תפקיד המשתמש' },
        { status: 500 },
      );
    }

    if (!roleRow) {
      return NextResponse.json(
        { error: 'למשתמש אין תפקיד פעיל לשינוי נראות תג' },
        { status: 400 },
      );
    }

    if (roleRow.is_hidden === isHidden) {
      return NextResponse.json({
        success: true,
        unchanged: true,
        role: roleRow.role,
        is_hidden: roleRow.is_hidden,
      });
    }

    const { error: updateError } = await supabase
      .from('user_roles')
      .update({ is_hidden: isHidden })
      .eq('user_id', targetUserId);

    if (updateError) {
      console.error('Error updating role visibility:', updateError);
      return NextResponse.json(
        { error: 'שגיאה בעדכון נראות תג התפקיד' },
        { status: 500 },
      );
    }

    // Log in admin_activity_log
    try {
      await supabase.from('admin_activity_log').insert({
        action_type: 'role_visibility_changed',
        actor_id: user.id,
        target_type: 'user',
        target_id: targetUserId,
        details: {
          role: roleRow.role,
          old_is_hidden: roleRow.is_hidden,
          new_is_hidden: isHidden,
        },
      });
    } catch (logError) {
      console.error('Error logging role_visibility_changed:', logError);
      // Do not fail the main operation if logging fails
    }

    return NextResponse.json({
      success: true,
      role: roleRow.role,
      old_is_hidden: roleRow.is_hidden,
      new_is_hidden: isHidden,
    });
  } catch (error) {
    console.error('set-role-visibility API error:', error);
    return NextResponse.json(
      { error: 'שגיאה פנימית בשרת' },
      { status: 500 },
    );
  }
}

