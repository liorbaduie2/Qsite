import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const COOLDOWN_MINUTES = 5;

/** GET: Current user's active status, history (last 5), and cooldown info */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ canPost: false, active: null, history: [], nextPostAt: null });
    }

    const COOLDOWN_MS = COOLDOWN_MINUTES * 60 * 1000;

    const { data: activeRow } = await supabase
      .from('user_statuses')
      .select('id, content, stars_count, shared_to_profile, is_legendary, created_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    const { data: historyRows } = await supabase
      .from('user_statuses')
      .select('id, content, stars_count, shared_to_profile, is_legendary, created_at')
      .eq('user_id', user.id)
      .eq('is_active', false)
      .order('created_at', { ascending: false })
      .limit(20);

    const latest = activeRow || (historyRows && historyRows[0]) || null;
    const lastPostedAt = latest ? new Date(latest.created_at).getTime() : null;
    const canPost = lastPostedAt === null || (Date.now() - lastPostedAt >= COOLDOWN_MS);
    const nextPostAt = lastPostedAt && !canPost
      ? new Date(lastPostedAt + COOLDOWN_MS).toISOString()
      : null;

    const active = activeRow ? {
      id: activeRow.id,
      content: activeRow.content,
      starsCount: activeRow.stars_count || 0,
      sharedToProfile: activeRow.shared_to_profile || false,
      isLegendary: activeRow.is_legendary || false,
      createdAt: activeRow.created_at,
    } : null;

    const history = (historyRows || []).map((r) => ({
      id: r.id,
      content: r.content,
      starsCount: r.stars_count || 0,
      sharedToProfile: r.shared_to_profile || false,
      isLegendary: r.is_legendary || false,
      createdAt: r.created_at,
    }));

    return NextResponse.json({
      canPost,
      nextPostAt,
      active,
      history,
    });
  } catch (err) {
    console.error('Status me GET error:', err);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
