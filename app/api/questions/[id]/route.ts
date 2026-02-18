import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

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
          reputation
        ),
        question_tags (
          tags (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !question) {
      return NextResponse.json({ error: 'השאלה לא נמצאה' }, { status: 404 });
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: (question.profiles as any)?.id || question.author_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        username: (question.profiles as any)?.username || 'אנונימי',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        avatar_url: (question.profiles as any)?.avatar_url || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reputation: (question.profiles as any)?.reputation || 0,
      },
      tags: (question.question_tags || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((qt: any) => qt.tags?.name)
        .filter(Boolean),
    };

    return NextResponse.json({ question: formatted });
  } catch (error) {
    console.error('Question GET error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
