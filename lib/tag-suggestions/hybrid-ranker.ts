import {
  normalizeTagName,
  scoreSuggestedTag,
  type TagScoreEntry,
} from "../tag-matching";
import type { HybridTagCandidate } from "./types";

export type RankedHybridTagCandidate = HybridTagCandidate & {
  score: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mergeStringArray(
  current: string[] | null | undefined,
  next: string[] | null | undefined,
): string[] {
  return Array.from(new Set([...(current || []), ...(next || [])]));
}

function maxNullable(
  current: number | null | undefined,
  next: number | null | undefined,
): number {
  return Math.max(current || 0, next || 0);
}

function getFeedbackBoost(candidate: HybridTagCandidate): number {
  const shownCount = candidate.shownCount || 0;
  const selectedCount = candidate.selectedCount || 0;
  const acceptedCount = candidate.acceptedCount || 0;
  const manualCount = candidate.manualCount || 0;

  let score = 0;

  if (shownCount > 0 && acceptedCount > 0) {
    score += clamp((acceptedCount / shownCount) * 18, 0, 18);
  }

  score += clamp(Math.log1p(selectedCount) * 2.8, 0, 12);
  score += clamp(Math.log1p(manualCount) * 2.2, 0, 8);

  return score;
}

function getSemanticBoost(candidate: HybridTagCandidate): number {
  const semanticSimilarity = clamp(candidate.semanticSimilarity || 0, 0, 1);
  if (semanticSimilarity <= 0) return 0;
  return semanticSimilarity >= 0.22
    ? semanticSimilarity * 54
    : semanticSimilarity * 20;
}

function getSimilarQuestionBoost(candidate: HybridTagCandidate): number {
  const questionSimilarity = clamp(candidate.questionSimilarity || 0, 0, 1.6);
  const supportingQuestions = clamp(candidate.supportingQuestions || 0, 0, 4);

  if (questionSimilarity <= 0) return 0;

  return questionSimilarity * 38 + supportingQuestions * 3;
}

function getAutocompleteBoost(candidate: HybridTagCandidate): number {
  const autocompleteSimilarity = clamp(
    candidate.autocompleteSimilarity || 0,
    0,
    1.4,
  );

  if (autocompleteSimilarity <= 0) return 0;
  return autocompleteSimilarity * 6;
}

function getFallbackPopularityBoost(candidate: TagScoreEntry): number {
  const useCount = candidate.useCount || 0;
  const recentCount = candidate.recentCount || 0;

  return (
    clamp(Math.log1p(useCount) * 4, 0, 18) +
    clamp(Math.log1p(recentCount) * 6, 0, 16)
  );
}

function getSemanticOnlyConfidence(params: {
  semanticSimilarity: number;
  questionSimilarity: number;
  supportingQuestions: number;
}): number {
  const { semanticSimilarity, questionSimilarity, supportingQuestions } = params;

  if (questionSimilarity >= 0.82 && supportingQuestions >= 2) return 1;
  if (semanticSimilarity >= 0.88) return 1;
  if (semanticSimilarity >= 0.78 && questionSimilarity >= 0.56) return 0.95;
  if (semanticSimilarity >= 0.72 && supportingQuestions >= 2) return 0.85;
  if (questionSimilarity >= 0.68 && supportingQuestions >= 2) return 0.85;
  if (semanticSimilarity >= 0.66 && questionSimilarity >= 0.48) return 0.78;
  if (semanticSimilarity >= 0.62 && supportingQuestions >= 3) return 0.7;

  return 0;
}

function hasHybridEvidence(params: {
  lexicalScore: number;
  autocompleteSimilarity: number;
  semanticOnlyConfidence: number;
}): boolean {
  const { lexicalScore, autocompleteSimilarity, semanticOnlyConfidence } = params;

  return (
    lexicalScore >= 18 ||
    autocompleteSimilarity >= 1.05 ||
    semanticOnlyConfidence > 0
  );
}

export function mergeHybridTagCandidates(
  candidates: HybridTagCandidate[],
): HybridTagCandidate[] {
  const merged = new Map<string, HybridTagCandidate>();

  for (const candidate of candidates) {
    const normalizedName = normalizeTagName(candidate.name || "");
    if (!normalizedName) continue;

    const key = candidate.id || normalizedName;
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, {
        ...candidate,
        name: normalizedName,
      });
      continue;
    }

    merged.set(key, {
      ...existing,
      ...candidate,
      name: normalizedName,
      description: candidate.description ?? existing.description,
      useCount: maxNullable(existing.useCount, candidate.useCount),
      recentCount: maxNullable(existing.recentCount, candidate.recentCount),
      keywords: mergeStringArray(existing.keywords, candidate.keywords),
      shownCount: maxNullable(existing.shownCount, candidate.shownCount),
      selectedCount: maxNullable(existing.selectedCount, candidate.selectedCount),
      acceptedCount: maxNullable(existing.acceptedCount, candidate.acceptedCount),
      manualCount: maxNullable(existing.manualCount, candidate.manualCount),
      semanticSimilarity: maxNullable(
        existing.semanticSimilarity,
        candidate.semanticSimilarity,
      ),
      questionSimilarity: maxNullable(
        existing.questionSimilarity,
        candidate.questionSimilarity,
      ),
      supportingQuestions: maxNullable(
        existing.supportingQuestions,
        candidate.supportingQuestions,
      ),
      autocompleteSimilarity: maxNullable(
        existing.autocompleteSimilarity,
        candidate.autocompleteSimilarity,
      ),
    });
  }

  return Array.from(merged.values());
}

