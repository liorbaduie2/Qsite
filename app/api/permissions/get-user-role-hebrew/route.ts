// app/api/permissions/get-user-role-hebrew/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params
    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')
    
    if (!targetUserId) {
      return NextResponse.json({ 
        error: 'חסר מזהה משתמש' 
      }, { status: 400 })
    }

    // Get user's admin permissions (includes role info)
    const { data: adminPerms, error } = await supabase.rpc('get_user_admin_permissions', {
      user_id: targetUserId
    })

    if (error) {
      console.error('Error fetching role:', error)
      return NextResponse.json({ 
        error: 'שגיאה בטעינת תפקיד משתמש' 
      }, { status: 500 })
    }

    if (!adminPerms) {
      return NextResponse.json({ 
        error: 'משתמש לא נמצא' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      role: adminPerms.role,
      role_hebrew: adminPerms.role_hebrew,
      is_hidden: adminPerms.is_hidden,
      is_admin: adminPerms.is_admin
    })

  } catch (error) {
    console.error('Get role error:', error)
    return NextResponse.json({ 
      error: 'שגיאה פנימית בשרת' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'חסר מזהה משתמש' 
      }, { status: 400 })
    }

    // Get user's admin permissions (includes role info)
    const { data: adminPerms, error } = await supabase.rpc('get_user_admin_permissions', {
      user_id: userId
    })

    if (error) {
      console.error('Error fetching role:', error)
      return NextResponse.json({ 
        error: 'שגיאה בטעינת תפקיד משתמש' 
      }, { status: 500 })
    }

    if (!adminPerms) {
      return NextResponse.json({ 
        error: 'משתמש לא נמצא' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      role: adminPerms.role,
      role_hebrew: adminPerms.role_hebrew,
      is_hidden: adminPerms.is_hidden,
      is_admin: adminPerms.is_admin
    })

  } catch (error) {
    console.error('Get role error:', error)
    return NextResponse.json({ 
      error: 'שגיאה פנימית בשרת' 
    }, { status: 500 })
  }
}