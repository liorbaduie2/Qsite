import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/chat/check?otherUsername=... or ?otherUserId=...
 * Returns status with the other user: none | pending_sent | pending_received | accepted | blocked_them | blocked_by_them
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ status: 'none' });
    }

    const { searchParams } = new URL(request.url);
    const otherUsername = searchParams.get('otherUsername');
    const otherUserId = searchParams.get('otherUserId');

    let targetId: string | null = null;
    if (otherUserId) {
      targetId = otherUserId;
    } else if (otherUsername) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', otherUsername)
        .single();
      targetId = profile?.id ?? null;
    }

    if (!targetId) {
      return NextResponse.json({ status: 'none' });
    }

    if (targetId === user.id) {
      return NextResponse.json({ status: 'self' });
    }

    const { data: blockedByThem } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', targetId)
      .eq('blocked_id', user.id)
      .maybeSingle();
    if (blockedByThem) {
      return NextResponse.json({ status: 'blocked_by_them' });
    }

    const { data: blockedByMe } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', targetId)
      .maybeSingle();
    if (blockedByMe) {
      return NextResponse.json({ status: 'blocked_them' });
    }

    const { data: reqSent } = await supabase
      .from('chat_requests')
      .select('id, status')
      .eq('sender_id', user.id)
      .eq('receiver_id', targetId)
      .maybeSingle();

    const { data: reqReceived } = await supabase
      .from('chat_requests')
      .select('id, status')
      .eq('sender_id', targetId)
      .eq('receiver_id', user.id)
      .maybeSingle();

    if (reqSent?.status === 'pending') {
      return NextResponse.json({ status: 'pending_sent', requestId: reqSent.id });
    }
    if (reqReceived?.status === 'pending') {
      return NextResponse.json({ status: 'pending_received', requestId: reqReceived.id });
    }
    if (reqSent?.status === 'accepted' || reqReceived?.status === 'accepted') {
      const u1 = user.id < targetId ? user.id : targetId;
      const u2 = user.id < targetId ? targetId : user.id;
      const { data: conv } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('user1_id', u1)
        .eq('user2_id', u2)
        .single();
      return NextResponse.json({ status: 'accepted', conversationId: conv?.id });
    }

    return NextResponse.json({ status: 'none' });
  } catch (e) {
    console.error('Chat check API error:', e);
    return NextResponse.json({ status: 'none' }, { status: 500 });
  }
}
