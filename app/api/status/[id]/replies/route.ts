import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notifications';

/** GET: List replies for a status */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: statusId } = await params;
    const supabase = await createClient();

    const { data: status } = await supabase
      .from('user_statuses')
      .select('id')
      .eq('id', statusId)
      .single();

    if (!status) {
      return NextResponse.json({ error: 'סטטוס לא נמצא' }, { status: 404 });
    }

    const { data: replies, error } = await supabase
      .from('status_replies')
      .select('id, content, created_at, user_id')
      .eq('status_id', statusId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Status replies GET error:', error);
      return NextResponse.json({ error: 'שגיאה בטעינת התגובות' }, { status: 500 });
    }

    const formatted = (replies || []).map((r: { id: string; content: string; created_at: string; user_id: string }) => ({
      id: r.id,
      content: r.content,
      createdAt: r.created_at,
      userId: r.user_id,
    }));

    return NextResponse.json({ replies: formatted });
  } catch (err) {
    console.error('Status replies GET error:', err);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

/** POST: Create a reply to a status; notify status owner */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: statusId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'יש להתחבר כדי להגיב' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!content || content.length < 1) {
      return NextResponse.json({ error: 'יש להזין תוכן לתגובה' }, { status: 400 });
    }

    const { data: status, error: statusError } = await supabase
      .from('user_statuses')
      .select('id, user_id')
      .eq('id', statusId)
      .single();

    if (statusError || !status) {
      return NextResponse.json({ error: 'סטטוס לא נמצא' }, { status: 404 });
    }

    const { data: reply, error: insertError } = await supabase
      .from('status_replies')
      .insert({
        status_id: statusId,
        user_id: user.id,
        content,
      })
      .select('id, created_at')
      .single();

    if (insertError) {
      console.error('Status reply POST error:', insertError);
      return NextResponse.json({ error: 'שגיאה ביצירת התגובה' }, { status: 500 });
    }

    // Notify status owner when someone replies (unless replying to self)
    if (status.user_id && status.user_id !== user.id) {
      await createNotification({
        user_id: status.user_id,
        type: 'status_reply',
        title: 'מישהו הגיב על הסטטוס שלך',
        message: 'נוספה תגובה חדשה לסטטוס שלך.',
        status_id: statusId,
        from_user_id: user.id,
      });
    }

    return NextResponse.json(
      { success: true, replyId: reply.id, createdAt: reply.created_at },
      { status: 201 }
    );
  } catch (err) {
    console.error('Status reply POST error:', err);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
