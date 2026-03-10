import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeTagName } from "../tag-matching";
import { serializeEmbeddingVector } from "../ai/embeddings";
import type { HybridTagCandidate } from "./types";

type SupabaseLikeError = {
  code?: string;
  message?: string;
};

type RpcTagRow = {
  tag_id?: string | null;
  name?: string | null;
  description?: string | null;
  use_count?: number | null;
  keywords?: string[] | null;
  recent_count?: number | null;
  shown_count?: number | null;
  selected_count?: number | null;
  accepted_count?: number | null;
  manual_count?: number | null;
  semantic_similarity?: number | null;
  question_similarity?: number | null;
  supporting_questions?: number | null;
  autocomplete_similarity?: number | null;
};

function mapRpcCandidate(row: RpcTagRow): HybridTagCandidate | null {
  const name = normalizeTagName(row.name || "");
  if (!name) return null;

  return {
    id: row.tag_id || undefined,
    name,
    description: row.description || "",
    useCount: row.use_count || 0,
    recentCount: row.recent_count || 0,
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    shownCount: row.shown_count || 0,
    selectedCount: row.selected_count || 0,
    acceptedCount: row.accepted_count || 0,
    manualCount: row.manual_count || 0,
    semanticSimilarity: row.semantic_similarity || 0,
    questionSimilarity: row.question_similarity || 0,
    supportingQuestions: row.supporting_questions || 0,
    autocompleteSimilarity: row.autocomplete_similarity || 0,
  };
}

export function isMissingTagSearchRpcError(
  error: SupabaseLikeError | null | undefined,
): boolean {
  const message = error?.message || "";

  return (
    error?.code === "PGRST202" ||
    error?.code === "42883" ||
    message.includes("Could not find the function") ||
    message.includes("function public.")
  );
}

export async function searchAutocompleteCandidates(params: {
  supabase: SupabaseClient;
  query: string;
  excludeTags?: string[];
  limit?: number;
}): Promise<HybridTagCandidate[]> {
  const { supabase, query, excludeTags = [], limit = 8 } = params;

  const { data, error } = await supabase.rpc("search_tags_autocomplete", {
    query_text: query,
    exclude_names: excludeTags,
    match_count: limit,
  });

  if (error) {
    throw error;
  }

  return ((data || []) as Array<RpcTagRow | null | undefined>)
    .map((row: RpcTagRow | null | undefined) => mapRpcCandidate((row || {}) as RpcTagRow))
    .filter((row): row is HybridTagCandidate => Boolean(row));
}

export async function matchSemanticTagCandidates(params: {
  supabase: SupabaseClient;
  embedding: number[];
  excludeTags?: string[];
  limit?: number;
}): Promise<HybridTagCandidate[]> {
  const { supabase, embedding, excludeTags = [], limit = 25 } = params;

  const { data, error } = await supabase.rpc("match_tag_candidates", {
    query_embedding: serializeEmbeddingVector(embedding),
    exclude_names: excludeTags,
    match_count: limit,
  });

  if (error) {
    throw error;
  }

  return ((data || []) as Array<RpcTagRow | null | undefined>)
    .map((row: RpcTagRow | null | undefined) => mapRpcCandidate((row || {}) as RpcTagRow))
    .filter((row): row is HybridTagCandidate => Boolean(row));
}

export async function matchSimilarQuestionTagCandidates(params: {
  supabase: SupabaseClient;
  embedding: number[];
  excludeTags?: string[];
  limit?: number;
  questionLimit?: number;
}): Promise<HybridTagCandidate[]> {
  const {
    supabase,
    embedding,
    excludeTags = [],
    limit = 25,
    questionLimit = 20,
  } = params;

  const { data, error } = await supabase.rpc("match_similar_tagged_questions", {
    query_embedding: serializeEmbeddingVector(embedding),
    exclude_names: excludeTags,
    match_count: limit,
    question_limit: questionLimit,
  });

  if (error) {
    throw error;
  }

  return ((data || []) as Array<RpcTagRow | null | undefined>)
    .map((row: RpcTagRow | null | undefined) => mapRpcCandidate((row || {}) as RpcTagRow))
    .filter((row): row is HybridTagCandidate => Boolean(row));
}
