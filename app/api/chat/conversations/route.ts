import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/chat/conversations
 * List conversations for current user with other user profile and last message.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    const { data: convs, error } = await supabase
      .from('chat_conversations')
      .select('id, user1_id, user2_id, created_at')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Conversations fetch error:', error);
      return NextResponse.json({ error: 'שגיאה בטעינת שיחות' }, { status: 500 });
    }

    const list: Array<{
      id: string;
      otherUser: { id: string; username: string; full_name: string | null; avatar_url: string | null };
      lastMessage: { content: string; created_at: string; sender_id: string } | null;
      created_at: string;
      unread_count: number;
    }> = [];

    for (const c of convs || []) {
      const otherId = c.user1_id === user.id ? c.user2_id : c.user1_id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', otherId)
        .single();

      const { data: lastMsg } = await supabase
        .from('chat_messages')
        .select('content, created_at, sender_id')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: readState } = await supabase
        .from('chat_conversation_read_state')
        .select('last_read_at')
        .eq('user_id', user.id)
        .eq('conversation_id', c.id)
        .maybeSingle();

      const lastReadAt = readState?.last_read_at ?? null;
      let unread_count = 0;
      if (lastReadAt) {
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', c.id)
          .neq('sender_id', user.id)
          .gt('created_at', lastReadAt);
        unread_count = count ?? 0;
      } else {
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', c.id)
          .neq('sender_id', user.id);
        unread_count = count ?? 0;
      }

      list.push({
        id: c.id,
        otherUser: profile || { id: otherId, username: '', full_name: null, avatar_url: null },
        lastMessage: lastMsg ? { content: lastMsg.content, created_at: lastMsg.created_at, sender_id: lastMsg.sender_id } : null,
        created_at: c.created_at,
        unread_count,
      });
    }

    return NextResponse.json({ conversations: list });
  } catch (e) {
    console.error('Conversations API error:', e);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
