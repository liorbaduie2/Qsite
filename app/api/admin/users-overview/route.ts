import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { requireAdminPermission, isAdminAuth } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(
      request,
      'can_view_user_list',
      'גישה נדחתה - אין הרשאה לצפות ברשימת משתמשים',
    );
    if (!isAdminAuth(auth)) return auth;

    const supabase = getAdminClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data: overview, error } = await supabase
      .from('admin_user_overview')
      .select('*')
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching users overview:', error)
      return NextResponse.json({
        error: 'שגיאה בטעינת סקירת משתמשים'
      }, { status: 500 })
    }

    return NextResponse.json(overview)

  } catch (error) {
    console.error('Users overview error:', error)
    return NextResponse.json({
      error: 'שגיאה פנימית בשרת'
    }, { status: 500 })
  }
}
