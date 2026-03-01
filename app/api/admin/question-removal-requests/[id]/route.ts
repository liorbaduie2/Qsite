import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'חסר אימות' }, { status: 401 });
    }

    const { data: perms } = await supabase.rpc('get_user_admin_permissions', {
      user_id: user.id,
    });
    const role = perms?.role;
    if (role !== 'owner' && role !== 'guardian') {
      return NextResponse.json(
        { error: 'רק בעלים או ממונה מוסמך יכולים לאשר או לדחות בקשת הסרה' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action === 'reject' ? 'reject' : 'approve';

    const { data: removalRequest, error: fetchError } = await supabase
      .from('question_removal_requests')
      .select('id, question_id, status')
      .eq('id', requestId)
      .single();

    if (fetchError || !removalRequest) {
      return NextResponse.json({ error: 'בקשת ההסרה לא נמצאה' }, { status: 404 });
    }

    if (removalRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'בקשת ההסרה כבר טופלה' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('question_removal_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        decided_by: user.id,
        decided_at: now,
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('question_removal_requests update error:', updateError);
      return NextResponse.json({ error: 'שגיאה בעדכון הבקשה' }, { status: 500 });
    }

    if (action === 'approve') {
      const { data: deleteResult, error: deleteError } = await supabase.rpc(
        'delete_question_as_admin',
        { p_question_id: removalRequest.question_id }
      );

      if (deleteError) {
        console.error('delete_question_as_admin error:', deleteError);
        return NextResponse.json(
          { error: 'שגיאה בהסרת השאלה' },
          { status: 500 }
        );
      }

      const res = deleteResult as { success?: boolean; error?: string };
      if (!res?.success) {
        return NextResponse.json(
          { error: res?.error || 'שגיאה בהסרת השאלה' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      action: action === 'approve' ? 'approved' : 'rejected',
    });
  } catch (error) {
    console.error('Question removal request decision error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
