// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    // Extract user from authorization header or session
    const authHeader = request.headers.get('authorization');
    
    // For now, we'll get the current user from the session
    // In production, you should properly validate the admin token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'נדרש להתחבר כמנהל',
        error_code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    // Check if user has admin permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_moderator, is_verified')
      .eq('id', session.user.id)
      .single();

    if (profileError || (!profile?.is_moderator && !profile?.is_verified)) {
      return NextResponse.json({ 
        error: 'אין הרשאות מנהל',
        error_code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // Get dashboard stats using the SQL function
    const { data: stats, error: statsError } = await supabase
      .rpc('get_admin_dashboard_stats', { 
        admin_id: session.user.id 
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