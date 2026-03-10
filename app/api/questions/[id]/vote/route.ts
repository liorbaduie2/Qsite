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

    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id')
      .eq('id', questionId)
      .maybeSingle();

    if (questionError) {
      console.error('Question vote lookup error:', questionError);
      return NextResponse.json(
        { error: 'שגיאה באיתור השאלה' },
        { status: 500 }
      );
    }

    if (!question) {
      return NextResponse.json(
        { error: 'השאלה לא נמצאה' },
        { status: 404 }
      );
    }

    const { data: existing, error: existingError } = await supabase
      .from('votes')
      .select('id, vote_type')
      .eq('question_id', questionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingError) {
      console.error('Question vote existing lookup error:', existingError);
      return NextResponse.json(
        { error: 'שגיאה בבדיקת ההצבעה הקיימת' },
        { status: 500 }
      );
    }

    let didMutateVote = false;
    if (existing?.vote_type === voteType) {
      const { error: deleteError } = await supabase
        .from('votes')
        .delete()
        .eq('question_id', questionId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Question vote delete error:', deleteError);
        return NextResponse.json(
          { error: 'שגיאה בהסרת ההצבעה' },
          { status: 500 }
        );
      }

      didMutateVote = true;
    } else if (existing) {
      const { data: updatedVote, error: updateError } = await supabase
        .from('votes')
        .update({ vote_type: voteType })
        .eq('id', existing.id)
        .eq('vote_type', existing.vote_type)
        .select('id')
        .maybeSingle();

      if (updateError) {
        console.error('Question vote update error:', updateError);
        return NextResponse.json(
          { error: 'שגיאה בעדכון ההצבעה' },
          { status: 500 }
        );
      }

      didMutateVote = !!updatedVote;
    } else {
      const { data: insertedVote, error: insertError } = await supabase
        .from('votes')
        .insert({
          user_id: user.id,
          question_id: questionId,
          vote_type: voteType,
        })
        .select('id')
        .maybeSingle();

      if (insertError && insertError.code !== '23505') {
        console.error('Question vote insert error:', insertError);
        return NextResponse.json(
          { error: 'שגיאה בשמירת ההצבעה' },
          { status: 500 }
        );
      }

      didMutateVote = !!insertedVote;
    }

    const { data: finalVote, error: finalVoteError } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('question_id', questionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (finalVoteError) {
      console.error('Question vote final lookup error:', finalVoteError);
      return NextResponse.json(
        { error: 'שגיאה בקריאת מצב ההצבעה' },
        { status: 500 }
      );
    }

    const resolvedVote =
      finalVote?.vote_type === 1 || finalVote?.vote_type === -1
        ? finalVote.vote_type
        : null;

    const { data: updatedQuestion, error: updatedQuestionError } = await supabase
      .from('questions')
      .select('votes_count, author_id, last_upvote_notification_count, most_rated_notified_at')
      .eq('id', questionId)
      .single();

    if (updatedQuestionError) {
      console.error('Question vote updated question lookup error:', updatedQuestionError);
      return NextResponse.json(
        { error: 'שגיאה בקריאת מצב השאלה' },
        { status: 500 }
      );
    }

    const votesCount = updatedQuestion?.votes_count ?? 0;
    const authorId = updatedQuestion?.author_id;
    const lastNotified = updatedQuestion?.last_upvote_notification_count ?? 0;
    const becameUpvote = didMutateVote && resolvedVote === 1 && existing?.vote_type !== 1;

    // Notify on upvotes only: first upvote, then every 5 (5, 10, 15, ...)
    if (becameUpvote && authorId && authorId !== user.id) {
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
          metadata: { upvoteCountSnapshot: votesCount },
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
          metadata: { upvoteCountSnapshot: votesCount },
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
    if (becameUpvote && authorId && !updatedQuestion?.most_rated_notified_at) {
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
      userVote: resolvedVote,
    });
  } catch (error) {
    console.error('Question vote POST error:', error);
    return NextResponse.json(
      { error: 'שגיאה בעדכון ההצבעה' },
      { status: 500 }
    );
  }
}

