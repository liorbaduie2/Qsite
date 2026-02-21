import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/chat/blocked
 * List users blocked by current user (blocker_id = auth.uid()).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    const { data: blocks, error } = await supabase
      .from('user_blocks')
      .select('blocked_id, created_at')
      .eq('blocker_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Blocked list error:', error);
      return NextResponse.json({ error: 'שגיאה בטעינת רשימת חסימות' }, { status: 500 });
    }

    if (!blocks?.length) {
      return NextResponse.json({ blocked: [] });
    }

    const ids = blocks.map((b) => b.blocked_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', ids);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const blocked = blocks.map((b) => ({
      blocked_id: b.blocked_id,
      created_at: b.created_at,
      profile: profileMap.get(b.blocked_id) || { id: b.blocked_id, username: '', full_name: null, avatar_url: null },
    }));

    return NextResponse.json({ blocked });
  } catch (e) {
    console.error('Blocked API error:', e);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
