import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/profile/[username]/likes
 * Returns list of users who liked this profile. Only for the profile owner (auth.uid() === profile id).
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
      .select('id')
      .eq('username', username.trim())
      .single();

    if (profileError || !profileRow) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profileRow.id !== user.id) {
      return NextResponse.json({ error: 'Only the profile owner can view who liked' }, { status: 403 });
    }

    const { data: likes } = await supabase
      .from('profile_likes')
      .select('user_id')
      .eq('profile_id', profileRow.id)
      .order('created_at', { ascending: false });

    if (!likes?.length) {
      return NextResponse.json({ likers: [] });
    }

    const userIds = likes.map((l) => l.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    const orderMap = new Map(userIds.map((id, i) => [id, i]));
    const likers = (profiles || [])
      .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
      .map((p) => ({
        id: p.id,
        username: p.username,
        avatar_url: p.avatar_url ?? null,
      }));

    return NextResponse.json({ likers });
  } catch (e) {
    console.error('Profile likes list error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
