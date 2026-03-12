import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export interface AdminAuthResult {
  user: { id: string; email?: string };
  permissions: Record<string, unknown>;
}

/**
 * Authenticates an admin API request via Bearer token and resolves the caller's
 * admin permissions from `get_user_admin_permissions`.
 *
 * Returns `{ user, permissions }` on success, or a NextResponse error to return
 * immediately from the route handler.
 */
export async function authenticateAdmin(
  request: NextRequest,
): Promise<AdminAuthResult | NextResponse> {
  const supabase = getAdminClient();

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "חסר אימות" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "אימות לא חוקי" }, { status: 401 });
  }

  const { data: perms, error: permsError } = await supabase.rpc(
    "get_user_admin_permissions",
    { user_id: user.id },
  );

  if (permsError) {
    console.error("get_user_admin_permissions error:", permsError);
    return NextResponse.json(
      { error: "שגיאה בבדיקת הרשאות" },
      { status: 500 },
    );
  }

  return {
    user: { id: user.id, email: user.email },
    permissions: perms ?? {},
  };
}

/** Type guard: returns true when authenticateAdmin yielded a successful result. */
export function isAdminAuth(
  result: AdminAuthResult | NextResponse,
): result is AdminAuthResult {
  return !(result instanceof NextResponse);
}

/** Convenience: authenticate and require a specific permission flag to be truthy. */
export async function requireAdminPermission(
  request: NextRequest,
  permissionKey: string,
  errorMessage = "אין הרשאה לביצוע פעולה זו",
): Promise<AdminAuthResult | NextResponse> {
  const result = await authenticateAdmin(request);
  if (!isAdminAuth(result)) return result;

  if (!result.permissions[permissionKey]) {
    return NextResponse.json({ error: errorMessage }, { status: 403 });
  }

  return result;
}

/** Convenience: authenticate and require owner role. */
export async function requireOwner(
  request: NextRequest,
  errorMessage = "נדרשות הרשאות בעלים",
): Promise<AdminAuthResult | NextResponse> {
  const result = await authenticateAdmin(request);
  if (!isAdminAuth(result)) return result;

  if (result.permissions.role !== "owner") {
    return NextResponse.json({ error: errorMessage }, { status: 403 });
  }

  return result;
}
