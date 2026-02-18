//app/api/admin/revoke-role/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(request: NextRequest) {
  try {
    const { targetUserId, reason, reasonHebrew } = await request.json()

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'חסר אימות' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'אימות לא חוקי' }, { status: 401 })
    }

    // Call the SQL function (you need to create this function)
    const { data, error } = await supabase.rpc('owner_revoke_role', {
      target_user_id: targetUserId,
      revoked_by_user_id: user.id,
      reason: reason,
      reason_hebrew: reasonHebrew
    })

    if (error) {
      console.error('Error revoking role:', error)
      return NextResponse.json({
        error: 'שגיאה בביטול תפקיד'
      }, { status: 500 })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Revoke role error:', error)
    return NextResponse.json({
      error: 'שגיאה פנימית בשרת'
    }, { status: 500 })
  }
}
