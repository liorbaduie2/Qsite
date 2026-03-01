import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * GET /api/profile/[username]/questions
 * Paginated list of questions by this user. Public (no auth required for viewing).
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

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
      MAX_LIMIT
    );
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0);

    const supabase = await createClient();
    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .single();

    if (profileError || !profileRow) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: questionsRows, count: total } = await supabase
      .from('questions')
      .select('id, title, created_at', { count: 'exact' })
      .eq('author_id', profileRow.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const questions = (questionsRows || []).map((q) => ({
      id: q.id,
      title: q.title,
      created_at: q.created_at,
    }));

    return NextResponse.json({
      questions,
      total: total ?? questions.length,
    });
  } catch (e) {
    console.error('Profile questions list error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
