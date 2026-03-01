import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/profile/[username]/like
 * Returns whether the current user has liked this profile and the total count. Anonymous returns liked: false.
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
      .select('id, profile_likes_count')
      .eq('username', username.trim())
      .single();

    if (profileError || !profileRow) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profileId = profileRow.id;
    const likes_count = typeof (profileRow as { profile_likes_count?: number }).profile_likes_count === 'number'
      ? (profileRow as { profile_likes_count: number }).profile_likes_count
      : 0;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ liked: false, likes_count });
    }

    const { data: existing } = await supabase
      .from('profile_likes')
      .select('profile_id')
      .eq('profile_id', profileId)
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      liked: !!existing,
      likes_count,
    });
  } catch (e) {
    console.error('Profile like GET error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/profile/[username]/like
 * Toggle like on profile. Requires auth. Returns updated likes_count.
 */
export async function POST(
  _request: NextRequest,
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

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('id, profile_likes_count')
      .eq('username', username.trim())
      .single();

    if (profileError || !profileRow) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profileId = profileRow.id;
    if (profileId === user.id) {
      return NextResponse.json({ error: 'Cannot like your own profile' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('profile_likes')
      .select('profile_id')
      .eq('profile_id', profileId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      const { error: deleteError } = await supabase
        .from('profile_likes')
        .delete()
        .eq('profile_id', profileId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Profile unlike error:', deleteError);
        return NextResponse.json({ error: 'Failed to remove like' }, { status: 500 });
      }
    } else {
      const { error: insertError } = await supabase
        .from('profile_likes')
        .insert({ profile_id: profileId, user_id: user.id });

      if (insertError) {
        console.error('Profile like error:', insertError);
        return NextResponse.json({ error: 'Failed to add like' }, { status: 500 });
      }
    }

    const { data: updated } = await supabase
      .from('profiles')
      .select('profile_likes_count')
      .eq('id', profileId)
      .single();

    const likes_count = typeof (updated as { profile_likes_count?: number })?.profile_likes_count === 'number'
      ? (updated as { profile_likes_count: number }).profile_likes_count
      : 0;

    return NextResponse.json({
      liked: !existing,
      likes_count,
    });
  } catch (e) {
    console.error('Profile like API error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
