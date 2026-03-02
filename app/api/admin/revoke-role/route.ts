//app/api/admin/revoke-role/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const { targetUserId, reason, reasonHebrew } = await request.json();

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

    // Only owner can revoke roles
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
        { error: 'רק בעלים יכול לבטל תפקידים' },
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
      console.error('Error loading previous role before revoke:', beforeError);
    }

    // Call the SQL function to revoke role
    const { data, error } = await supabase.rpc('owner_revoke_role', {
      target_user_id: targetUserId,
      revoked_by_user_id: user.id,
      reason: reason,
      reason_hebrew: reasonHebrew,
    });

    if (error) {
      console.error('Error revoking role:', error);
      return NextResponse.json(
        {
          error: 'שגיאה בביטול תפקיד',
        },
        { status: 500 },
      );
    }

    // Log admin activity: role revoked
    try {
      await supabase.from('admin_activity_log').insert({
        action_type: 'role_revoked',
        actor_id: user.id,
        target_type: 'user',
        target_id: targetUserId,
        details: {
          old_role: beforeRole?.role ?? null,
          old_is_hidden: beforeRole?.is_hidden ?? null,
          reason: reason || null,
          reason_hebrew: reasonHebrew || null,
        },
      });
    } catch (logError) {
      console.error('Error logging role revoke:', logError);
      // Do not fail the main response if logging fails
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Revoke role error:', error);
    return NextResponse.json(
      {
        error: 'שגיאה פנימית בשרת',
      },
      { status: 500 },
    );
  }
}

