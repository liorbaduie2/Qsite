import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notifications';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: answers, error } = await supabase
      .from('answers')
      .select(`
        id,
        content,
        votes_count,
        is_accepted,
        is_edited,
        created_at,
        author_id,
        parent_answer_id,
        profiles!answers_author_id_fkey (
          id,
          username,
          avatar_url,
          reputation,
          last_seen_at
        )
      `)
      .eq('question_id', id)
      .order('parent_answer_id', { ascending: true, nullsFirst: true })
      .order('is_accepted', { ascending: false })
      .order('votes_count', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching answers:', error);
      return NextResponse.json({ error: 'שגיאה בטעינת התשובות' }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = (answers || []).map((a: Record<string, any>) => ({
      id: a.id,
      content: a.content,
      votes: a.votes_count || 0,
      isAccepted: a.is_accepted || false,
      isEdited: a.is_edited || false,
      createdAt: a.created_at,
      parentAnswerId: a.parent_answer_id ?? null,
      author: {
        id: a.profiles?.id || a.author_id,
        username: a.profiles?.username || 'אנונימי',
        avatar_url: a.profiles?.avatar_url || null,
        reputation: a.profiles?.reputation || 0,
        lastSeenAt: a.profiles?.last_seen_at ?? null,
      },
    }));

    return NextResponse.json({ answers: formatted });
  } catch (error) {
    console.error('Answers GET error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'יש להתחבר כדי להגיב' }, { status: 401 });
    }

    const body = await request.json();
    const { content, parentAnswerId } = body;

    if (!content?.trim() || content.trim().length < 10) {
      return NextResponse.json({ error: 'התשובה חייבת להכיל לפחות 10 תווים' }, { status: 400 });
    }

    const { data: question, error: qError } = await supabase
      .from('questions')
      .select('id, author_id')
      .eq('id', questionId)
      .single();

    if (qError || !question) {
      return NextResponse.json({ error: 'השאלה לא נמצאה' }, { status: 404 });
    }

    const isReply = !!parentAnswerId;
    let parentAnswerAuthorId: string | null = null;
    if (isReply) {
      const { data: parentAnswer, error: parentError } = await supabase
        .from('answers')
        .select('id, author_id')
        .eq('id', parentAnswerId)
        .eq('question_id', questionId)
        .single();
      if (parentError || !parentAnswer) {
        return NextResponse.json({ error: 'התגובה המקורית לא נמצאה' }, { status: 400 });
      }
      parentAnswerAuthorId = parentAnswer.author_id;
    }

    const { data: answer, error: insertError } = await supabase
      .from('answers')
      .insert({
        content: content.trim(),
        question_id: questionId,
        author_id: user.id,
        ...(isReply ? { parent_answer_id: parentAnswerId } : {}),
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating answer:', insertError);
      return NextResponse.json({ error: 'שגיאה ביצירת התשובה' }, { status: 500 });
    }

    if (!isReply) {
      const { data: currentQ } = await supabase
        .from('questions')
        .select('answers_count')
        .eq('id', questionId)
        .single();

      await supabase
        .from('questions')
        .update({
          answers_count: (currentQ?.answers_count || 0) + 1,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', questionId);

      // Notify question author when someone comments (top-level answer)
      if (question.author_id && question.author_id !== user.id) {
        await createNotification({
          user_id: question.author_id,
          type: 'question_answer',
          title: 'מישהו ענה לשאלה שלך',
          message: 'נוספה תשובה חדשה לשאלה שלך.',
          question_id: questionId,
          answer_id: answer.id,
          from_user_id: user.id,
        });
      }
    } else if (parentAnswerAuthorId && parentAnswerAuthorId !== user.id) {
      // Notify parent answer author when someone replies to their answer
      await createNotification({
        user_id: parentAnswerAuthorId,
        type: 'answer_comment',
        title: 'מישהו הגיב לתגובה שלך',
        message: 'נוספה תגובה לתגובה שלך.',
        question_id: questionId,
        answer_id: parentAnswerId,
        from_user_id: user.id,
      });
    }

    return NextResponse.json({ success: true, answerId: answer.id }, { status: 201 });
  } catch (error) {
    console.error('Answers POST error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
