import type { SupabaseClient } from "@supabase/supabase-js";
import {
  TAG_EMBEDDING_MODEL,
  buildContentHash,
  generateEmbedding,
  generateEmbeddings,
  hasEmbeddingProviderConfigured,
  serializeEmbeddingVector,
} from "../ai/embeddings";
import { getAdminClient } from "../supabase/admin";
import { buildQuestionEmbeddingText, buildTagEmbeddingText } from "./source-text";

type TagCatalogRow = {
  id: string;
  name: string;
  description?: string | null;
  keywords?: string[] | null;
};

type ExistingTagEmbeddingRow = {
  tag_id: string;
  content_hash?: string | null;
  model_name?: string | null;
};

type TagEmbeddingSyncOptions = {
  adminClient?: SupabaseClient;
  tagIds?: string[];
  batchSize?: number;
  limit?: number;
  force?: boolean;
};

export type TagEmbeddingSyncResult = {
  scanned: number;
  synced: number;
  skipped: boolean;
};

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunkSize = Math.max(size, 1);
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

function getAdminSupabaseClient(client?: SupabaseClient): SupabaseClient {
  return client ?? getAdminClient();
}

export async function syncTagEmbeddings(
  options: TagEmbeddingSyncOptions = {},
): Promise<TagEmbeddingSyncResult> {
  if (!hasEmbeddingProviderConfigured()) {
    return { scanned: 0, synced: 0, skipped: true };
  }

  const {
    adminClient,
    tagIds,
    batchSize = 20,
    limit,
    force = false,
  } = options;
  const supabase = getAdminSupabaseClient(adminClient);

  let tagsQuery = supabase
    .from("tags")
    .select("id, name, description, keywords")
    .order("created_at", { ascending: false });

  if (Array.isArray(tagIds) && tagIds.length > 0) {
    tagsQuery = tagsQuery.in("id", tagIds);
  }

  const { data: tags, error: tagsError } =
    await tagsQuery.returns<TagCatalogRow[]>();

  if (tagsError) {
    throw tagsError;
  }

  const catalogRows = tags || [];
  if (catalogRows.length === 0) {
    return { scanned: 0, synced: 0, skipped: false };
  }

  let existingQuery = supabase
    .from("tag_embeddings")
    .select("tag_id, content_hash, model_name");

  if (Array.isArray(tagIds) && tagIds.length > 0) {
    existingQuery = existingQuery.in("tag_id", tagIds);
  }

  const { data: existingRows, error: existingError } =
    await existingQuery.returns<ExistingTagEmbeddingRow[]>();

  if (existingError) {
    throw existingError;
  }

  const existingByTagId = new Map(
    (existingRows || []).map((row) => [row.tag_id, row]),
  );

  const pendingRows = catalogRows
    .map((tag) => {
      const sourceText = buildTagEmbeddingText(tag);
      const contentHash = buildContentHash(sourceText);
      const existing = existingByTagId.get(tag.id);
      const isStale =
        force ||
        !existing ||
        existing.content_hash !== contentHash ||
        existing.model_name !== TAG_EMBEDDING_MODEL;

      return {
        ...tag,
        sourceText,
        contentHash,
        isStale,
      };
    })
    .filter((tag) => tag.isStale);

  const limitedPendingRows =
    typeof limit === "number" && limit > 0
      ? pendingRows.slice(0, limit)
      : pendingRows;

  for (const batch of chunkArray(limitedPendingRows, batchSize)) {
    const vectors = await generateEmbeddings(batch.map((row) => row.sourceText));
    const upsertRows = batch.map((row, index) => {
      const vector = vectors[index];
      if (!vector?.length) {
        throw new Error(`Missing embedding vector for tag ${row.id}`);
      }

      return {
        tag_id: row.id,
        source_text: row.sourceText,
        content_hash: row.contentHash,
        embedding: serializeEmbeddingVector(vector),
        model_name: TAG_EMBEDDING_MODEL,
        updated_at: new Date().toISOString(),
      };
    });

    const { error: upsertError } = await supabase
      .from("tag_embeddings")
      .upsert(upsertRows, {
        onConflict: "tag_id",
      });

    if (upsertError) {
      throw upsertError;
    }
  }

  return {
    scanned: catalogRows.length,
    synced: limitedPendingRows.length,
    skipped: false,
  };
}

export async function upsertQuestionEmbedding(params: {
  questionId: string;
  title: string;
  content: string;
  adminClient?: SupabaseClient;
}): Promise<boolean> {
  if (!hasEmbeddingProviderConfigured()) {
    return false;
  }

  const { questionId, title, content, adminClient } = params;
  const sourceText = buildQuestionEmbeddingText(title, content);

  if (!sourceText) {
    return false;
  }

  const embedding = await generateEmbedding(sourceText);
  if (!embedding?.length) {
    return false;
  }

  const supabase = getAdminSupabaseClient(adminClient);
  const { error } = await supabase.from("question_embeddings").upsert(
    {
      question_id: questionId,
      source_text: sourceText,
      content_hash: buildContentHash(sourceText),
      embedding: serializeEmbeddingVector(embedding),
      model_name: TAG_EMBEDDING_MODEL,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "question_id",
    },
  );

  if (error) {
    throw error;
  }

  return true;
}
