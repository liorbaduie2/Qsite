import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient();

    const {
      targetUserId,
      amount,
      reason,
      relatedContentId = null,
    } = await request.json();

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'חסר מזהה משתמש' },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'כמות נקודות לא תקינה' },
        { status: 400 }
      );
    }

    // Get current user from auth header
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

    // Only owner can grant manual reputation
    const { data: currentUserRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!currentUserRole || currentUserRole.role !== 'owner') {
      return NextResponse.json(
        { error: 'רק בעלים יכול להעניק נקודות מוניטין' },
        { status: 403 }
      );
    }

    const rpcParams = {
      target_user_id: targetUserId,
      delta: parsedAmount,
      reason_text:
        reason ||
        'מתן מוניטין ידני על ידי בעלים',
      source: 'owner_manual_grant',
      related_content_id: relatedContentId ?? null,
      metadata: {} as Record<string, unknown>,
      admin_user_id: user.id,
    };

    const { data, error } = await supabase.rpc('modify_reputation', rpcParams);

    if (error) {
      console.error('Grant reputation RPC error:', error.message, error.details, error.hint);
      return NextResponse.json(
        {
          error: 'שגיאה במתן נקודות מוניטין',
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    if (!data?.success) {
      return NextResponse.json(
        {
          error:
            data?.error ||
            'שגיאה במתן נקודות מוניטין',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('Grant reputation API error:', message, stack);
    return NextResponse.json(
      {
        error: 'שגיאה פנימית בשרת',
        details: message,
      },
      { status: 500 }
    );
  }
}

