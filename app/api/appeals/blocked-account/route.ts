import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireActiveAccount } from '@/lib/account-state';

/** POST: Submit an appeal (blocked user only; no email). */
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

    const access = await requireActiveAccount(supabase, user.id, ['active', 'blocked']);
    if (!access.allowed) return access.errorResponse!;

    const body = await request.json().catch(() => ({}));
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (!message) {
      return NextResponse.json({ error: 'נא להזין הודעת ערעור' }, { status: 400 });
    }

    const { error } = await supabase.from('blocked_account_appeals').insert({
      user_id: user.id,
      message,
      status: 'pending',
    });

    if (error) {
      console.error('blocked_account_appeals insert error:', error);
      return NextResponse.json({ error: 'שגיאה בשמירת הערעור' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Blocked account appeal POST error:', err);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

/** GET: List all blocked-account appeals (owner only). */
export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'חסר אימות' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'אימות לא חוקי' }, { status: 401 });
    }

    const { data: perms } = await supabase.rpc('get_user_admin_permissions', {
      user_id: user.id,
    });
    if (perms?.role !== 'owner') {
      return NextResponse.json({ error: 'אין הרשאה לצפות בערעורי חסימה' }, { status: 403 });
    }

    const { data: rows, error } = await supabase
      .from('blocked_account_appeals')
      .select('id, user_id, message, created_at, status')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('blocked_account_appeals select error:', error);
      return NextResponse.json({ error: 'שגיאה בטעינת הערעורים' }, { status: 500 });
    }

    type AppealRow = {
      id: string;
      user_id: string;
      message: string;
      created_at: string;
      status: string;
    };
    type ProfileLite = {
      id: string;
      username: string | null;
      full_name: string | null;
    };

    const userIds = [...new Set((rows || []).map((r: { user_id: string }) => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', userIds);
    const profileMap = new Map<string, ProfileLite>(
      ((profiles || []) as ProfileLite[]).map((p) => [p.id, p])
    );

    const appeals = ((rows || []) as AppealRow[]).map((r) => {
      const p = profileMap.get(r.user_id);
      return {
        id: r.id,
        user_id: r.user_id,
        username: p?.username ?? null,
        full_name: p?.full_name ?? null,
        message: r.message,
        created_at: r.created_at,
        status: r.status,
      };
    });

    return NextResponse.json({ appeals });
  } catch (err) {
    console.error('Blocked account appeals GET error:', err);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
