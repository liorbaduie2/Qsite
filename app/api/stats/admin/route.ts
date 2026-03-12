import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { authenticateAdmin, isAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request);
    if (!isAdminAuth(auth)) return auth;

    if (!auth.permissions.can_view_user_list) {
      return NextResponse.json({
        error: 'אין הרשאות צפייה בסטטיסטיקות',
        error_code: 'FORBIDDEN'
      }, { status: 403 });
    }

    const supabase = getAdminClient();

    const { data: stats, error: statsError } = await supabase
      .rpc('get_admin_dashboard_stats', {
        admin_id: auth.user.id
      });

    if (statsError) {
      console.error('Stats API error:', statsError);
      return NextResponse.json({
        error: 'שגיאה בטעינת סטטיסטיקות',
        error_code: 'STATS_ERROR'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json({
      error: 'שגיאת שרת פנימית',
      error_code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}
