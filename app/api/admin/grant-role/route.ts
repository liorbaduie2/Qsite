// app/api/admin/grant-role/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { targetUserId, newRole, reason, reasonHebrew, isHidden, temporaryUntil } = await request.json()

    // Get current user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'חסר אימות' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'אימות לא חוקי' }, { status: 401 })
    }

    // Check if user is owner
    const { data: currentUserRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!currentUserRole || currentUserRole.role !== 'owner') {
      return NextResponse.json({ 
        error: 'רק בעלים יכול לתת הרשאות' 
      }, { status: 403 })
    }

    // Call the SQL function to grant role
    const { data, error } = await supabase.rpc('owner_grant_role', {
      target_user_id: targetUserId,
      new_role: newRole,
      granted_by_user_id: user.id,
      reason: reason || null,
      reason_hebrew: reasonHebrew || null,
      is_hidden: isHidden || false,
      temporary_until: temporaryUntil || null
    })

    if (error) {
      console.error('Error granting role:', error)
      return NextResponse.json({ 
        error: 'שגיאה במתן הרשאה',
        details: error.message 
      }, { status: 500 })
    }

    if (!data?.success) {
      return NextResponse.json({ 
        error: data?.error || 'שגיאה במתן הרשאה' 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'התפקיד עודכן בהצלחה',
      data: data
    })

  } catch (error) {
    console.error('Grant role API error:', error)
    return NextResponse.json({ 
      error: 'שגיאה פנימית בשרת' 
    }, { status: 500 })
  }
}