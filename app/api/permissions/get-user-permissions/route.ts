// app/api/permissions/get-user-permissions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    console.log("[API get-user-permissions] userId:", userId);
    const supabase = getAdminClient();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "חסר מזהה משתמש" },
        { status: 400 }
      );
    }
    const { data, error } = await supabase.rpc("get_user_all_permissions", {
      check_user_id: userId,
    });
    if (error) {
      console.error("[API get-user-permissions] RPC error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "שגיאה בטעינת הרשאות",
          details: error.message,
        },
        { status: 500 }
      );
    }
    console.log("[API get-user-permissions] success");
    return NextResponse.json({ success: true, permissions: data });
  } catch (error) {
    console.error("[API get-user-permissions] catch:", error);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית בשרת" },
      { status: 500 }
    );
  }
}
