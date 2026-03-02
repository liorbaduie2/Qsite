import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

// One-off helper endpoint to create a new owner user
// Email: lior2@gmail.com
// Password: lior2@gmail.com

export async function GET() {
  try {
    const supabase = getAdminClient();

    // 1) Create auth user
    const { data: userData, error: createError } =
      await supabase.auth.admin.createUser({
        email: "lior2@gmail.com",
        password: "lior2@gmail.com",
        email_confirm: true,
        user_metadata: {
          username: "lior2",
        },
      });

    if (createError) {
      return NextResponse.json(
        {
          success: false,
          step: "createUser",
          error: createError.message,
        },
        { status: 500 },
      );
    }

    const user = userData.user;
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          step: "createUser",
          error: "User not returned from Supabase",
        },
        { status: 500 },
      );
    }

    const userId = user.id;

    // 2) Ensure profiles row
    const now = new Date().toISOString();

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        username: "lior2",
        full_name: "Lior 2",
        reputation: 50,
        approval_status: "approved",
        is_moderator: false,
        is_verified: true,
        created_at: now,
        updated_at: now,
        email: "lior2@gmail.com",
      },
      { onConflict: "id" },
    );

    if (profileError) {
      return NextResponse.json(
        {
          success: false,
          step: "profiles.upsert",
          error: profileError.message,
        },
        { status: 500 },
      );
    }

    // 3) Ensure user_roles row as owner
    const { error: roleError } = await supabase.from("user_roles").upsert(
      {
        user_id: userId,
        role: "owner",
        role_name_hebrew: "בעלים",
        is_hidden: false,
        max_reputation_deduction: 999,
        max_suspension_hours: null,
        updated_at: now,
      },
      { onConflict: "user_id" },
    );

    if (roleError) {
      return NextResponse.json(
        {
          success: false,
          step: "user_roles.upsert",
          error: roleError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      userId,
      email: "lior2@gmail.com",
      role: "owner",
    });
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Unknown error creating owner user";
    return NextResponse.json(
      { success: false, step: "exception", error: message },
      { status: 500 },
    );
  }
}

