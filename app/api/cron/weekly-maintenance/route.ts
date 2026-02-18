//app/api/cron/weekly-maintenance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  console.log('=== Weekly Maintenance Cron Job ===');
  
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Run the weekly maintenance function
    const { error } = await getSupabaseAdmin().rpc('weekly_maintenance')
    
    if (error) {
      console.error('Weekly maintenance error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    console.log('Weekly maintenance completed successfully')
    return NextResponse.json({ 
      success: true, 
      message: 'תחזוקה שבועית הושלמה בהצלחה',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Weekly maintenance error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}