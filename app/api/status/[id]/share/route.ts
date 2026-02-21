import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** PATCH: Set shared_to_profile for this status (only one per user on profile) */
export async function PATCH(
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

    const body = await request.json().catch(() => ({}));
    const share = body?.share !== false;

    const { data: status, error: fetchErr } = await supabase
      .from('user_statuses')
      .select('id, user_id, stars_count')
      .eq('id', statusId)
      .single();

    if (fetchErr || !status || status.user_id !== user.id) {
      return NextResponse.json({ error: 'סטטוס לא נמצא או שאין הרשאה' }, { status: 404 });
    }

    if (share) {
      await supabase
        .from('user_statuses')
        .update({ shared_to_profile: false })
        .eq('user_id', user.id);
    } else {
      const { data: myStatuses } = await supabase
        .from('user_statuses')
        .select('id, stars_count')
        .eq('user_id', user.id);
      const maxStars = Math.max(0, ...(myStatuses || []).map((s: { stars_count?: number }) => s.stars_count || 0));
      if (status.stars_count != null && status.stars_count >= maxStars && maxStars > 0) {
        await supabase
          .from('user_statuses')
          .update({ is_legendary: true })
          .eq('id', statusId);
      }
    }

    await supabase
      .from('user_statuses')
      .update({ shared_to_profile: share })
      .eq('id', statusId);

    return NextResponse.json({ success: true, sharedToProfile: share });
  } catch (err) {
    console.error('Status share PATCH error:', err);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
