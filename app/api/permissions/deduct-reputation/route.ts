// app/api/permissions/deduct-reputation/route.ts
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
      penaltyType,        // 'rule_violation', 'spam_reported', 'harassment', etc.
      customAmount,       // Optional: for custom deductions
      reason, 
      reasonHebrew,
      relatedContentId 
    } = await request.json()

    if (!targetUserId) {
      return NextResponse.json({ 
        error: 'חסר מזהה משתמש' 
      }, { status: 400 })
    }

    // Get current admin user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'חסר אימות' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'אימות לא חוקי' }, { status: 401 })
    }

    // Check admin permissions
    const { data: adminPerms } = await supabase.rpc('get_user_admin_permissions', {
      user_id: user.id
    })

    if (!adminPerms?.can_deduct_reputation) {
      return NextResponse.json({ 
        error: 'אין הרשאה לניכוי נקודות מוניטין' 
      }, { status: 403 })
    }

    let result;

    // If penaltyType is provided, use the modular penalty system
    if (penaltyType) {
      const { data, error } = await supabase.rpc('apply_penalty', {
        target_user_id: targetUserId,
        admin_user_id: user.id,
        penalty_type: penaltyType,
        reason_text: reason,
        reason_hebrew: reasonHebrew,
        related_content_id: relatedContentId || null
      })

      if (error) {
        console.error('Error applying penalty:', error)
        return NextResponse.json({ 
          error: error.message || 'שגיאה בהטלת עונש' 
        }, { status: 500 })
      }

      // Check if the SQL function returned an error in the data
      if (data && !data.success) {
        return NextResponse.json({ 
          error: data.error || 'שגיאה בהטלת עונש' 
        }, { status: 400 })
      }

      result = data

    } 
    // If customAmount is provided, use custom deduction
    else if (customAmount) {
      // Check if admin can deduct this amount
      if (customAmount > adminPerms.max_reputation_deduction) {
        return NextResponse.json({ 
          error: `ניתן לנכות עד ${adminPerms.max_reputation_deduction} נקודות בלבד` 
        }, { status: 403 })
      }

      // Use admin_deduct_reputation for custom amounts
      const { data, error } = await supabase.rpc('admin_deduct_reputation', {
        target_user_id: targetUserId,
        deducting_user_id: user.id,
        deduction_amount: customAmount,
        reason_text: reason,
        reason_hebrew: reasonHebrew
      })

      if (error) {
        console.error('Error deducting reputation:', error)
        return NextResponse.json({ 
          error: error.message || 'שגיאה בניכוי נקודות מוניטין' 
        }, { status: 500 })
      }

      // Check if the SQL function returned an error in the data
      if (data && !data.success) {
        return NextResponse.json({ 
          error: data.error || 'שגיאה בניכוי נקודות מוניטין' 
        }, { status: 400 })
      }

      result = data

    } else {
      return NextResponse.json({ 
        error: 'חסר סוג עונש או כמות ניכוי' 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('Deduct reputation error:', error)
    return NextResponse.json({ 
      error: 'שגיאה פנימית בשרת' 
    }, { status: 500 })
  }
}