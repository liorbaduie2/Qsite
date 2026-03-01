import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { createNotification } from '@/lib/notifications';

export async function POST(
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
      return NextResponse.json(
        { error: 'יש להתחבר כדי להצביע לשאלה' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const voteType = body?.voteType;

    if (voteType !== 1 && voteType !== -1) {
      return NextResponse.json(
        { error: 'סוג הצבעה לא חוקי' },
        { status: 400 }
      );
    }

    const { data: question } = await supabase
      .from('questions')
      .select('id')
      .eq('id', questionId)
      .maybeSingle();

    if (!question) {
      return NextResponse.json(
        { error: 'השאלה לא נמצאה' },
        { status: 404 }
      );
    }

    const { data: existing } = await supabase
      .from('votes')
      .select('id, vote_type')
      .eq('question_id', questionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      if (existing.vote_type !== voteType) {
        await supabase
          .from('votes')
          .update({ vote_type: voteType })
          .eq('id', existing.id);
      }
      // If vote type is the same, do nothing – user keeps their existing vote
    } else {
      await supabase.from('votes').insert({
        user_id: user.id,
        question_id: questionId,
        vote_type: voteType,
      });
    }

    const { data: updatedQuestion } = await supabase
      .from('questions')
      .select('votes_count, author_id, last_upvote_notification_count, most_rated_notified_at')
      .eq('id', questionId)
      .single();

    const votesCount = updatedQuestion?.votes_count ?? 0;
    const authorId = updatedQuestion?.author_id;
    const lastNotified = updatedQuestion?.last_upvote_notification_count ?? 0;

    // Notify on upvotes only: first upvote, then every 5 (5, 10, 15, ...)
    if (voteType === 1 && authorId && authorId !== user.id) {
      let newLastNotified = lastNotified;
      const shouldNotifyFirst = votesCount >= 1 && lastNotified < 1;
      const shouldNotifyMilestone =
        votesCount >= 5 && votesCount % 5 === 0 && votesCount > lastNotified;

      if (shouldNotifyFirst) {
        await createNotification({
          user_id: authorId,
          type: 'question_vote',
          title: 'מישהו הצביע בעד השאלה שלך',
          message: 'השאלה שלך קיבלה את ההצבעה הראשונה.',
          question_id: questionId,
          from_user_id: user.id,
        });
        newLastNotified = 1;
      } else if (shouldNotifyMilestone) {
        await createNotification({
          user_id: authorId,
          type: 'question_vote',
          title: 'עוד הצבעות לשאלה שלך',
          message: `השאלה שלך הגיעה ל־${votesCount} הצבעות.`,
          question_id: questionId,
          from_user_id: user.id,
        });
        newLastNotified = votesCount;
      }

      if (newLastNotified !== lastNotified) {
        const admin = getAdminClient();
        await admin
          .from('questions')
          .update({ last_upvote_notification_count: newLastNotified })
          .eq('id', questionId);
      }
    }

    // "Most rated" (enters top 5): notify once when question first enters top 5 by votes
    if (authorId && !updatedQuestion?.most_rated_notified_at) {
      const { data: topIds } = await supabase
        .from('questions')
        .select('id')
        .order('votes_count', { ascending: false })
        .limit(5);
      const topQuestionIds = (topIds ?? []).map((r: { id: string }) => r.id);
      if (topQuestionIds.includes(questionId)) {
        await createNotification({
          user_id: authorId,
          type: 'question_most_rated',
          title: 'השאלה שלך נכנסה להשאלות המדורגות ביותר',
          message: 'השאלה שלך מופיעה כעת ברשימת השאלות המדורגות ביותר.',
          question_id: questionId,
        });
        const admin = getAdminClient();
        await admin
          .from('questions')
          .update({ most_rated_notified_at: new Date().toISOString() })
          .eq('id', questionId);
      }
    }

    return NextResponse.json({
      voteType,
      votes: votesCount,
    });
  } catch (error) {
    console.error('Question vote POST error:', error);
    return NextResponse.json(
      { error: 'שגיאה בעדכון ההצבעה' },
      { status: 500 }
    );
  }
}

