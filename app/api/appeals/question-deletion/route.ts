import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireActiveAccount } from '@/lib/account-state';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    const access = await requireActiveAccount(supabase, user.id, ['active', 'blocked']);
    if (!access.allowed) return access.errorResponse!;

    const body = await request.json().catch(() => ({}));
    const activityLogId = typeof body?.activity_log_id === 'string' ? body.activity_log_id.trim() : '';
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (!activityLogId) {
      return NextResponse.json({ error: 'חסר מזהה רישום' }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: 'נא לכתוב את עמדתך' }, { status: 400 });
    }

    const { data: result, error } = await supabase.rpc('submit_question_deletion_appeal', {
      p_activity_log_id: activityLogId,
      p_message: message,
    });

    if (error) {
      console.error('submit_question_deletion_appeal error:', error);
      return NextResponse.json({ error: 'שגיאה בשליחת הערעור' }, { status: 500 });
    }

    const res = result as { success?: boolean; error?: string };
    if (!res?.success) {
      return NextResponse.json(
        { error: res?.error || 'לא ניתן להגיש ערעור' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Appeal submit error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
