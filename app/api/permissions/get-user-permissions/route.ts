// app/api/permissions/get-user-permissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "חסר מזהה משתמש" },
        { status: 400 },
      );
    }

    // Require authentication: caller must have a valid JWT
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "חסר אימות" },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: callerUser },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !callerUser) {
      return NextResponse.json(
        { success: false, error: "אימות לא חוקי" },
        { status: 401 },
      );
    }

    // Authorization: user can only request their own permissions.
    // Admins (owner / guardian) may request another user's permissions.
    if (callerUser.id !== userId) {
      const { data: callerPerms } = await supabase.rpc(
        "get_user_admin_permissions",
        { user_id: callerUser.id },
      );
      const callerRole = callerPerms?.role;
      if (callerRole !== "owner" && callerRole !== "guardian") {
        return NextResponse.json(
          { success: false, error: "אין הרשאה לצפות בהרשאות משתמש אחר" },
          { status: 403 },
        );
      }
    }

    // 1) Ask Postgres for the combined permissions (reputation + admin)
    const { data, error } = await supabase.rpc("get_user_all_permissions", {
      check_user_id: userId,
    });

    let permissions: Record<string, unknown> = data || {};

    // 2) Independently check the canonical role from user_roles
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role, role_name_hebrew")
      .eq("user_id", userId)
      .maybeSingle();

    if (roleRow) {
      permissions.role = roleRow.role;
      permissions.role_hebrew =
        roleRow.role_name_hebrew || roleRow.role || permissions.role_hebrew;

      const role = roleRow.role;
      const isOwner = role === "owner";
      const isGuardian = role === "guardian";
      const isAdmin = role === "admin";
      const isModerator = role === "moderator";

      permissions.can_approve_registrations =
        permissions.can_approve_registrations ??
        (isOwner || isGuardian || false);
      permissions.can_manage_user_ranks =
        permissions.can_manage_user_ranks ?? (isOwner || false);
      permissions.can_view_user_list =
        permissions.can_view_user_list ?? (isOwner || isGuardian || isAdmin);
      permissions.can_view_private_chats =
        permissions.can_view_private_chats ?? isOwner;
      permissions.can_block_user =
        permissions.can_block_user ?? (isOwner || isGuardian || isAdmin);
      permissions.can_suspend_user =
        permissions.can_suspend_user ?? (isOwner || isGuardian || isAdmin);
      permissions.can_permanent_ban =
        permissions.can_permanent_ban ?? isOwner;
      permissions.can_edit_delete_content =
        permissions.can_edit_delete_content ??
        (isOwner || isGuardian || isAdmin);
      permissions.can_deduct_reputation =
        permissions.can_deduct_reputation ??
        (isOwner || isGuardian || isAdmin);
      permissions.can_mark_rule_violation =
        permissions.can_mark_rule_violation ??
        (isOwner || isGuardian || isAdmin || isModerator);

      if (isOwner) {
        permissions.max_reputation_deduction = 999;
        permissions.max_suspension_hours = null;
      }
    }

    // 3) If the RPC itself failed, derive from admin_roles_config or return defaults
    if (error) {
      if (roleRow) {
        const role = roleRow.role;
        const isOwner = role === "owner";
        const isGuardian = role === "guardian";
        const isAdmin = role === "admin";
        const isModerator = role === "moderator";

        const { data: roleConfig } = await supabase
          .from("admin_roles_config")
          .select(
            "role, role_name_hebrew, can_approve_registrations, can_manage_user_ranks, can_view_user_list, can_view_private_chats, can_block_user, can_suspend_user, can_permanent_ban, can_edit_delete_content, can_deduct_reputation, can_mark_rule_violation, max_reputation_deduction, max_suspension_hours, default_reputation_deduction, default_suspension_hours",
          )
          .eq("role", role)
          .maybeSingle();

        permissions = {
          role,
          role_hebrew:
            roleRow.role_name_hebrew ||
            roleConfig?.role_name_hebrew ||
            role ||
            "admin",
          is_hidden: false,
          reputation: 50,
          can_approve_registrations:
            roleConfig?.can_approve_registrations ?? (isOwner || isGuardian),
          can_manage_user_ranks:
            roleConfig?.can_manage_user_ranks ?? isOwner,
          can_view_user_list:
            roleConfig?.can_view_user_list ??
            (isOwner || isGuardian || isAdmin),
          can_view_private_chats:
            roleConfig?.can_view_private_chats ?? isOwner,
          can_block_user:
            roleConfig?.can_block_user ??
            (isOwner || isGuardian || isAdmin),
          can_suspend_user:
            roleConfig?.can_suspend_user ??
            (isOwner || isGuardian || isAdmin),
          can_permanent_ban:
            roleConfig?.can_permanent_ban ?? isOwner,
          can_edit_delete_content:
            roleConfig?.can_edit_delete_content ??
            (isOwner || isGuardian || isAdmin),
          can_deduct_reputation:
            roleConfig?.can_deduct_reputation ??
            (isOwner || isGuardian || isAdmin),
          can_mark_rule_violation:
            roleConfig?.can_mark_rule_violation ??
            (isOwner || isGuardian || isAdmin || isModerator),
          max_reputation_deduction:
            roleConfig?.max_reputation_deduction ?? 0,
          max_suspension_hours: roleConfig?.max_suspension_hours ?? null,
          default_reputation_deduction:
            roleConfig?.default_reputation_deduction ?? null,
          default_suspension_hours:
            roleConfig?.default_suspension_hours ?? null,
        };
      } else {
        permissions = {
          role: "user",
          role_hebrew: "משתמש",
          is_hidden: false,
          reputation: 50,
          can_approve_registrations: false,
          can_manage_user_ranks: false,
          can_view_user_list: false,
          can_view_private_chats: false,
          can_block_user: false,
          can_suspend_user: false,
          can_permanent_ban: false,
          can_edit_delete_content: false,
          can_deduct_reputation: false,
          can_mark_rule_violation: false,
          max_reputation_deduction: 0,
          max_suspension_hours: null,
          default_reputation_deduction: null,
          default_suspension_hours: null,
        };
      }
    }

    return NextResponse.json({ success: true, permissions });
  } catch {
    return NextResponse.json({
      success: true,
      permissions: {
        role: "user",
        role_hebrew: "משתמש",
        is_hidden: false,
        reputation: 50,
        can_approve_registrations: false,
        can_manage_user_ranks: false,
        can_view_user_list: false,
        can_view_private_chats: false,
        can_block_user: false,
        can_suspend_user: false,
        can_permanent_ban: false,
        can_edit_delete_content: false,
        can_deduct_reputation: false,
        can_mark_rule_violation: false,
        max_reputation_deduction: 0,
        max_suspension_hours: null,
        default_reputation_deduction: null,
        default_suspension_hours: null,
      },
    });
  }
}
