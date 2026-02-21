import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/chat/unread-count
 * Returns the number of conversations that have at least one unread message for the current user.
 * Unread = latest message in conversation was sent by the other user and is newer than user's last_read_at (or no read state).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ count: 0 });
    }

    const { data: convs, error } = await supabase
      .from('chat_conversations')
      .select('id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (error || !convs?.length) {
      return NextResponse.json({ count: 0 });
    }

    let count = 0;
    for (const c of convs) {
      const { data: lastMsg } = await supabase
        .from('chat_messages')
        .select('sender_id, created_at')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!lastMsg || lastMsg.sender_id === user.id) continue;

      const { data: readState } = await supabase
        .from('chat_conversation_read_state')
        .select('last_read_at')
        .eq('user_id', user.id)
        .eq('conversation_id', c.id)
        .maybeSingle();

      const lastReadAt = readState?.last_read_at ? new Date(readState.last_read_at).getTime() : null;
      const lastMsgAt = new Date(lastMsg.created_at).getTime();
      if (lastReadAt === null || lastMsgAt > lastReadAt) count++;
    }

    return NextResponse.json({ count });
  } catch (e) {
    console.error('Unread count API error:', e);
    return NextResponse.json({ count: 0 });
  }
}
