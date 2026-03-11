import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_CONTENT_TYPES = new Set(['question', 'answer', 'status']);
const ALLOWED_REPORT_TYPES = new Set([
  'rule_violation',
  'inappropriate',
  'spam',
]);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const contentType =
      typeof body.contentType === 'string' ? body.contentType.trim() : '';
    const contentId =
      typeof body.contentId === 'string' ? body.contentId.trim() : '';
    const reportType =
      typeof body.reportType === 'string' ? body.reportType.trim() : 'inappropriate';
    const description =
      typeof body.description === 'string' ? body.description.trim() : '';

    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: 'סוג תוכן לא חוקי' },
        { status: 400 }
      );
    }

    if (!contentId) {
      return NextResponse.json(
        { error: 'מזהה תוכן חסר' },
        { status: 400 }
      );
    }

    if (!ALLOWED_REPORT_TYPES.has(reportType)) {
      return NextResponse.json(
        { error: 'סוג דיווח לא חוקי' },
        { status: 400 }
      );
    }

    if (contentType === 'answer') {
      const { data: answer, error: answerError } = await supabase
        .from('answers')
        .select('id')
        .eq('id', contentId)
        .maybeSingle();

      if (answerError) {
        console.error('Content report answer lookup error:', answerError);
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
    } else if (contentType === 'status') {
      const { data: statusRow, error: statusError } = await supabase
        .from('user_statuses')
        .select('id')
        .eq('id', contentId)
        .maybeSingle();

      if (statusError) {
        console.error('Content report status lookup error:', statusError);
        return NextResponse.json(
          { error: 'שגיאה באיתור הסטטוס' },
          { status: 500 }
        );
      }

      if (!statusRow) {
        return NextResponse.json(
          { error: 'הסטטוס לא נמצא' },
          { status: 404 }
        );
      }
    } else {
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .select('id')
        .eq('id', contentId)
        .maybeSingle();

      if (questionError) {
        console.error('Content report question lookup error:', questionError);
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
    }

    const { error: insertError } = await supabase.from('content_reports').insert({
      reporter_id: user.id,
      content_type: contentType,
      content_id: contentId,
      report_type: reportType,
      description: description || null,
      status: 'pending',
    });

    if (insertError) {
      console.error('Content report insert error:', insertError);
      return NextResponse.json(
        { error: 'שגיאה בשליחת הדיווח' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'הדיווח נשלח' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Content report API error:', error);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
