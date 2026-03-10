import { createHash } from "node:crypto";

const OPENROUTER_EMBEDDINGS_URL = "https://openrouter.ai/api/v1/embeddings";

export const TAG_EMBEDDING_MODEL =
  process.env.OPENROUTER_EMBEDDING_MODEL ?? "openai/text-embedding-3-small";
export const TAG_EMBEDDING_DIMENSION = 1536;

type OpenRouterEmbeddingResponse = {
  data?: Array<{
    embedding?: number[];
  }>;
  error?: {
    message?: string;
  };
};

function normalizeEmbeddingInput(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function hasEmbeddingProviderConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export function buildContentHash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function serializeEmbeddingVector(values: number[]): string {
  return `[${values.map((value) => (Number.isFinite(value) ? value : 0)).join(",")}]`;
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const [embedding] = await generateEmbeddings([text]);
  return embedding ?? null;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const normalizedTexts = texts
    .map((text) => normalizeEmbeddingInput(text))
    .filter(Boolean);

  if (normalizedTexts.length === 0) {
    return [];
  }

  const response = await fetch(OPENROUTER_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "Qsite semantic tagging",
    },
    body: JSON.stringify({
      model: TAG_EMBEDDING_MODEL,
      input: normalizedTexts,
      dimensions: TAG_EMBEDDING_DIMENSION,
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | OpenRouterEmbeddingResponse
    | null;

  if (!response.ok) {
    const reason =
      payload?.error?.message ||
      `Embedding request failed with status ${response.status}`;
    throw new Error(reason);
  }

  const vectors = (payload?.data || []).map((row) =>
    Array.isArray(row.embedding) ? row.embedding : [],
  );

  if (vectors.length !== normalizedTexts.length) {
    throw new Error("Embedding provider returned an unexpected vector count");
  }

  vectors.forEach((vector) => {
    if (vector.length !== TAG_EMBEDDING_DIMENSION) {
      throw new Error(
        `Expected ${TAG_EMBEDDING_DIMENSION}-dimensional embeddings, received ${vector.length}`,
      );
    }
  });

  return vectors;
}
