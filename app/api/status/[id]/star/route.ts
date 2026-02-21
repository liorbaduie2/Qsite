import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      .select('id')
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
      .select('stars_count')
      .eq('id', statusId)
      .single();

    return NextResponse.json({
      starred: !existing,
      starsCount: updated?.stars_count ?? 0,
    });
  } catch (err) {
    console.error('Status star POST error:', err);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
