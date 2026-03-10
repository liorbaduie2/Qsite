import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

const ALLOWED_ROLES = new Set(['owner', 'guardian', 'admin']);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    const admin = getAdminClient();
    const { data: roleRow, error: roleError } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError) {
      console.error('Question vote details role lookup error:', roleError);
      return NextResponse.json(
        { error: 'שגיאה בבדיקת הרשאות' },
        { status: 500 }
      );
    }

    if (!roleRow?.role || !ALLOWED_ROLES.has(roleRow.role)) {
      return NextResponse.json({ error: 'אין הרשאה לצפות בהצבעות' }, { status: 403 });
    }

    const { data: question, error: questionError } = await admin
      .from('questions')
      .select('id')
      .eq('id', questionId)
      .is('deleted_at', null)
      .maybeSingle();

    if (questionError) {
      console.error('Question vote details question lookup error:', questionError);
      return NextResponse.json(
        { error: 'שגיאה באיתור השאלה' },
        { status: 500 }
      );
    }

    if (!question) {
      return NextResponse.json({ error: 'השאלה לא נמצאה' }, { status: 404 });
    }

    const { data: voteRows, error: votesError } = await admin
      .from('votes')
      .select(`
        user_id,
        vote_type,
        profiles!votes_user_id_fkey (
          username
        )
      `)
      .eq('question_id', questionId)
      .order('created_at', { ascending: true });

    if (votesError) {
      console.error('Question vote details fetch error:', votesError);
      return NextResponse.json(
        { error: 'שגיאה בטעינת ההצבעות' },
        { status: 500 }
      );
    }

    const upvotes: Array<{ userId: string; username: string }> = [];
    const downvotes: Array<{ userId: string; username: string }> = [];

    for (const row of voteRows ?? []) {
      const entry = {
        userId: row.user_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        username: (row.profiles as any)?.username || 'אנונימי',
      };

      if (row.vote_type === 1) {
        upvotes.push(entry);
      } else if (row.vote_type === -1) {
        downvotes.push(entry);
      }
    }

    return NextResponse.json({ upvotes, downvotes });
  } catch (error) {
    console.error('Question vote details API error:', error);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
