// app/api/permissions/get-user-permissions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient()
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'חסר מזהה משתמש'
        },
        { status: 400 }
      )
    }

    // קריאה לפונקציה המתוקנת ב-Supabase
const { data, error } = await supabase.rpc('get_user_all_permissions', {
  check_user_id: userId
})

    if (error) {
      console.error('Error fetching permissions:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'שגיאה בטעינת הרשאות',
          details: error.message
        },
        { status: 500 }
      )
    }

    // data כבר jsonb מהפונקציה המתוקנת
    return NextResponse.json({
      success: true,
      permissions: data
    })

  } catch (error) {
    console.error('Permissions API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה פנימית בשרת'
      },
      { status: 500 }
    )
  }
}
