import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getTopSuggestionNames,
  normalizeTagName,
  shouldFetchSuggestedTags,
} from "@/lib/tag-matching";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title = "", content = "", excludeTags = [] } = body;

    if (!title.trim() && !content.trim()) {
      return NextResponse.json(
        { error: "יש להזין כותרת או תוכן" },
        { status: 400 },
      );
    }

    if (!shouldFetchSuggestedTags(title, content)) {
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }

    const supabase = await createClient();
    const { data: dbTags, error: tagsError } = await supabase
      .from("tags")
      .select("name, description, use_count, keywords");

    if (tagsError || !dbTags?.length) {
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }

    const now = Date.now();
    const trendingWindowMs = 14 * 24 * 60 * 60 * 1000;
    const { data: recentQuestions } = await supabase
      .from("questions")
      .select(
        `
          created_at,
          question_tags (
            tags (
              name
            )
          )
        `,
      )
      .order("created_at", { ascending: false })
      .limit(300);

    const recentCounts = new Map<string, number>();
    for (const question of recentQuestions || []) {
      const createdAt = question.created_at
        ? new Date(question.created_at).getTime()
        : 0;
      const isTrending = createdAt > 0 && now - createdAt <= trendingWindowMs;

      if (!isTrending) continue;

      for (const questionTag of question.question_tags || []) {
        const relatedTags = Array.isArray(questionTag.tags)
          ? questionTag.tags
          : [questionTag.tags];

        for (const relatedTag of relatedTags) {
          const name = normalizeTagName(relatedTag?.name || "");
          if (!name) continue;
          recentCounts.set(name, (recentCounts.get(name) || 0) + 1);
        }
      }
    }

    const catalogTags = dbTags
      .map(
        (tag: {
          name: string;
          description?: string | null;
          use_count?: number | null;
          keywords?: string[] | null;
        }) => ({
          name: normalizeTagName(tag.name),
          description: tag.description || "",
          useCount: tag.use_count || 0,
          recentCount: recentCounts.get(normalizeTagName(tag.name)) || 0,
          keywords: Array.isArray(tag.keywords) ? tag.keywords : [],
        }),
      )
      .filter((tag) => tag.name);
    const suggestions = getTopSuggestionNames({
      title,
      content,
      tags: catalogTags,
      excludeTags: Array.isArray(excludeTags) ? excludeTags : [],
      limit: 8,
    });

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("Suggest tags error:", err);
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
  }
}
