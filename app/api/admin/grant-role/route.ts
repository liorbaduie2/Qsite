// app/api/admin/grant-role/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const {
      targetUserId,
      newRole,
      reason,
      reasonHebrew,
      isHidden,
      temporaryUntil,
    } = await request.json();

    // Get current user from auth header
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

    // Check if caller is owner via permissions helper
    const { data: perms, error: permsError } = await supabase.rpc(
      'get_user_admin_permissions',
      { user_id: user.id },
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
        { error: 'רק בעלים יכול לתת או לשנות תפקידים' },
        { status: 403 },
      );
    }

    // Capture previous role state for logging
    const {
      data: beforeRole,
      error: beforeError,
    } = await supabase
      .from('user_roles')
      .select('role, is_hidden')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (beforeError) {
      console.error('Error loading previous role before grant:', beforeError);
    }

    // Call the SQL function to grant role
    const { data, error } = await supabase.rpc('owner_grant_role', {
      target_user_id: targetUserId,
      new_role: newRole,
      granted_by_user_id: user.id,
      reason: reason || null,
      reason_hebrew: reasonHebrew || null,
      is_hidden: isHidden || false,
      temporary_until: temporaryUntil || null,
    });

    if (error) {
      console.error('Error granting role:', error);
      return NextResponse.json(
        {
          error: 'שגיאה במתן הרשאה',
          details: error.message,
        },
        { status: 500 },
      );
    }

    if (!data?.success) {
      return NextResponse.json(
        {
          error: data?.error || 'שגיאה במתן הרשאה',
        },
        { status: 400 },
      );
    }

    // Load updated role state for logging
    const {
      data: afterRole,
      error: afterError,
    } = await supabase
      .from('user_roles')
      .select('role, is_hidden')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (afterError) {
      console.error('Error loading role after grant:', afterError);
    }

    // Log admin activity: role granted/updated
    try {
      const hadRoleBefore = !!beforeRole?.role;
      await supabase.from('admin_activity_log').insert({
        action_type: hadRoleBefore ? 'role_updated' : 'role_granted',
        actor_id: user.id,
        target_type: 'user',
        target_id: targetUserId,
        details: {
          old_role: beforeRole?.role ?? null,
          new_role: afterRole?.role ?? newRole,
          old_is_hidden: beforeRole?.is_hidden ?? null,
          new_is_hidden:
            afterRole?.is_hidden ??
            (typeof isHidden === 'boolean' ? isHidden : false),
          reason: reason || null,
          reason_hebrew: reasonHebrew || null,
        },
      });
    } catch (logError) {
      console.error('Error logging role grant/update:', logError);
      // Do not fail the main response if logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'התפקיד עודכן בהצלחה',
      data: data,
    });
  } catch (error) {
    console.error('Grant role API error:', error);
    return NextResponse.json(
      { error: 'שגיאה פנימית בשרת' },
      { status: 500 },
    );
  }
}

