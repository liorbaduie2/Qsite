import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/chat/blocked/[userId]
 * Unblock a user (remove row where blocker_id = auth.uid(), blocked_id = userId).
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetUserId } = await context.params;
    if (!targetUserId) {
      return NextResponse.json({ error: 'מזהה משתמש חסר' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', targetUserId);

    if (error) {
      console.error('Unblock error:', error);
      return NextResponse.json({ error: 'שגיאה בהסרת חסימה' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'החסימה הוסרה' });
  } catch (e) {
    console.error('Unblock API error:', e);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
