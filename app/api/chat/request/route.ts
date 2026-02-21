import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/chat/request
 * Body: { receiverUsername: string } or { receiverId: string }
 * Send a chat request to another user. Fails if blocked, self, or duplicate pending.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'יש להתחבר כדי לשלוח בקשת צ\'אט' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const receiverUsername = typeof body.receiverUsername === 'string' ? body.receiverUsername.trim() : null;
    const receiverId = typeof body.receiverId === 'string' ? body.receiverId.trim() : null;

    let targetId: string | null = null;
    if (receiverId) {
      targetId = receiverId;
    } else if (receiverUsername) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', receiverUsername)
        .single();
      if (!profile?.id) {
        return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
      }
      targetId = profile.id;
    }

    if (!targetId) {
      return NextResponse.json({ error: 'נא לציין משתמש (receiverUsername או receiverId)' }, { status: 400 });
    }

    if (targetId === user.id) {
      return NextResponse.json({ error: 'לא ניתן לשלוח בקשת צ\'אט לעצמך' }, { status: 400 });
    }

    // Check if receiver has blocked sender
    const { data: blockedByThem } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', targetId)
      .eq('blocked_id', user.id)
      .maybeSingle();
    if (blockedByThem) {
      return NextResponse.json({ error: 'אין אפשרות לשלוח בקשת צ\'אט למשתמש זה' }, { status: 403 });
    }

    // Check if sender has blocked receiver (optional: don't allow either)
    const { data: blockedByMe } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', targetId)
      .maybeSingle();
    if (blockedByMe) {
      return NextResponse.json({ error: 'הסר חסימה ממשתמש זה כדי לשלוח בקשת צ\'אט' }, { status: 403 });
    }

    // Check existing request (any status) - unique (sender_id, receiver_id)
    const { data: existing } = await supabase
      .from('chat_requests')
      .select('id, status')
      .eq('sender_id', user.id)
      .eq('receiver_id', targetId)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'pending') {
        return NextResponse.json({ error: 'בקשת צ\'אט כבר נשלחה וממתינה לאישור' }, { status: 409 });
      }
      if (existing.status === 'accepted') {
        return NextResponse.json({ error: 'יש כבר שיחה פעילה עם משתמש זה' }, { status: 409 });
      }
      // declined: allow re-sending by deleting old and inserting new, or update to pending
      await supabase
        .from('chat_requests')
        .update({ status: 'pending', responded_at: null })
        .eq('id', existing.id);
      return NextResponse.json({ success: true, message: 'בקשת הצ\'אט נשלחה' }, { status: 201 });
    }

    const { error: insertErr } = await supabase
      .from('chat_requests')
      .insert({ sender_id: user.id, receiver_id: targetId, status: 'pending' });

    if (insertErr) {
      console.error('Chat request insert error:', insertErr);
      return NextResponse.json({ error: 'שגיאה בשליחת בקשת צ\'אט' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'בקשת הצ\'אט נשלחה' }, { status: 201 });
  } catch (e) {
    console.error('Chat request API error:', e);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
