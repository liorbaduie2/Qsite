import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** GET /api/notifications/unread-count - Unread notifications count for Drawer badge */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ count: 0 });
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Notifications unread-count error:', error);
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (err) {
    console.error('Notifications unread-count error:', err);
    return NextResponse.json({ count: 0 });
  }
}
