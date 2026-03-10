import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildSuggestionSearchTerms,
  getTopSuggestionNames,
  normalizeTagName,
  scoreAutocompleteTag,
  shouldFetchSuggestedTags,
} from "@/lib/tag-matching";
import {
  rankHybridTagSuggestions,
  mergeHybridTagCandidates,
} from "@/lib/tag-suggestions/hybrid-ranker";
import {
  isMissingTagSearchRpcError,
  matchSemanticTagCandidates,
  matchSimilarQuestionTagCandidates,
  searchAutocompleteCandidates,
} from "@/lib/tag-suggestions/supabase-search";
import { buildQuestionEmbeddingText } from "@/lib/tag-suggestions/source-text";
import {
  generateEmbedding,
  hasEmbeddingProviderConfigured,
} from "@/lib/ai/embeddings";
import type { HybridTagCandidate } from "@/lib/tag-suggestions/types";

type TagRow = {
  name: string;
  description?: string | null;
  use_count?: number | null;
  keywords?: string[] | null;
};

async function getLegacyFallbackSuggestions(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  title: string;
  content: string;
  excludeTags: string[];
}): Promise<string[]> {
  const { supabase, title, content, excludeTags } = params;
  const { data: dbTagsWithKeywords, error: tagsErrorWithKeywords } = await supabase
    .from("tags")
    .select("name, description, use_count, keywords");

  let dbTags: TagRow[] | null = dbTagsWithKeywords as TagRow[] | null;
  let tagsError = tagsErrorWithKeywords;

  if (tagsErrorWithKeywords) {
    const shouldFallbackWithoutKeywords =
      tagsErrorWithKeywords.code === "PGRST204" ||
      (tagsErrorWithKeywords.message || "").includes("keywords");

    if (shouldFallbackWithoutKeywords) {
      const fallbackResult = await supabase
        .from("tags")
        .select("name, description, use_count");

      dbTags = fallbackResult.data as TagRow[] | null;
      tagsError = fallbackResult.error;
    }
  }

  if (tagsError || !dbTags?.length) {
    return [];
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
    .map((tag: TagRow) => ({
      name: normalizeTagName(tag.name),
      description: tag.description || "",
      useCount: tag.use_count || 0,
      recentCount: recentCounts.get(normalizeTagName(tag.name)) || 0,
      keywords: Array.isArray(tag.keywords) ? tag.keywords : [],
    }))
    .filter((tag) => tag.name);

  return getTopSuggestionNames({
    title,
    content,
    tags: catalogTags,
    excludeTags,
    limit: 5,
  });
}

async function getLexicalCandidates(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  title: string;
  content: string;
  excludeTags: string[];
}): Promise<HybridTagCandidate[]> {
  const { supabase, title, content, excludeTags } = params;
  const searchTerms = buildSuggestionSearchTerms(title, content, 6);

  if (searchTerms.length === 0) {
    return [];
  }

  const results = await Promise.allSettled(
    searchTerms.map((term) =>
      searchAutocompleteCandidates({
        supabase,
        query: term,
        excludeTags,
        limit: 12,
      }),
    ),
  );

  const candidates: HybridTagCandidate[] = [];
  for (const [index, result] of results.entries()) {
    if (result.status === "fulfilled") {
      const searchTerm = searchTerms[index] || "";
      const rankedCandidates = result.value
        .map((candidate) => ({
          candidate,
          score: scoreAutocompleteTag({ query: searchTerm, tag: candidate }),
        }));
      candidates.push(
        ...rankedCandidates
          .filter(({ score }) => score > 0)
          .map(({ candidate }) => candidate),
      );
      continue;
    }

    throw result.reason;
  }

  return mergeHybridTagCandidates(candidates);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title = "",
      content = "",
      description = "",
      excludeTags = [],
    } = body;
    const promptContent =
      typeof content === "string" && content.trim().length > 0
        ? content
        : typeof description === "string"
          ? description
          : "";
    const normalizedExcludeTags = Array.isArray(excludeTags)
      ? excludeTags.map((tag) => normalizeTagName(String(tag))).filter(Boolean)
      : [];

    if (!title.trim() && !promptContent.trim()) {
      return NextResponse.json(
        { error: "יש להזין כותרת או תוכן" },
        { status: 400 },
      );
    }

    if (!shouldFetchSuggestedTags(title, promptContent)) {
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }

    const supabase = await createClient();
    let lexicalCandidates: HybridTagCandidate[] = [];

    try {
      lexicalCandidates = await getLexicalCandidates({
        supabase,
        title,
        content: promptContent,
        excludeTags: normalizedExcludeTags,
      });
    } catch (lexicalError) {
      if (!isMissingTagSearchRpcError(lexicalError as { code?: string; message?: string })) {
        console.error("Lexical tag candidate error:", lexicalError);
      }
    }

    let semanticCandidates: HybridTagCandidate[] = [];
    let similarQuestionCandidates: HybridTagCandidate[] = [];

    if (hasEmbeddingProviderConfigured()) {
      try {
        const embedding = await generateEmbedding(
          buildQuestionEmbeddingText(title, promptContent),
        );

        if (embedding?.length) {
          const [semanticResult, similarQuestionResult] =
            await Promise.allSettled([
              matchSemanticTagCandidates({
                supabase,
                embedding,
                excludeTags: normalizedExcludeTags,
                limit: 24,
              }),
              matchSimilarQuestionTagCandidates({
                supabase,
                embedding,
                excludeTags: normalizedExcludeTags,
                limit: 24,
                questionLimit: 16,
              }),
            ]);

          if (semanticResult.status === "fulfilled") {
            semanticCandidates = semanticResult.value;
          } else if (
            !isMissingTagSearchRpcError(
              semanticResult.reason as { code?: string; message?: string },
            )
          ) {
            console.error(
              "Semantic tag candidate error:",
              semanticResult.reason,
            );
          }

          if (similarQuestionResult.status === "fulfilled") {
            similarQuestionCandidates = similarQuestionResult.value;
          } else if (
            !isMissingTagSearchRpcError(
              similarQuestionResult.reason as { code?: string; message?: string },
            )
          ) {
            console.error(
              "Similar question tag candidate error:",
              similarQuestionResult.reason,
            );
          }
        }
      } catch (embeddingError) {
        console.error("Tag suggestion embedding error:", embeddingError);
      }
    }

    const mergedCandidates = mergeHybridTagCandidates([
      ...lexicalCandidates,
      ...semanticCandidates,
      ...similarQuestionCandidates,
    ]);

    const suggestions =
      mergedCandidates.length > 0
        ? rankHybridTagSuggestions({
            title,
            content: promptContent,
            candidates: mergedCandidates,
            excludeTags: normalizedExcludeTags,
            limit: 5,
          })
        : [];

    const legacySuggestions = await getLegacyFallbackSuggestions({
      supabase,
      title,
      content: promptContent,
      excludeTags: normalizedExcludeTags,
    });

    if (suggestions.length >= 3) {
      return NextResponse.json({ suggestions });
    }

    if (suggestions.length > 0 || legacySuggestions.length > 0) {
      return NextResponse.json({
        suggestions: Array.from(
          new Set([...legacySuggestions, ...suggestions]),
        ).slice(0, 5),
      });
    }

    return NextResponse.json({ suggestions: legacySuggestions });
  } catch (err) {
    console.error("Suggest tags error:", err);
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
  }
}
