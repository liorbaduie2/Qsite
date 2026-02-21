import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/chat/requests
 * Returns pending requests TO current user (incoming) and optionally FROM current user (sent).
 * Query: ?scope=incoming|sent|all (default: all)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'all';

    const incoming: Array<{
      id: string;
      sender_id: string;
      receiver_id: string;
      status: string;
      created_at: string;
      sender: { id: string; username: string; full_name: string | null; avatar_url: string | null };
    }> = [];
    const sent: Array<{
      id: string;
      sender_id: string;
      receiver_id: string;
      status: string;
      created_at: string;
      receiver: { id: string; username: string; full_name: string | null; avatar_url: string | null };
    }> = [];

    if (scope === 'incoming' || scope === 'all') {
      const { data: rows, error } = await supabase
        .from('chat_requests')
        .select(`
          id,
          sender_id,
          receiver_id,
          status,
          created_at
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!error && rows?.length) {
        const senderIds = [...new Set(rows.map((r) => r.sender_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', senderIds);
        const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
        rows.forEach((r) => {
          incoming.push({
            ...r,
            created_at: r.created_at,
            sender: profileMap.get(r.sender_id) || { id: r.sender_id, username: '', full_name: null, avatar_url: null },
          });
        });
      }
    }

    if (scope === 'sent' || scope === 'all') {
      const { data: rows, error } = await supabase
        .from('chat_requests')
        .select(`
          id,
          sender_id,
          receiver_id,
          status,
          created_at
        `)
        .eq('sender_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!error && rows?.length) {
        const receiverIds = [...new Set(rows.map((r) => r.receiver_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', receiverIds);
        const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
        rows.forEach((r) => {
          sent.push({
            ...r,
            created_at: r.created_at,
            receiver: profileMap.get(r.receiver_id) || { id: r.receiver_id, username: '', full_name: null, avatar_url: null },
          });
        });
      }
    }

    return NextResponse.json({ incoming, sent });
  } catch (e) {
    console.error('Chat requests API error:', e);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
