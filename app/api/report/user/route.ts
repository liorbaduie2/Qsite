import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/report/user
 * Body: { reportedUserId: string, reason?: string, conversationId?: string }
 * Submit a report against another user. Reporter must be authenticated and cannot report self.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reportedUserId = typeof body.reportedUserId === 'string' ? body.reportedUserId.trim() : null;
    const reason = typeof body.reason === 'string' ? body.reason.trim() || null : null;
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId.trim() || null : null;

    if (!reportedUserId) {
      return NextResponse.json({ error: 'מזהה משתמש לדיווח חסר' }, { status: 400 });
    }

    if (reportedUserId === user.id) {
      return NextResponse.json({ error: 'לא ניתן לדווח על עצמך' }, { status: 400 });
    }

    const { error } = await supabase.from('user_reports').insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      reason: reason ?? null,
      conversation_id: conversationId ?? null,
    });

    if (error) {
      console.error('Report user error:', error);
      return NextResponse.json({ error: 'שגיאה בשליחת הדיווח' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'הדיווח נשלח' }, { status: 201 });
  } catch (e) {
    console.error('Report user API error:', e);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
