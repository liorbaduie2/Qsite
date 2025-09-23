//app\api\auth\check-availability
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('=== Check Availability API Called ===');
  
  try {
    const { field, value } = await request.json();
    console.log('Request data:', { field, value });
    
    if (!field || !value) {
      console.log('Missing field or value');
      return NextResponse.json({ error: 'שדה וערך נדרשים' }, { status: 400 });
    }

    // Validate field name
    if (!['phone', 'email', 'username'].includes(field)) {
      console.log('Invalid field:', field);
      return NextResponse.json({ error: 'שדה לא חוקי' }, { status: 400 });
    }

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Environment check:', {
      supabaseUrl: supabaseUrl ? 'Present' : 'MISSING',
      serviceKey: serviceKey ? 'Present' : 'MISSING'
    });

    if (!supabaseUrl || !serviceKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json({ error: 'שגיאת הגדרה' }, { status: 500 });
    }

    const url = `${supabaseUrl}/rest/v1/profiles?${field}=eq.${encodeURIComponent(value)}&select=id`;
    console.log('Making request to:', url);

    const response = await fetch(url, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('Supabase response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase API error:', response.status, response.statusText, errorText);
      return NextResponse.json({ error: 'שגיאה בבדיקת זמינות' }, { status: 500 });
    }

    const data = await response.json();
    console.log('Supabase response data:', data);
    
    // If array is empty, the value is available
    const isAvailable = data.length === 0;
    console.log('Availability result:', { isAvailable });
    
    return NextResponse.json({ 
      available: isAvailable,
      message: isAvailable ? 'זמין' : 'כבר תפוס'
    });

  } catch (error) {
    console.error('=== Check availability error ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Full error:', error);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}