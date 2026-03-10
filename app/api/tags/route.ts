import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeTagName, scoreAutocompleteTag } from "@/lib/tag-matching";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = normalizeTagName(searchParams.get("query") || "");
    const exclude = (searchParams.get("exclude") || "")
      .split(",")
      .map(normalizeTagName)
      .filter(Boolean);

    if (!query) {
      return NextResponse.json({ tags: [] });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tags")
      .select("name, description, use_count, keywords")
      .limit(500);

    if (error) {
      console.error("Tags GET error:", error);
      return NextResponse.json({ error: "שגיאה בטעינת תגיות" }, { status: 500 });
    }

    const excluded = new Set(exclude);
    const tags = (data || [])
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
          keywords: Array.isArray(tag.keywords) ? tag.keywords : [],
        }),
      )
      .filter((tag) => tag.name && !excluded.has(tag.name))
      .map((tag) => ({
        name: tag.name,
        score: scoreAutocompleteTag({ query, tag }),
        useCount: tag.useCount || 0,
      }))
      .filter((tag) => tag.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          (b.useCount || 0) - (a.useCount || 0) ||
          a.name.localeCompare(b.name, "he"),
      )
      .slice(0, 8)
      .map((tag) => tag.name);

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Tags GET error:", error);
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
  }
}
