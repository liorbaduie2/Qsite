import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

/** PATCH: Update appeal status and optionally unblock the user (owner only). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: perms } = await supabase.rpc('get_user_admin_permissions', {
      user_id: user.id,
    });
    if (perms?.role !== 'owner') {
      return NextResponse.json({ error: 'אין הרשאה לעדכן ערעור חסימה' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const status = typeof body?.status === 'string' ? body.status.trim() : '';
    const unblock = body?.unblock === true;

    if (!['reviewed', 'resolved'].includes(status) && !unblock) {
      return NextResponse.json({ error: 'נא לציין סטטוס (reviewed/resolved) או unblock' }, { status: 400 });
    }

    const { data: appeal } = await supabase
      .from('blocked_account_appeals')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!appeal) {
      return NextResponse.json({ error: 'ערעור לא נמצא' }, { status: 404 });
    }

    const updates: { status?: string } = {};
    if (status) updates.status = status;

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('blocked_account_appeals')
        .update(updates)
        .eq('id', id);
      if (updateError) {
        console.error('blocked_account_appeals update error:', updateError);
        return NextResponse.json({ error: 'שגיאה בעדכון הערעור' }, { status: 500 });
      }
    }

    if (unblock) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ account_state: 'active', updated_at: new Date().toISOString() })
        .eq('id', appeal.user_id);
      if (profileError) {
        console.error('profile unblock error:', profileError);
        return NextResponse.json({ error: 'שגיאה בשחרור החסימה' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Blocked account appeal PATCH error:', err);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
