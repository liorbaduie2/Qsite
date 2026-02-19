// app/api/admin/config/milestones/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient()
    // Get current user and check permissions (same auth logic as above)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'חסר אימות' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'אימות לא חוקי' }, { status: 401 })
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || userRole.role !== 'owner') {
      return NextResponse.json({
        error: 'גישה נדחתה - נדרשות הרשאות בעלים'
      }, { status: 403 })
    }

    // Get milestones configuration
    const { data: milestones, error } = await supabase
      .from('reputation_milestones')
      .select('*')
      .order('milestone_type')

    if (error) {
      console.error('Error fetching milestones config:', error)
      return NextResponse.json({
        error: 'שגיאה בטעינת הגדרות אבני דרך'
      }, { status: 500 })
    }

    return NextResponse.json(milestones)

  } catch (error) {
    console.error('Milestones config error:', error)
    return NextResponse.json({
      error: 'שגיאה פנימית בשרת'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getAdminClient()
    const { milestoneType, thresholdCount, pointsReward, behaviorImpact, credibilityImpact } = await request.json()

    // Auth check (same as above)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'חסר אימות' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'אימות לא חוקי' }, { status: 401 })
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || userRole.role !== 'owner') {
      return NextResponse.json({
        error: 'גישה נדחתה - נדרשות הרשאות בעלים'
      }, { status: 403 })
    }

    // Update milestone configuration
    const { error } = await supabase
      .from('reputation_milestones')
      .update({
        threshold_count: thresholdCount,
        points_reward: pointsReward,
        behavior_impact: behaviorImpact,
        credibility_impact: credibilityImpact,
        updated_at: new Date().toISOString()
      })
      .eq('milestone_type', milestoneType)

    if (error) {
      console.error('Error updating milestone config:', error)
      return NextResponse.json({
        error: 'שגיאה בעדכון הגדרות אבן דרך'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `אבן דרך ${milestoneType} עודכנה בהצלחה`
    })

  } catch (error) {
    console.error('Update milestone config error:', error)
    return NextResponse.json({
      error: 'שגיאה פנימית בשרת'
    }, { status: 500 })
  }
}
