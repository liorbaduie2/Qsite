import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const role = perms?.role;
    if (role !== 'owner' && role !== 'guardian') {
      return NextResponse.json(
        { error: 'רק בעלים או ממונה מוסמך יכולים לצפות בבקשות להסרה' },
        { status: 403 }
      );
    }

    const { data: requests, error } = await supabase
      .from('question_removal_requests')
      .select('id, question_id, requested_by, reason, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('question-removal-requests GET error:', error);
      return NextResponse.json({ error: 'שגיאה בטעינת הבקשות' }, { status: 500 });
    }

    const reqs = requests || [];
    if (reqs.length === 0) {
      return NextResponse.json({ requests: [] });
    }

    const questionIds = [...new Set(reqs.map((r: { question_id: string }) => r.question_id))];
    const { data: questionsData } = await supabase
      .from('questions')
      .select('id, title, author_id')
      .in('id', questionIds);

    const requesterIds = [...new Set(reqs.map((r: { requested_by: string }) => r.requested_by))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', requesterIds);

    const questionsById = new Map(
      (questionsData || []).map((q: { id: string; title: string; author_id: string }) => [q.id, q])
    );
    const profilesById = new Map(
      (profilesData || []).map((p: { id: string; username: string }) => [p.id, p])
    );

    const list = reqs.map((r: {
      id: string;
      question_id: string;
      requested_by: string;
      reason: string | null;
      status: string;
      created_at: string;
    }) => {
      const q = questionsById.get(r.question_id);
      const p = profilesById.get(r.requested_by);
      return {
        id: r.id,
        questionId: r.question_id,
        questionTitle: q?.title ?? '',
        questionAuthorId: q?.author_id ?? null,
        requestedBy: r.requested_by,
        requesterUsername: p?.username ?? '',
        reason: r.reason ?? '',
        status: r.status,
        createdAt: r.created_at,
      };
    });

    return NextResponse.json({ requests: list });
  } catch (error) {
    console.error('Question removal requests GET error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
