import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { createNotification } from '@/lib/notifications';

/** POST: Toggle star for current user on this status */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: statusId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'יש להתחבר כדי לסמן בכוכב' }, { status: 401 });
    }

    const { data: status } = await supabase
      .from('user_statuses')
      .select('id, user_id')
      .eq('id', statusId)
      .single();

    if (!status) {
      return NextResponse.json({ error: 'סטטוס לא נמצא' }, { status: 404 });
    }

    const { data: existing } = await supabase
      .from('status_stars')
      .select('id')
      .eq('status_id', statusId)
      .eq('user_id', user.id)
      .maybeSingle();

    const addedStar = !existing;
    if (existing) {
      await supabase.from('status_stars').delete().eq('id', existing.id);
    } else {
      await supabase.from('status_stars').insert({
        status_id: statusId,
        user_id: user.id,
      });
    }

    const { data: updated } = await supabase
      .from('user_statuses')
      .select('stars_count, leading_notified_at')
      .eq('id', statusId)
      .single();

    // Notify status owner on new star (each new star = one notification)
    if (addedStar && status.user_id && status.user_id !== user.id) {
      await createNotification({
        user_id: status.user_id,
        type: 'status_star',
        title: 'מישהו סימן את הסטטוס שלך בכוכב',
        message: 'הסטטוס שלך קיבל כוכב חדש.',
        status_id: statusId,
        from_user_id: user.id,
      });
    }

    // "סטטוס מוביל": notify once when this status becomes the top (highest stars)
    if (addedStar && !updated?.leading_notified_at) {
      const { data: topStatus } = await supabase
        .from('user_statuses')
        .select('id, leading_notified_at')
        .eq('is_active', true)
        .order('stars_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (topStatus?.id === statusId) {
        await createNotification({
          user_id: status.user_id,
          type: 'status_leading',
          title: 'הסטטוס שלך הגיע לחשיפה גבוהה',
          message: 'הסטטוס שלך מופיע כעת כסטטוס מוביל.',
          status_id: statusId,
        });
        const admin = getAdminClient();
        await admin
          .from('user_statuses')
          .update({ leading_notified_at: new Date().toISOString() })
          .eq('id', statusId);
      }
    }

    return NextResponse.json({
      starred: addedStar,
      starsCount: updated?.stars_count ?? 0,
    });
  } catch (err) {
    console.error('Status star POST error:', err);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
