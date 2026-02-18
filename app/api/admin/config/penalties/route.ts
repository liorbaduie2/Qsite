// app/api/admin/config/penalties/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
export async function GET(request: NextRequest) {
  try {
    // Auth check (same pattern)
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

    // Get penalty types configuration
    const { data: penalties, error } = await supabase
      .from('penalty_types_config')
      .select('*')
      .order('penalty_type')

    if (error) {
      console.error('Error fetching penalties config:', error)
      return NextResponse.json({
        error: 'שגיאה בטעינת הגדרות עונשים'
      }, { status: 500 })
    }

    return NextResponse.json(penalties)

  } catch (error) {
    console.error('Penalties config error:', error)
    return NextResponse.json({
      error: 'שגיאה פנימית בשרת'
    }, { status: 500 })
  }
}
