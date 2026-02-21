//app/api/permissions/suspend-user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient()
    const { targetUserId, hours, reason } = await request.json()

    // Get current user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .rpc('suspend_user', {
        target_user_id: targetUserId,
        suspending_user_id: user.id,
        suspension_duration_hours: hours,
        reason_text: reason
      })

    if (error) {
      console.error('Error suspending user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (data && (data as { success?: boolean }).success === false) {
      const message = (data as { message_hebrew?: string }).message_hebrew || (data as { message?: string }).message || 'הפעולה נכשלה'
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Suspend user API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
