//app\api\admin\apply-penalty
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const {
      targetUserId,
      penaltyType,
      reason,
      reasonHebrew,
      relatedContentId = null
    } = await request.json()

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'חסר אימות' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'אימות לא חוקי' }, { status: 401 })
    }

    // Call the modular penalty function
    const { data, error } = await supabase.rpc('apply_penalty', {
      target_user_id: targetUserId,
      admin_user_id: user.id,
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
