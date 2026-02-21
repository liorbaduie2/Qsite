import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** GET: Admin only – star count and list of users who starred this status */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: statusId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_moderator')
      .eq('id', user.id)
      .single();

    if (!profile?.is_moderator) {
      return NextResponse.json({ error: 'גישה למנהלים בלבד' }, { status: 403 });
    }

    const { data: status, error: statusErr } = await supabase
      .from('user_statuses')
      .select('id, content, stars_count, created_at')
      .eq('id', statusId)
      .single();

    if (statusErr || !status) {
      return NextResponse.json({ error: 'סטטוס לא נמצא' }, { status: 404 });
    }

    const { data: stars, error: starsErr } = await supabase
      .from('status_stars')
      .select('user_id, created_at')
      .eq('status_id', statusId)
      .order('created_at', { ascending: false });

    if (starsErr) {
      console.error('Error fetching status stars:', starsErr);
      return NextResponse.json({ error: 'שגיאה בטעינת הכוכבים' }, { status: 500 });
    }

    const userIds = [...new Set((stars || []).map((s: { user_id: string }) => s.user_id))];
    let profilesMap: Record<string, { id: string; username: string; full_name?: string | null; avatar_url?: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);
      profilesMap = (profiles || []).reduce(
        (acc, p) => {
          acc[p.id] = p;
          return acc;
        },
        {} as Record<string, { id: string; username: string; full_name?: string | null; avatar_url?: string | null }>
      );
    }

    const users = (stars || []).map((s: { user_id: string; created_at: string }) => {
      const p = profilesMap[s.user_id];
      return {
        id: p?.id ?? s.user_id,
        username: p?.username || 'אנונימי',
        fullName: p?.full_name ?? null,
        avatar_url: p?.avatar_url ?? null,
        starredAt: s.created_at,
      };
    });

    return NextResponse.json({
      statusId: status.id,
      starsCount: status.stars_count ?? 0,
      users,
    });
  } catch (err) {
    console.error('Admin status stars GET error:', err);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
