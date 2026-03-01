import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/profile/[username]/counts
 * Owner-only. Returns only counts for initial profile render (no lists).
 * Used so the skeleton can hide as soon as profile + counts are ready.
 */
export async function GET(
  _request: NextRequest,
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
      .select('id, questions_count, answers_count, profile_likes_count')
      .eq('username', username.trim())
      .single();

    if (profileError || !profileRow) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profileRow.id !== user.id) {
      return NextResponse.json({ error: 'Only the profile owner can fetch counts' }, { status: 403 });
    }

    const profileId = profileRow.id;
    const answers_count = typeof profileRow.answers_count === 'number' ? profileRow.answers_count : 0;
    const profile_likes_count = typeof (profileRow as { profile_likes_count?: number }).profile_likes_count === 'number'
      ? (profileRow as { profile_likes_count: number }).profile_likes_count
      : 0;

    const { count: questionsTotal } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', profileId)
      .is('deleted_at', null);

    const questions_count = questionsTotal ?? (typeof profileRow.questions_count === 'number' ? profileRow.questions_count : 0);

    return NextResponse.json({
      questions_count,
      answers_count,
      profile_likes_count,
    });
  } catch (e) {
    console.error('Profile counts error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
