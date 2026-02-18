//app/api/admin/check-milestones/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

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

    if (!adminPerms?.is_admin) {
      return NextResponse.json({ 
        error: 'גישה נדחתה - נדרשות הרשאות אדמין' 
      }, { status: 403 })
    }

    // Call the milestone check function
    const { data, error } = await supabase.rpc('check_and_award_milestones', {
      user_id: userId
    })

    if (error) {
      console.error('Error checking milestones:', error)
      return NextResponse.json({ 
        error: 'שגיאה בבדיקת אבני דרך' 
      }, { status: 500 })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Check milestones error:', error)
    return NextResponse.json({ 
      error: 'שגיאה פנימית בשרת' 
    }, { status: 500 })
  }
}