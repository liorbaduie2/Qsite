import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      .select('votes_count')
      .eq('id', questionId)
      .single();

    return NextResponse.json({
      voteType,
      votes: updatedQuestion?.votes_count ?? 0,
    });
  } catch (error) {
    console.error('Question vote POST error:', error);
    return NextResponse.json(
      { error: 'שגיאה בעדכון ההצבעה' },
      { status: 500 }
    );
  }
}

