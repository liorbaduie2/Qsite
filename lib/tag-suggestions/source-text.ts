import { normalizeTagName } from "../tag-matching";

type TagEmbeddingSourceInput = {
  name: string;
  description?: string | null;
  keywords?: string[] | null;
};

function compactText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function buildTagEmbeddingText(tag: TagEmbeddingSourceInput): string {
  const name = normalizeTagName(tag.name);
  const description = compactText(tag.description || "");
  const keywords = Array.from(
    new Set(
      (tag.keywords || [])
        .map((keyword) => compactText(keyword || ""))
        .filter(Boolean),
    ),
  );

  return [
    `Tag name: ${name}`,
    description ? `Description: ${description}` : "",
    keywords.length > 0 ? `Related terms: ${keywords.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildQuestionEmbeddingText(
  title: string,
  content: string,
): string {
  const trimmedTitle = compactText(title);
  const trimmedContent = compactText(content);

  return [
    trimmedTitle ? `Question title: ${trimmedTitle}` : "",
    trimmedContent ? `Question details: ${trimmedContent}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
