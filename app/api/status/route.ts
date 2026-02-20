import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const COOLDOWN_MINUTES = 5;

/** GET: Public feed – active statuses only, ordered by stars then date */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: rows, error } = await supabase
      .from('user_statuses')
      .select(`
        id,
        content,
        is_active,
        shared_to_profile,
        stars_count,
        created_at,
        user_id,
        profiles!user_statuses_user_id_fkey (
          id,
          username,
          avatar_url,
          full_name
        )
      `)
      .eq('is_active', true)
      .order('stars_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching status feed:', error);
      return NextResponse.json({ error: 'שגיאה בטעינת הסטטוסים' }, { status: 500 });
    }

    const statusIds = (rows || []).map((r: { id: string }) => r.id);
    let starredSet: Set<string> = new Set();
    if (user && statusIds.length > 0) {
      const { data: stars } = await supabase
        .from('status_stars')
        .select('status_id')
        .eq('user_id', user.id)
        .in('status_id', statusIds);
      starredSet = new Set((stars || []).map((s: { status_id: string }) => s.status_id));
    }

    const feed = (rows || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      content: r.content,
      starsCount: r.stars_count || 0,
      createdAt: r.created_at,
      author: {
        id: (r.profiles as Record<string, unknown>)?.id ?? r.user_id,
        username: (r.profiles as Record<string, unknown>)?.username || 'אנונימי',
        fullName: (r.profiles as Record<string, unknown>)?.full_name || null,
        avatar_url: (r.profiles as Record<string, unknown>)?.avatar_url ?? null,
      },
      starredByMe: starredSet.has(r.id as string),
    }));

    return NextResponse.json({ feed });
  } catch (err) {
    console.error('Status GET error:', err);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

/** POST: Create new status (5-min cooldown; demote previous; trim history to 5) */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'יש להתחבר כדי לפרסם סטטוס' }, { status: 401 });
    }

    const body = await request.json();
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!content || content.length < 1) {
      return NextResponse.json({ error: 'יש להזין תוכן לסטטוס' }, { status: 400 });
    }

    const COOLDOWN_MS = COOLDOWN_MINUTES * 60 * 1000;

    const { data: latest } = await supabase
      .from('user_statuses')
      .select('id, created_at, is_active')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latest) {
      const lastAt = new Date(latest.created_at).getTime();
      if (Date.now() - lastAt < COOLDOWN_MS) {
        const nextAt = new Date(lastAt + COOLDOWN_MS);
        return NextResponse.json({
          error: `ניתן לפרסם סטטוס חדש בעוד ${COOLDOWN_MINUTES} דקות`,
          nextPostAt: nextAt.toISOString(),
        }, { status: 429 });
      }
    }

    const { data: currentActive } = await supabase
      .from('user_statuses')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (currentActive) {
      await supabase
        .from('user_statuses')
        .update({ is_active: false })
        .eq('id', currentActive.id);
    }

    const { data: history } = await supabase
      .from('user_statuses')
      .select('id, created_at')
      .eq('user_id', user.id)
      .eq('is_active', false)
      .order('created_at', { ascending: true });

    const toKeep = 5;
    if (history && history.length >= toKeep) {
      const toDelete = history.slice(0, history.length - toKeep);
      for (const row of toDelete) {
        await supabase.from('user_statuses').delete().eq('id', row.id);
      }
    }

    const { data: newStatus, error: insertErr } = await supabase
      .from('user_statuses')
      .insert({
        user_id: user.id,
        content,
        is_active: true,
        shared_to_profile: false,
      })
      .select('id, created_at')
      .single();

    if (insertErr) {
      console.error('Error creating status:', insertErr);
      return NextResponse.json({ error: 'שגיאה ביצירת הסטטוס' }, { status: 500 });
    }

    const nextPostAt = new Date(Date.now() + COOLDOWN_MS);
    return NextResponse.json({
      success: true,
      statusId: newStatus.id,
      createdAt: newStatus.created_at,
      nextPostAt: nextPostAt.toISOString(),
    }, { status: 201 });
  } catch (err) {
    console.error('Status POST error:', err);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
