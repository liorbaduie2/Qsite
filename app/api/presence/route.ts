import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/presence?ids=uuid1,uuid2,...
 * Returns last_seen_at for the given profile IDs. Used to update only the
 * online indicator without refetching full chat/conversation data.
 * Requires authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");
    if (!idsParam || typeof idsParam !== "string") {
      return NextResponse.json({ presence: {} });
    }

    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (ids.length === 0) {
      return NextResponse.json({ presence: {} });
    }

    // Limit to avoid abuse (e.g. 50 users max per request)
    const limitedIds = ids.slice(0, 50);

    const { data: rows, error } = await supabase
      .from("profiles")
      .select("id, last_seen_at")
      .in("id", limitedIds);

    if (error) {
      console.error("Presence fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch presence" },
        { status: 500 }
      );
    }

    const presence: Record<string, string | null> = {};
    for (const row of rows || []) {
      presence[row.id] = row.last_seen_at ? String(row.last_seen_at) : null;
    }

    return NextResponse.json({ presence });
  } catch (e) {
    console.error("Presence API error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
