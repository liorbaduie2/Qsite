import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/chat/conversations/[id]/messages?limit=50&before=...
 * Paginated messages; caller must be participant.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await context.params;
    if (!conversationId) {
      return NextResponse.json({ error: 'מזהה שיחה חסר' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    const { data: conv } = await supabase
      .from('chat_conversations')
      .select('id, user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (!conv || (conv.user1_id !== user.id && conv.user2_id !== user.id)) {
      return NextResponse.json({ error: 'שיחה לא נמצאה או שאין הרשאה' }, { status: 403 });
    }

    const otherId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
    const { data: blockedByThem } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', otherId)
      .eq('blocked_id', user.id)
      .maybeSingle();
    const { data: blockedByMe } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', otherId)
      .maybeSingle();
    if (blockedByThem || blockedByMe) {
      return NextResponse.json(
        { error: 'השיחה לא זמינה — נחסמת או שהמשתמש חסם אותך' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100);
    const before = searchParams.get('before');

    let query = supabase
      .from('chat_messages')
      .select('id, conversation_id, sender_id, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('Messages fetch error:', error);
      return NextResponse.json({ error: 'שגיאה בטעינת הודעות' }, { status: 500 });
    }

    const messages = (rows || []).reverse();
    return NextResponse.json({ messages });
  } catch (e) {
    console.error('Messages GET API error:', e);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}

/**
 * POST /api/chat/conversations/[id]/messages
 * Body: { content: string }
 * Send a message; caller must be participant.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await context.params;
    if (!conversationId) {
      return NextResponse.json({ error: 'מזהה שיחה חסר' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    const { data: conv } = await supabase
      .from('chat_conversations')
      .select('id, user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (!conv || (conv.user1_id !== user.id && conv.user2_id !== user.id)) {
      return NextResponse.json({ error: 'שיחה לא נמצאה או שאין הרשאה' }, { status: 403 });
    }

    const otherId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
    const { data: blockedByThem } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', otherId)
      .eq('blocked_id', user.id)
      .maybeSingle();
    const { data: blockedByMe } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', otherId)
      .maybeSingle();
    if (blockedByThem || blockedByMe) {
      return NextResponse.json(
        { error: 'השיחה לא זמינה — נחסמת או שהמשתמש חסם אותך' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!content) {
      return NextResponse.json({ error: 'תוכן ההודעה ריק' }, { status: 400 });
    }
    if (content.length > 10000) {
      return NextResponse.json({ error: 'ההודעה ארוכה מדי' }, { status: 400 });
    }

    const { data: msg, error } = await supabase
      .from('chat_messages')
      .insert({ conversation_id: conversationId, sender_id: user.id, content })
      .select('id, conversation_id, sender_id, content, created_at')
      .single();

    if (error) {
      console.error('Message insert error:', error);
      return NextResponse.json({ error: 'שגיאה בשליחת הודעה' }, { status: 500 });
    }

    return NextResponse.json({ message: msg });
  } catch (e) {
    console.error('Messages POST API error:', e);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