export function rankHybridTagCandidates(params: {
  title: string;
  content: string;
  candidates: HybridTagCandidate[];
  excludeTags?: string[];
  limit?: number;
}): RankedHybridTagCandidate[] {
  const { title, content, candidates, excludeTags = [], limit = 5 } = params;
  const excluded = new Set(
    excludeTags.map((tag) => normalizeTagName(tag)).filter(Boolean),
  );

  return mergeHybridTagCandidates(candidates)
    .filter((candidate) => !excluded.has(normalizeTagName(candidate.name)))
    .map((candidate) => {
      const lexicalScore = scoreSuggestedTag({
        title,
        content,
        tag: candidate,
      });
      const semanticSimilarity = candidate.semanticSimilarity || 0;
      const questionSimilarity = candidate.questionSimilarity || 0;
      const supportingQuestions = candidate.supportingQuestions || 0;
      const autocompleteSimilarity = candidate.autocompleteSimilarity || 0;
      const semanticOnlyConfidence =
        lexicalScore > 0
          ? 1
          : getSemanticOnlyConfidence({
              semanticSimilarity,
              questionSimilarity,
              supportingQuestions,
            });

      if (
        !hasHybridEvidence({
          lexicalScore,
          autocompleteSimilarity,
          semanticOnlyConfidence,
        })
      ) {
        return {
          ...candidate,
          score: 0,
        };
      }

      const semanticBoost = getSemanticBoost(candidate);
      const similarQuestionBoost = getSimilarQuestionBoost(candidate);
      const autocompleteBoost = getAutocompleteBoost(candidate);
      const feedbackBoost = getFeedbackBoost(candidate);
      const confidenceMultiplier = lexicalScore > 0 ? 1 : semanticOnlyConfidence;
      const sourceSynergy =
        (lexicalScore > 0 && semanticBoost > 0 ? 6 : 0) +
        (lexicalScore > 0 && similarQuestionBoost > 0 ? 5 : 0) +
        (semanticBoost > 0 && similarQuestionBoost > 0 ? 4 : 0);

      let score =
        lexicalScore +
        semanticBoost * confidenceMultiplier +
        similarQuestionBoost * confidenceMultiplier +
        autocompleteBoost +
        feedbackBoost * (lexicalScore > 0 ? 1 : confidenceMultiplier * 0.35) +
        sourceSynergy * confidenceMultiplier;

      if (lexicalScore <= 0 && confidenceMultiplier >= 0.85) {
        score += getFallbackPopularityBoost(candidate) * 0.35;
      }

      return {
        ...candidate,
        score,
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.questionSimilarity || 0) - (a.questionSimilarity || 0) ||
        (b.semanticSimilarity || 0) - (a.semanticSimilarity || 0) ||
        (b.useCount || 0) - (a.useCount || 0) ||
        a.name.localeCompare(b.name, "he"),
    )
    .slice(0, limit);
}

export function rankHybridTagSuggestions(params: {
  title: string;
  content: string;
  candidates: HybridTagCandidate[];
  excludeTags?: string[];
  limit?: number;
}): string[] {
  return rankHybridTagCandidates(params).map((candidate) => candidate.name);
}
