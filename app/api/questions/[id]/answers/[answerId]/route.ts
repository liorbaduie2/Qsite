import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireActiveAccount } from '@/lib/account-state';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; answerId: string }> }
) {
  try {
    const { answerId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    const access = await requireActiveAccount(supabase, user.id);
    if (!access.allowed) return access.errorResponse!;

    const { data: result, error } = await supabase.rpc('delete_answer_as_admin', {
      p_answer_id: answerId,
    });

    if (error) {
      console.error('Answer DELETE RPC error:', error);
      return NextResponse.json({ error: 'שגיאה במחיקת התשובה' }, { status: 500 });
    }

    const res = result as { success?: boolean; error?: string };
    if (!res?.success) {
      return NextResponse.json(
        { error: res?.error || 'אין הרשאה למחוק תשובה' },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Answer DELETE error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
