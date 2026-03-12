import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireActiveAccount } from '@/lib/account-state';

/** PATCH /api/notifications/[id]/read - Mark one notification as read */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    const access = await requireActiveAccount(supabase, user.id, ['active', 'suspended', 'blocked']);
    if (!access.allowed) return access.errorResponse!;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Notification mark read error:', error);
      return NextResponse.json({ error: 'שגיאה בעדכון ההתראה' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Notification mark read error:', err);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
