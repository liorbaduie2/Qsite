import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireOwner, isAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireOwner(request, 'רק בעלים יכול לצפות בערעורים');
    if (!isAdminAuth(auth)) return auth;

    const supabase = getAdminClient();

    const { data: appeals, error } = await supabase
      .from('question_deletion_appeals')
      .select(`
        id,
        activity_log_id,
        user_id,
        appeal_message,
        status,
        decided_by,
        decided_at,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('question-deletion-appeals GET error:', error);
      return NextResponse.json({ error: 'שגיאה בטעינת הערעורים' }, { status: 500 });
    }

    const list = appeals || [];
    if (list.length === 0) {
      return NextResponse.json({ appeals: [] });
    }

    const logIds = [...new Set(list.map((a: { activity_log_id: string }) => a.activity_log_id))];
    const { data: logs } = await supabase
      .from('admin_activity_log')
      .select('id, details, created_at')
      .in('id', logIds);

    const logsById = new Map(
      (logs || []).map((l: { id: string; details: unknown; created_at: string }) => [l.id, l])
    );

    const userIds = [...new Set(list.map((a: { user_id: string; decided_by?: string }) => [a.user_id, a.decided_by]).flat().filter(Boolean))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds);
    const profilesById = new Map(
      (profiles || []).map((p: { id: string; username: string }) => [p.id, p])
    );

    const formatted = list.map((a: {
      id: string;
      activity_log_id: string;
      user_id: string;
      appeal_message: string;
      status: string;
      decided_by?: string;
      decided_at?: string;
      created_at: string;
    }) => {
      const log = logsById.get(a.activity_log_id);
      const details = (log?.details as { question_title?: string; reason?: string; author_id?: string }) || {};
      return {
        id: a.id,
        activityLogId: a.activity_log_id,
        userId: a.user_id,
        username: profilesById.get(a.user_id)?.username ?? '',
        appealMessage: a.appeal_message,
        status: a.status,
        decidedBy: a.decided_by,
        decidedByUsername: a.decided_by ? profilesById.get(a.decided_by)?.username : null,
        decidedAt: a.decided_at ?? null,
        createdAt: a.created_at,
        questionTitle: details.question_title ?? '',
        deletionReason: details.reason ?? '',
        deletionDate: log?.created_at ?? null,
      };
    });

    return NextResponse.json({ appeals: formatted });
  } catch (error) {
    console.error('Question deletion appeals GET error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
