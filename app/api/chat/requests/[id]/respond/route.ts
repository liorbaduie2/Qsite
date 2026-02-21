import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/chat/requests/[id]/respond
 * Body: { action: 'accept' | 'decline' | 'block' }
 * Only the receiver can respond. Accept creates conversation and updates request; block inserts user_blocks.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await context.params;
    if (!requestId) {
      return NextResponse.json({ error: 'מזהה בקשה חסר' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action === 'accept' || body.action === 'decline' || body.action === 'block' ? body.action : null;
    if (!action) {
      return NextResponse.json({ error: 'פעולה לא תקינה (accept / decline / block)' }, { status: 400 });
    }

    const { data: req, error: fetchErr } = await supabase
      .from('chat_requests')
      .select('id, sender_id, receiver_id, status')
      .eq('id', requestId)
      .single();

    if (fetchErr || !req) {
      return NextResponse.json({ error: 'בקשת צ\'אט לא נמצאה' }, { status: 404 });
    }
    if (req.receiver_id !== user.id) {
      return NextResponse.json({ error: 'רק מקבל הבקשה יכול לאשר, לדחות או לחסום' }, { status: 403 });
    }
    if (req.status !== 'pending') {
      return NextResponse.json({ error: 'הבקשה כבר טופלה' }, { status: 409 });
    }

    const now = new Date().toISOString();

    if (action === 'block') {
      await supabase.from('user_blocks').insert({
        blocker_id: user.id,
        blocked_id: req.sender_id,
      }).then(() => {});
      await supabase
        .from('chat_requests')
        .update({ status: 'declined', responded_at: now })
        .eq('id', requestId);
      return NextResponse.json({ success: true, message: 'המשתמש נחסם' });
    }

    if (action === 'decline') {
      await supabase
        .from('chat_requests')
        .update({ status: 'declined', responded_at: now })
        .eq('id', requestId);
      return NextResponse.json({ success: true, message: 'הבקשה נדחתה' });
    }

    // accept
    const u1 = req.sender_id < req.receiver_id ? req.sender_id : req.receiver_id;
    const u2 = req.sender_id < req.receiver_id ? req.receiver_id : req.sender_id;

    const { data: existingConv } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('user1_id', u1)
      .eq('user2_id', u2)
      .maybeSingle();

    if (!existingConv) {
      const { error: insertConvErr } = await supabase
        .from('chat_conversations')
        .insert({ user1_id: u1, user2_id: u2 });
      if (insertConvErr) {
        console.error('Create conversation error:', insertConvErr);
        return NextResponse.json({ error: 'שגיאה ביצירת שיחה' }, { status: 500 });
      }
    }

    await supabase
      .from('chat_requests')
      .update({ status: 'accepted', responded_at: now })
      .eq('id', requestId);

    const { data: conv } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('user1_id', u1)
      .eq('user2_id', u2)
      .single();

    return NextResponse.json({ success: true, message: 'הבקשה אושרה', conversationId: conv?.id });
  } catch (e) {
    console.error('Chat respond API error:', e);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
