// app/api/admin/users-overview/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Auth check
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'חסר אימות' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'אימות לא חוקי' }, { status: 401 })
    }

    // Check if user has admin permissions
    const { data: adminPerms } = await supabase.rpc('get_user_admin_permissions', {
      user_id: user.id
    })

    if (!adminPerms?.can_view_user_list) {
      return NextResponse.json({ 
        error: 'גישה נדחתה - אין הרשאה לצפות ברשימת משתמשים' 
      }, { status: 403 })
    }

    // Get complete user overview
    const { data: overview, error } = await supabase
      .from('complete_user_overview')
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