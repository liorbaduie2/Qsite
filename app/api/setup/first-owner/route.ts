// app/api/setup/first-owner/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { ownerEmail, setupKey } = await request.json()

    // Security check - use environment variable for setup
    if (setupKey !== process.env.SETUP_SECRET_KEY) {
      return NextResponse.json({ error: 'מפתח הגדרה לא חוקי' }, { status: 401 })
    }

    // Check if owner already exists
    const { data: existingOwner } = await supabase
      .from('user_roles')
      .select('id')
      .eq('role', 'owner')
      .limit(1)

    if (existingOwner && existingOwner.length > 0) {
      return NextResponse.json({
        error: 'בעלים כבר קיים במערכת'
      }, { status: 400 })
    }

    // Find user by email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, email')
      .eq('email', ownerEmail)
      .single()

    if (!profile) {
      return NextResponse.json({
        error: 'משתמש עם כתובת מייל זו לא נמצא'
      }, { status: 404 })
    }

    // Assign owner role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: profile.id,
        role: 'owner',
        role_name_hebrew: 'בעלים',
        is_hidden: false,
        max_reputation_deduction: 999,
        max_suspension_hours: null
      })

    if (roleError) {
      console.error('Error assigning owner role:', roleError)
      return NextResponse.json({
        error: 'שגיאה במתן תפקיד בעלים'
      }, { status: 500 })
    }

    // Update profile
    await supabase
      .from('profiles')
      .update({
        is_moderator: true,
        theme_role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    return NextResponse.json({
      success: true,
      message: `${profile.username} מונה כבעלים הראשי של האתר`,
      owner: {
        id: profile.id,
        username: profile.username,
        email: profile.email
      }
    })

  } catch (error) {
    console.error('Setup owner error:', error)
    return NextResponse.json({
      error: 'שגיאה פנימית בשרת'
    }, { status: 500 })
  }
}
