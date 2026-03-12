import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { authenticateAdmin, isAdminAuth } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient()

    const auth = await authenticateAdmin(request);
    if (!isAdminAuth(auth)) return auth;

    if (!auth.permissions.can_deduct_reputation) {
      return NextResponse.json(
        { error: 'אין הרשאה להטלת עונשים' },
        { status: 403 },
      )
    }

    const {
      targetUserId,
      penaltyType,
      reason,
      reasonHebrew,
      relatedContentId = null
    } = await request.json()

    const { data, error } = await supabase.rpc('apply_penalty', {
      target_user_id: targetUserId,
      admin_user_id: auth.user.id,
      penalty_type: penaltyType,
      reason_text: reason,
      reason_hebrew: reasonHebrew,
      related_content_id: relatedContentId
    })

    if (error) {
      console.error('Error applying penalty:', error)
      return NextResponse.json({
        error: 'שגיאה בהטלת עונש'
      }, { status: 500 })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Apply penalty error:', error)
    return NextResponse.json({
      error: 'שגיאה פנימית בשרת'
    }, { status: 500 })
  }
}
