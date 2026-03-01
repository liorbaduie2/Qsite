import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    const { data: perms } = await supabase.rpc('get_user_admin_permissions', {
      user_id: user.id,
    });
    if (perms?.role !== 'admin') {
      return NextResponse.json(
        { error: 'רק שומר סף יכול לשלוח בקשת הסרת שאלה' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

    const { data: existing } = await supabase
      .from('question_removal_requests')
      .select('id')
      .eq('question_id', questionId)
      .eq('requested_by', user.id)
      .eq('status', 'pending')
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: 'קיימת כבר בקשת הסרה ממתינה לשאלה זו' },
        { status: 409 }
      );
    }

    const { error: insertError } = await supabase.from('question_removal_requests').insert({
      question_id: questionId,
      requested_by: user.id,
      reason: reason || null,
      status: 'pending',
    });

    if (insertError) {
      if (insertError.code === '23503') {
        return NextResponse.json({ error: 'השאלה לא נמצאה' }, { status: 404 });
      }
      console.error('request-removal insert error:', insertError);
      return NextResponse.json({ error: 'שגיאה בשליחת הבקשה' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Request removal error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
