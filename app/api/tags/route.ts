import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeTagName, scoreAutocompleteTag } from "@/lib/tag-matching";
import {
  isMissingTagSearchRpcError,
  searchAutocompleteCandidates,
} from "@/lib/tag-suggestions/supabase-search";

type TagRow = {
  name: string;
  description?: string | null;
  use_count?: number | null;
  keywords?: string[] | null;
};

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

    try {
      const candidates = await searchAutocompleteCandidates({
        supabase,
        query,
        excludeTags: exclude,
        limit: 8,
      });

      const rankedRpcCandidates = candidates
        .map((candidate) => ({
          name: candidate.name,
          score: scoreAutocompleteTag({ query, tag: candidate }),
          useCount: candidate.useCount || 0,
          autocompleteSimilarity: candidate.autocompleteSimilarity || 0,
        }))
        .filter((candidate) => candidate.score > 0)
        .sort(
          (a, b) =>
            b.score - a.score ||
            b.autocompleteSimilarity - a.autocompleteSimilarity ||
            b.useCount - a.useCount ||
            a.name.localeCompare(b.name, "he"),
        );

      if (rankedRpcCandidates.length > 0) {
        return NextResponse.json({
          tags: rankedRpcCandidates.map((candidate) => candidate.name).slice(0, 8),
        });
      }
    } catch (rpcError) {
      if (!isMissingTagSearchRpcError(rpcError as { code?: string; message?: string })) {
        console.error("Tags autocomplete RPC error:", rpcError);
      }
    }

    const { data: dataWithKeywords, error: errorWithKeywords } = await supabase
      .from("tags")
      .select("name, description, use_count, keywords")
      .limit(500);

    let data: TagRow[] | null = dataWithKeywords as TagRow[] | null;
    let error = errorWithKeywords;

    if (errorWithKeywords) {
      const shouldFallbackWithoutKeywords =
        errorWithKeywords.code === "PGRST204" ||
        (errorWithKeywords.message || "").includes("keywords");

      if (shouldFallbackWithoutKeywords) {
        const fallbackResult = await supabase
          .from("tags")
          .select("name, description, use_count")
          .limit(500);

        data = fallbackResult.data as TagRow[] | null;
        error = fallbackResult.error;
      }
    }

    if (error) {
      console.error("Tags GET error:", error);
      return NextResponse.json({ error: "שגיאה בטעינת תגיות" }, { status: 500 });
    }

    const excluded = new Set(exclude);
    const tags = (data || [])
      .map(
        (tag: TagRow) => ({
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
