import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * GET /api/profile/[username]/replies
 * Paginated list of answers (replies) by this user. Owner only.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .single();

    if (profileError || !profileRow) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profileRow.id !== user.id) {
      return NextResponse.json({ error: 'Only the profile owner can view replies list' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
      MAX_LIMIT
    );
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0);

    const profileId = profileRow.id;

    const { data: repliesRows, count: total } = await supabase
      .from('answers')
      .select('id, content, created_at, question_id', { count: 'exact' })
      .eq('author_id', profileId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const questionIds = [...new Set((repliesRows || []).map((r) => r.question_id))];
    let questionsById: Record<string, { title: string }> = {};
    if (questionIds.length > 0) {
      const { data: qRows } = await supabase
        .from('questions')
        .select('id, title')
        .in('id', questionIds);
      questionsById = (qRows || []).reduce<Record<string, { title: string }>>((acc, q) => {
        acc[q.id] = { title: q.title };
        return acc;
      }, {});
    }

    const replies = (repliesRows || []).map((r) => ({
      id: r.id,
      content: r.content,
      created_at: r.created_at,
      question_id: r.question_id,
      question_title: questionsById[r.question_id]?.title ?? null,
    }));

    return NextResponse.json({
      replies,
      total: total ?? replies.length,
    });
  } catch (e) {
    console.error('Profile replies list error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
