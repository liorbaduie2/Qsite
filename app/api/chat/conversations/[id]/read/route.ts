import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/chat/conversations/[id]/read
 * Mark the conversation as read for the current user (set last_read_at = now).
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

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('chat_conversation_read_state')
      .upsert(
        { user_id: user.id, conversation_id: conversationId, last_read_at: now },
        { onConflict: 'user_id,conversation_id' }
      );

    if (error) {
      console.error('Mark read error:', error);
      return NextResponse.json({ error: 'שגיאה בעדכון סטטוס קריאה' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Mark read API error:', e);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
