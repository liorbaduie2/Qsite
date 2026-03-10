import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; answerId: string }> }
) {
  try {
    const { id: questionId, answerId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'יש להתחבר כדי להצביע לתשובה' },
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

    const { data: answer, error: answerError } = await supabase
      .from('answers')
      .select('id')
      .eq('id', answerId)
      .eq('question_id', questionId)
      .maybeSingle();

    if (answerError) {
      console.error('Answer vote lookup error:', answerError);
      return NextResponse.json(
        { error: 'שגיאה באיתור התשובה' },
        { status: 500 }
      );
    }

    if (!answer) {
      return NextResponse.json(
        { error: 'התשובה לא נמצאה' },
        { status: 404 }
      );
    }

    const { data: existing, error: existingError } = await supabase
      .from('votes')
      .select('id, vote_type')
      .eq('answer_id', answerId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingError) {
      console.error('Answer vote existing lookup error:', existingError);
      return NextResponse.json(
        { error: 'שגיאה בבדיקת ההצבעה הקיימת' },
        { status: 500 }
      );
    }

    if (existing?.vote_type === voteType) {
      const { error: deleteError } = await supabase
        .from('votes')
        .delete()
        .eq('answer_id', answerId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Answer vote delete error:', deleteError);
        return NextResponse.json(
          { error: 'שגיאה בהסרת ההצבעה' },
          { status: 500 }
        );
      }
    } else if (existing) {
      const { error: updateError } = await supabase
        .from('votes')
        .update({ vote_type: voteType })
        .eq('id', existing.id)
        .eq('vote_type', existing.vote_type);

      if (updateError) {
        console.error('Answer vote update error:', updateError);
        return NextResponse.json(
          { error: 'שגיאה בעדכון ההצבעה' },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabase.from('votes').insert({
        user_id: user.id,
        answer_id: answerId,
        vote_type: voteType,
      });

      if (insertError && insertError.code !== '23505') {
        console.error('Answer vote insert error:', insertError);
        return NextResponse.json(
          { error: 'שגיאה בשמירת ההצבעה' },
          { status: 500 }
        );
      }
    }

    const { data: finalVote, error: finalVoteError } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('answer_id', answerId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (finalVoteError) {
      console.error('Answer vote final lookup error:', finalVoteError);
      return NextResponse.json(
        { error: 'שגיאה בקריאת מצב ההצבעה' },
        { status: 500 }
      );
    }

    const resolvedVote =
      finalVote?.vote_type === 1 || finalVote?.vote_type === -1
        ? finalVote.vote_type
        : null;

    const { data: updatedAnswer, error: updatedAnswerError } = await supabase
      .from('answers')
      .select('votes_count')
      .eq('id', answerId)
      .single();

    if (updatedAnswerError) {
      console.error('Answer vote updated answer lookup error:', updatedAnswerError);
      return NextResponse.json(
        { error: 'שגיאה בקריאת מצב התשובה' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      voteType,
      votes: updatedAnswer?.votes_count ?? 0,
      userVote: resolvedVote,
    });
  } catch (error) {
    console.error('Answer vote POST error:', error);
    return NextResponse.json(
      { error: 'שגיאה בעדכון ההצבעה' },
      { status: 500 }
    );
  }
}
