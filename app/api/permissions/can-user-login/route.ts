//app/api/permissions/can-user-login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient()
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .rpc('can_user_login', { check_user_id: userId })

    if (error) {
      console.error('Error checking user login status:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Login check API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
