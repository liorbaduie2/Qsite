import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const { userId, accountState, adminId } = await request.json();

    if (!userId || !accountState || !adminId) {
      return NextResponse.json({ error: 'חסרים פרמטרים נדרשים' }, { status: 400 });
    }

    if (!['active', 'suspended', 'blocked'].includes(accountState)) {
      return NextResponse.json({ error: 'סטטוס לא חוקי' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'חסר אימות' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'אימות לא חוקי' }, { status: 401 });
    }

    const { data: adminPerms } = await supabase.rpc('get_user_admin_permissions', {
      user_id: user.id,
    });

    if (!adminPerms?.can_suspend_user && !adminPerms?.can_block_user) {
      return NextResponse.json({ error: 'אין הרשאה לשנות סטטוס חשבון' }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ account_state: accountState, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating account_state:', updateError);
      return NextResponse.json({ error: 'שגיאה בעדכון סטטוס החשבון' }, { status: 500 });
    }

    // If restoring to active, deactivate any active suspensions
    if (accountState === 'active') {
      await supabase
        .from('user_suspensions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);
    }

    // Log the action
    const actionLabels: Record<string, string> = {
      active: 'שחזור חשבון',
      suspended: 'השעיית חשבון',
      blocked: 'חסימת חשבון',
    };

    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    await supabase.from('admin_activity_log').insert({
      admin_id: adminId,
      action_type: 'account_state_change',
      target_type: 'user',
      target_id: userId,
      details: {
        new_state: accountState,
        action_label: actionLabels[accountState] || accountState,
        target_username: targetProfile?.username,
      },
    });

    return NextResponse.json({
      success: true,
      message: actionLabels[accountState] || 'עודכן בהצלחה',
      accountState,
    });
  } catch (error) {
    console.error('Set account state error:', error);
    return NextResponse.json({ error: 'שגיאה פנימית בשרת' }, { status: 500 });
  }
}
