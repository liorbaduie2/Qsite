// app/api/admin/config/reputation-permissions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient()
    // Get current user
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

    // Get reputation permissions configuration
    const { data: config, error } = await supabase
      .from('reputation_permissions_config')
      .select('*')
      .order('permission_name')

    if (error) {
      console.error('Error fetching reputation config:', error)
      return NextResponse.json({
        error: 'שגיאה בטעינת הגדרות מוניטין'
      }, { status: 500 })
    }

    return NextResponse.json(config)

  } catch (error) {
    console.error('Reputation config error:', error)
    return NextResponse.json({
      error: 'שגיאה פנימית בשרת'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getAdminClient()
    // ✅ הוסר: minBehaviorScore, minCredibilityScore
    const { permissionName, minReputation } = await request.json()

    // Get current user
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

    // ✅ עדכון רק עם minReputation
    const { error } = await supabase
      .from('reputation_permissions_config')
      .update({
        min_reputation: minReputation,
        // ✅ הוסר: min_behavior_score, min_credibility_score
        updated_at: new Date().toISOString()
      })
      .eq('permission_name', permissionName)

    if (error) {
      console.error('Error updating reputation config:', error)
      return NextResponse.json({
        error: 'שגיאה בעדכון הגדרות מוניטין'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `הרשאה ${permissionName} עודכנה בהצלחה`
    })

  } catch (error) {
    console.error('Update reputation config error:', error)
    return NextResponse.json({
      error: 'שגיאה פנימית בשרת'
    }, { status: 500 })
  }
}
