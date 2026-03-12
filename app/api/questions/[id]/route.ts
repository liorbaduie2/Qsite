import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireActiveAccount } from '@/lib/account-state';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: question, error } = await supabase
      .from('questions')
      .select(`
        id,
        title,
        content,
        votes_count,
        replies_count,
        views_count,
        answers_count,
        is_answered,
        is_pinned,
        is_closed,
        created_at,
        updated_at,
        last_activity_at,
        author_id,
        profiles!questions_author_id_fkey (
          id,
          username,
          avatar_url,
          reputation,
          last_seen_at,
          account_state
        ),
        question_tags (
          tags (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !question) {
      return NextResponse.json({ error: 'השאלה לא נמצאה' }, { status: 404 });
    }

    type QuestionAuthorProfile = {
      id: string;
      username: string | null;
      avatar_url: string | null;
      reputation: number | null;
      last_seen_at: string | null;
      account_state: string | null;
    };

    const rawProfile = question.profiles as QuestionAuthorProfile | QuestionAuthorProfile[] | null;
    const authorProfile = Array.isArray(rawProfile) ? (rawProfile[0] ?? null) : rawProfile;
    if (authorProfile?.account_state === 'blocked') {
      return NextResponse.json({ error: 'השאלה לא נמצאה' }, { status: 404 });
    }

    let userVote: 1 | -1 | 0 = 0;
    if (user?.id) {
      const { data: voteRow, error: voteError } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('question_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (voteError) {
        console.error('Question GET vote lookup error:', voteError);
        return NextResponse.json({ error: 'שגיאה בטעינת ההצבעה' }, { status: 500 });
      }

      userVote =
        voteRow?.vote_type === 1 || voteRow?.vote_type === -1
          ? voteRow.vote_type
          : 0;
    }

    const formatted = {
      id: question.id,
      title: question.title,
      content: question.content,
      votes: question.votes_count || 0,
      replies: question.replies_count || 0,
      views: question.views_count || 0,
      answers: question.answers_count || 0,
      isAnswered: question.is_answered || false,
      isPinned: question.is_pinned || false,
      isClosed: question.is_closed || false,
      createdAt: question.created_at,
      updatedAt: question.updated_at,
      lastActivityAt: question.last_activity_at,
      author: {
        id: authorProfile?.id || question.author_id,
        username: authorProfile?.username || 'אנונימי',
        avatar_url: authorProfile?.avatar_url || null,
        reputation: authorProfile?.reputation || 0,
        lastSeenAt: authorProfile?.last_seen_at ?? null,
      },
      tags: (question.question_tags || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((qt: any) => qt.tags?.name)
        .filter(Boolean),
      userVote,
    };

    return NextResponse.json({ question: formatted });
  } catch (error) {
    console.error('Question GET error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'יש להתחבר כדי לערוך' }, { status: 401 });
    }

    const access = await requireActiveAccount(supabase, user.id);
    if (!access.allowed) return access.errorResponse!;

    const body = await request.json();
    const { title, content, tags } = body;
    if (!title?.trim() || title.trim().length < 5) {
      return NextResponse.json({ error: 'הכותרת חייבת להכיל לפחות 5 תווים' }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: 'תוכן השאלה הוא שדה חובה' }, { status: 400 });
    }
    if (!Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json({ error: 'יש להוסיף לפחות תגית אחת' }, { status: 400 });
    }

    const submittedTags = tags
      .filter((t: unknown): t is string => typeof t === 'string')
      .map((t: string) => t.replace(/^#+/, '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const uniqueTags = Array.from(new Set(submittedTags)).slice(0, 5);
    if (uniqueTags.length === 0) {
      return NextResponse.json({ error: 'יש לבחור לפחות תגית קיימת אחת' }, { status: 400 });
    }

    const { data: result, error } = await supabase.rpc('update_question_with_permission', {
      p_question_id: id,
      p_title: title.trim(),
      p_content: content.trim(),
      p_tags: uniqueTags,
    });

    if (error) {
      console.error('Question PATCH RPC error:', error);
      return NextResponse.json({ error: 'שגיאה בעדכון השאלה' }, { status: 500 });
    }

    const res = result as { success?: boolean; error?: string };
    if (!res?.success) {
      return NextResponse.json(
        { error: res?.error || 'אין הרשאה לערוך שאלה זו' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Question PATCH error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    const access = await requireActiveAccount(supabase, user.id);
    if (!access.allowed) return access.errorResponse!;

    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
    if (!reason) {
      return NextResponse.json({ error: 'נא לציין סיבת ההסרה' }, { status: 400 });
    }

    const { data: result, error } = await supabase.rpc('delete_question_as_admin', {
      p_question_id: id,
      p_deletion_reason: reason,
    });

    if (error) {
      console.error('Question DELETE RPC error:', error);
      return NextResponse.json({ error: 'שגיאה בהסרת השאלה' }, { status: 500 });
    }

    const res = result as { success?: boolean; error?: string };
    if (!res?.success) {
      return NextResponse.json(
        { error: res?.error || 'אין הרשאה להסיר שאלה' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Question DELETE error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
