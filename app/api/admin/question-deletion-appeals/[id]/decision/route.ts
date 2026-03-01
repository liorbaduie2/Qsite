import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appealId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'חסר אימות' }, { status: 401 });
    }

    const { data: perms } = await supabase.rpc('get_user_admin_permissions', {
      user_id: user.id,
    });
    if (perms?.role !== 'owner') {
      return NextResponse.json(
        { error: 'רק בעלים יכול לאשר או לדחות ערעור' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action === 'reject' ? 'reject' : 'approve';

    const { data: result, error } = await supabase.rpc('handle_appeal_decision', {
      p_appeal_id: appealId,
      p_approve: action === 'approve',
    });

    if (error) {
      console.error('handle_appeal_decision error:', error);
      return NextResponse.json({ error: 'שגיאה בפעולה' }, { status: 500 });
    }

    const res = result as { success?: boolean; error?: string };
    if (!res?.success) {
      return NextResponse.json(
        { error: res?.error || 'שגיאה בפעולה' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      action: action === 'approve' ? 'approved' : 'rejected',
    });
  } catch (error) {
    console.error('Appeal decision error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
