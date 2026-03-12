import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { authenticateAdmin, isAdminAuth } from '@/lib/admin-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;

    const auth = await authenticateAdmin(request);
    if (!isAdminAuth(auth)) return auth;

    const role = auth.permissions.role;
    if (role !== 'owner' && role !== 'guardian') {
      return NextResponse.json(
        { error: 'רק בעלים או ממונה מוסמך יכולים לאשר או לדחות בקשת הסרה' },
        { status: 403 }
      );
    }

    const supabase = getAdminClient();

    const body = await request.json().catch(() => ({}));
    const action = body.action === 'reject' ? 'reject' : 'approve';

    const { data: removalRequest, error: fetchError } = await supabase
      .from('question_removal_requests')
      .select('id, question_id, status, reason')
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
        decided_by: auth.user.id,
        decided_at: now,
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('question_removal_requests update error:', updateError);
      return NextResponse.json({ error: 'שגיאה בעדכון הבקשה' }, { status: 500 });
    }

    if (action === 'approve') {
      const deletionReason =
        (removalRequest as { reason?: string | null }).reason?.trim() ||
        'אושרה בקשת הסרה';
      const { data: deleteResult, error: deleteError } = await supabase.rpc(
        'delete_question_as_admin',
        {
          p_question_id: removalRequest.question_id,
          p_deletion_reason: deletionReason,
        }
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
