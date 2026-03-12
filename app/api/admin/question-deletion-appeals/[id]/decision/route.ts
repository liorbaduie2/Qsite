import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireOwner, isAdminAuth } from '@/lib/admin-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appealId } = await params;

    const auth = await requireOwner(request, 'רק בעלים יכול לאשר או לדחות ערעור');
    if (!isAdminAuth(auth)) return auth;

    const supabase = getAdminClient();

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
