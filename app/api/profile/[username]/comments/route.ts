import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/profile/[username]/comments
 * Returns profile comments for the given username (newest first).
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
    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .single();

    if (profileError || !profileRow) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: rows, error } = await supabase
      .from('profile_comments')
      .select('id, content, created_at, author_id')
      .eq('profile_id', profileRow.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Profile comments GET error:', error);
      return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
    }

    const authorIds = [...new Set((rows || []).map((r) => r.author_id))];
    const authorProfiles: Record<string, { username: string; avatar_url: string | null }> = {};
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', authorIds);
      (profiles || []).forEach((p) => {
        authorProfiles[p.id] = { username: p.username, avatar_url: p.avatar_url ?? null };
      });
    }

    const comments = (rows || []).map((r) => {
      const author = authorProfiles[r.author_id];
      return {
        id: r.id,
        content: r.content,
        created_at: r.created_at,
        author_id: r.author_id,
        author_username: author?.username ?? null,
        author_avatar_url: author?.avatar_url ?? null,
      };
    });

    return NextResponse.json({ comments });
  } catch (e) {
    console.error('Profile comments API error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/profile/[username]/comments
 * Create a comment on the profile. Requires auth. No edit after post.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!content || content.length < 1) {
      return NextResponse.json({ error: 'Comment content required' }, { status: 400 });
    }

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .single();

    if (profileError || !profileRow) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: inserted, error } = await supabase
      .from('profile_comments')
      .insert({
        profile_id: profileRow.id,
        author_id: user.id,
        content,
      })
      .select('id, content, created_at, author_id')
      .single();

    if (error) {
      console.error('Profile comment POST error:', error);
      return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
    }

    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', inserted.author_id)
      .single();

    return NextResponse.json({
      comment: {
        id: inserted.id,
        content: inserted.content,
        created_at: inserted.created_at,
        author_id: inserted.author_id,
        author_username: authorProfile?.username ?? null,
        author_avatar_url: authorProfile?.avatar_url ?? null,
      },
    });
  } catch (e) {
    console.error('Profile comment POST error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
