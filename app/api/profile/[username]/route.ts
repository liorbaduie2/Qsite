import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/profile/[username]
 * Returns public profile by username. No email, phone, or approval fields.
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
      .select('id, username, full_name, avatar_url, bio, location, website, reputation, is_verified, is_moderator, created_at')
      .eq('username', username.trim())
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

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

    return NextResponse.json({ profile, sharedStatus });
  } catch (e) {
    console.error('Profile API error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
