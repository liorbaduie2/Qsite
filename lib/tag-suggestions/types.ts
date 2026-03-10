import type { TagScoreEntry } from "../tag-matching";

export type HybridTagCandidate = TagScoreEntry & {
  id?: string;
  shownCount?: number | null;
  selectedCount?: number | null;
  acceptedCount?: number | null;
  manualCount?: number | null;
  semanticSimilarity?: number | null;
  questionSimilarity?: number | null;
  supportingQuestions?: number | null;
  autocompleteSimilarity?: number | null;
};
