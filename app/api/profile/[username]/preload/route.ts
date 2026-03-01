import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PRELOAD_PAGE_SIZE = 20;

/**
 * GET /api/profile/[username]/preload
 * Owner-only. Returns counts + first batch of questions, replies, likers for instant display.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await context.params;
    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("id, questions_count, answers_count, profile_likes_count")
      .eq("username", username.trim())
      .single();

    if (profileError || !profileRow) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profileRow.id !== user.id) {
      return NextResponse.json(
        { error: "Only the profile owner can preload" },
        { status: 403 },
      );
    }

    const profileId = profileRow.id;
    const answers_count =
      typeof profileRow.answers_count === "number"
        ? profileRow.answers_count
        : 0;
    const profile_likes_count =
      typeof (profileRow as { profile_likes_count?: number })
        .profile_likes_count === "number"
        ? (profileRow as { profile_likes_count: number }).profile_likes_count
        : 0;

    // First batch of questions + exact count from DB (source of truth for display)
    const { data: questionsRows, count: questionsTotal } = await supabase
      .from("questions")
      .select("id, title, created_at", { count: "exact" })
      .eq("author_id", profileId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(0, PRELOAD_PAGE_SIZE - 1);

    const questions = (questionsRows || []).map((q) => ({
      id: q.id,
      title: q.title,
      created_at: q.created_at,
    }));
    const questions_count =
      questionsTotal ??
      (typeof profileRow.questions_count === "number"
        ? profileRow.questions_count
        : 0);

    // First batch of replies (answers by this user with question title)
    const { data: repliesRows, count: repliesTotal } = await supabase
      .from("answers")
      .select("id, content, created_at, question_id", { count: "exact" })
      .eq("author_id", profileId)
      .order("created_at", { ascending: false })
      .range(0, PRELOAD_PAGE_SIZE - 1);

    const questionIds = [
      ...new Set((repliesRows || []).map((r) => r.question_id)),
    ];
    let questionsById: Record<string, { title: string }> = {};
    if (questionIds.length > 0) {
      const { data: qRows } = await supabase
        .from("questions")
        .select("id, title")
        .in("id", questionIds);
      questionsById = (qRows || []).reduce<Record<string, { title: string }>>(
        (acc, q) => {
          acc[q.id] = { title: q.title };
          return acc;
        },
        {},
      );
    }

    const replies = (repliesRows || []).map((r) => ({
      id: r.id,
      content: r.content,
      created_at: r.created_at,
      question_id: r.question_id,
      question_title: questionsById[r.question_id]?.title ?? null,
    }));

    // First batch of likers
    const { data: likesRows, count: likersTotal } = await supabase
      .from("profile_likes")
      .select("user_id", { count: "exact" })
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .range(0, PRELOAD_PAGE_SIZE - 1);

    let likers: { id: string; username: string; avatar_url: string | null }[] =
      [];
    if (likesRows?.length) {
      const userIds = likesRows.map((l) => l.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);
      const orderMap = new Map(userIds.map((id, i) => [id, i]));
      likers = (profiles || [])
        .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
        .map((p) => ({
          id: p.id,
          username: p.username,
          avatar_url: p.avatar_url ?? null,
        }));
    }

    return NextResponse.json({
      questions_count,
      answers_count,
      profile_likes_count,
      questions,
      questions_total: questionsTotal ?? questions.length,
      replies,
      replies_total: repliesTotal ?? replies.length,
      likers,
      likers_total: likersTotal ?? likers.length,
    });
  } catch (e) {
    console.error("Profile preload error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
