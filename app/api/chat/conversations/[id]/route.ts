import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/chat/conversations/[id]
 * Returns conversation and the other participant's profile. Caller must be participant.
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

    const { data: conv, error } = await supabase
      .from('chat_conversations')
      .select('id, user1_id, user2_id, created_at')
      .eq('id', conversationId)
      .single();

    if (error || !conv) {
      return NextResponse.json({ error: 'שיחה לא נמצאה' }, { status: 404 });
    }
    if (conv.user1_id !== user.id && conv.user2_id !== user.id) {
      return NextResponse.json({ error: 'אין הרשאה לצפות בשיחה זו' }, { status: 403 });
    }

    const otherId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;

    const { data: blockedByThem } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', otherId)
      .eq('blocked_id', user.id)
      .maybeSingle();
    if (blockedByThem) {
      return NextResponse.json(
        { error: 'השיחה לא זמינה — נחסמת או שהמשתמש חסם אותך' },
        { status: 403 }
      );
    }
    const { data: blockedByMe } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', otherId)
      .maybeSingle();
    if (blockedByMe) {
      return NextResponse.json(
        { error: 'השיחה לא זמינה — נחסמת או שהמשתמש חסם אותך' },
        { status: 403 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .eq('id', otherId)
      .single();

    return NextResponse.json({
      conversation: { id: conv.id, created_at: conv.created_at },
      otherUser: profile || { id: otherId, username: '', full_name: null, avatar_url: null },
    });
  } catch (e) {
    console.error('Conversation GET API error:', e);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
