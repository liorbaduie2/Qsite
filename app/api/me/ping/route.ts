import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/me/ping
 * Updates the current user's last_seen_at (heartbeat for online presence).
 * Requires authentication.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      console.error('Ping update error:', error);
      return NextResponse.json(
        { error: 'Failed to update presence' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Ping error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
