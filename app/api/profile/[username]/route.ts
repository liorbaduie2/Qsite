import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/profile/[username]
 * Returns public profile by username with questions_count, profile_likes_count, replies_count, and questions list.
 * No detailed reply content; only counters (questions count, replies count) and question list for activity.
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
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, location, website, reputation, is_verified, is_moderator, created_at, questions_count, profile_likes_count, account_state')
      .eq('username', username.trim())
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if ((data as any).account_state === 'blocked') {
      return NextResponse.json({ error: 'פרופיל לא נמצא' }, { status: 404 });
    }

    const profileId = data.id;

    // Resolve admin role info (for public badge) via permissions helper
    let role: string | undefined;
    let roleHebrew: string | undefined;
    let isHiddenRole = false;
    try {
      const { data: perms } = await supabase.rpc('get_user_admin_permissions', {
        user_id: profileId,
      });
      if (perms && typeof perms.role === 'string') {
        role = perms.role;
        roleHebrew = perms.role_hebrew as string | undefined;
        isHiddenRole = Boolean(perms.is_hidden);
      }
    } catch {
      // If permissions lookup fails, skip exposing role info on public profile
    }

    const includePublicRole =
      role &&
      role !== 'user' &&
      !isHiddenRole;

    const profile = {
      id: String(data.id),
      username: String(data.username),
      full_name: data.full_name ? String(data.full_name) : null,
      avatar_url: data.avatar_url ? String(data.avatar_url) : null,
      bio: data.bio ? String(data.bio) : null,
      location: data.location ? String(data.location) : null,
      website: data.website ? String(data.website) : null,
      reputation: data.reputation ? Number(data.reputation) : 0,
      is_verified: Boolean(data.is_verified),
      is_moderator: Boolean(data.is_moderator),
      created_at: data.created_at ? String(data.created_at) : null,
      questions_count: typeof data.questions_count === 'number' ? data.questions_count : 0,
      profile_likes_count: typeof (data as { profile_likes_count?: number }).profile_likes_count === 'number'
        ? (data as { profile_likes_count: number }).profile_likes_count
        : 0,
      ...(includePublicRole && role && roleHebrew
        ? { role, role_hebrew: roleHebrew }
        : {}),
    };

    const { data: sharedRow } = await supabase
      .from('user_statuses')
      .select('id, content, created_at')
      .eq('user_id', data.id)
      .eq('shared_to_profile', true)
      .maybeSingle();

    const sharedStatus = sharedRow
      ? { id: sharedRow.id, content: sharedRow.content, createdAt: sharedRow.created_at }
      : null;

    // Activity: questions by this user (non-deleted), order by created_at DESC
    const { data: questionsRows } = await supabase
      .from('questions')
      .select('id, title, created_at')
      .eq('author_id', profileId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    const questions = (questionsRows || []).map((q) => ({
      id: q.id,
      title: q.title,
      created_at: q.created_at,
    }));

    // Replies count only (no detailed list on public profile)
    const { count: repliesCount } = await supabase
      .from('answers')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', profileId);

    return NextResponse.json({
      profile,
      sharedStatus,
      questions,
      replies_count: repliesCount ?? 0,
    });
  } catch (e) {
    console.error('Profile API error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
