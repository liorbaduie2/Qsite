import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ACTION_LABELS: Record<string, string> = {
  question_deleted: 'הסרת שאלה',
  question_restored: 'שחזור שאלה',
  appeal_rejected: 'דחיית ערעור',
  status_deleted: 'הסרת סטטוס',
  report_handled: 'טיפול בדיווח',
  content_removed: 'הסרת תוכן',
  user_suspended: 'השעיית משתמש',
  reputation_deducted: 'ניכוי מוניטין',
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'חסר אימות' }, { status: 401 });
    }

    const { data: perms } = await supabase.rpc('get_user_admin_permissions', {
      user_id: user.id,
    });
    if (perms?.role !== 'owner') {
      return NextResponse.json(
        { error: 'רק בעלים יכול לצפות ביומן הפעילות' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const actionType = searchParams.get('action_type') || '';
    const actorId = searchParams.get('actor_id') || '';
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
    const offset = Number(searchParams.get('offset')) || 0;

    let query = supabase
      .from('admin_activity_log')
      .select('id, action_type, actor_id, target_type, target_id, details, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (actionType) {
      query = query.eq('action_type', actionType);
    }
    if (actorId) {
      query = query.eq('actor_id', actorId);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('activity-log GET error:', error);
      return NextResponse.json({ error: 'שגיאה בטעינת היומן' }, { status: 500 });
    }

    const list = rows || [];
    const actorIds = [...new Set(list.map((r: { actor_id: string | null }) => r.actor_id).filter(Boolean))];
    const { data: profiles } = actorIds.length > 0
      ? await supabase.from('profiles').select('id, username').in('id', actorIds)
      : { data: [] };
    const profilesById = new Map(
      (profiles || []).map((p: { id: string; username: string }) => [p.id, p])
    );

    const formatted = list.map((r: {
      id: string;
      action_type: string;
      actor_id: string | null;
      target_type: string | null;
      target_id: string | null;
      details: unknown;
      created_at: string;
    }) => ({
      id: r.id,
      actionType: r.action_type,
      actionLabel: ACTION_LABELS[r.action_type] || r.action_type,
      actorId: r.actor_id,
      actorUsername: r.actor_id ? profilesById.get(r.actor_id)?.username ?? '' : '',
      targetType: r.target_type,
      targetId: r.target_id,
      details: r.details,
      createdAt: r.created_at,
    }));

    return NextResponse.json({
      entries: formatted,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Activity log GET error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
