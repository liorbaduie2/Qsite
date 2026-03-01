import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** GET /api/notifications - List notifications for current user */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
    const offset = Number(searchParams.get('offset')) || 0;

    const { data: rows, error } = await supabase
      .from('notifications')
      .select('id, type, title, message, question_id, answer_id, status_id, from_user_id, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Notifications GET error:', error);
      return NextResponse.json({ error: 'שגיאה בטעינת ההתראות' }, { status: 500 });
    }

    return NextResponse.json({
      notifications: rows ?? [],
      limit,
      offset,
    });
  } catch (err) {
    console.error('Notifications GET error:', err);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

/** PATCH /api/notifications - Mark notifications as read (body: { ids?: string[] }, or omit to mark all) */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body?.ids) ? body.ids as string[] : undefined;

    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (ids && ids.length > 0) {
      query = query.in('id', ids);
    }

    const { error } = await query;

    if (error) {
      console.error('Notifications PATCH error:', error);
      return NextResponse.json({ error: 'שגיאה בעדכון ההתראות' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Notifications PATCH error:', err);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
