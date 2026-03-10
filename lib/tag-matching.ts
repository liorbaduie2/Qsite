export interface TagScoreEntry {
  name: string;
  description?: string | null;
  useCount?: number | null;
  recentCount?: number | null;
  keywords?: string[] | null;
}

const STATIC_TAG_KEYWORDS: Record<string, string[]> = {
  "יוטיוב": ["סרטון", "סרטונים", "וידאו", "ערוץ", "להעלות", "העלאה"],
  "טיקטוק": ["סרטון", "סרטונים", "וידאו קצר", "רילס", "להעלות", "ויראלי"],
  "אינסטגרם": ["רילס", "סטורי", "פוסט", "פיד", "להעלות", "עוקבים"],
  "פייסבוק": ["פוסט", "פוסטים", "קבוצה", "עמוד", "להעלות", "שיתוף"],
  "פוסטים": ["פוסט", "פוסטים", "פרסום", "לפרסם", "להעלות"],
  "סטורי": ["סטורי", "סטוריז", "סיפור", "להעלות"],
  "רשתות חברתיות": [
    "פוסט",
    "פוסטים",
    "סרטון",
    "סרטונים",
    "סושיאל",
    "להעלות",
    "לפרסם",
  ],
  "סרטים": ["סרט", "סרטים", "סרטון", "סרטונים", "וידאו"],
  "משחקים": ["משחק", "גיימינג", "גיימר", "סטים"],
  "סטים": ["steam", "סטים", "משחקים", "גיימינג"],
  "אתר": ["אתר", "אתרים", "עמוד", "דף", "פרסום"],
  "דעות גולשים": ["תגובות", "דעות", "ביקורות", "גולשים"],
};

const MATCH_STOPWORDS = new Set([
  "איך",
  "למה",
  "מה",
  "מי",
  "האם",
  "אני",
  "את",
  "אתה",
  "אתם",
  "אתן",
  "אנחנו",
  "הוא",
  "היא",
  "הם",
  "הן",
  "יש",
  "אין",
  "של",
  "עם",
  "בלי",
  "על",
  "אל",
  "אם",
  "או",
  "גם",
  "כי",
  "כדי",
  "רק",
  "כל",
  "עוד",
  "מאוד",
  "זה",
  "זאת",
  "זו",
  "כזה",
  "כזאת",
  "צריך",
  "צריכה",
  "צריכים",
  "רוצה",
  "רוצים",
  "אפשר",
  "יכול",
  "יכולה",
  "להיות",
  "לעשות",
  "עושה",
  "עושים",
  "שאלה",
  "שאלות",
  "כללי",
  "כללית",
  "כלליות",
  "כלליים",
  "נושא",
  "נושאים",
  "בנושא",
]);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeTagName(tag: string): string {
  return tag.replace(/^#+/, "").replace(/\s+/g, " ").trim();
}

export function normalizeTextForMatch(text: string): string {
  return normalizeTagName(text)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[,"'`[\]{}!?.,:;()\\/|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasHebrewCharacters(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

function getMinimumTokenLength(token: string): number {
  return hasHebrewCharacters(token) ? 2 : 3;
}

function normalizeToken(
  token: string,
  options: { stripPrefix?: boolean; stripPlural?: boolean } = {},
): string {
  const { stripPrefix = false, stripPlural = true } = options;
  let normalized = token;

  if (stripPrefix) {
    let prefixRemovals = 0;

    while (
      prefixRemovals < 2 &&
      /^[הובכלמש]/.test(normalized) &&
      normalized.length >= 4
    ) {
      normalized = normalized.slice(1);
      prefixRemovals += 1;
    }
  }

  if (stripPlural && normalized.endsWith("ים") && normalized.length >= 4) {
    normalized = normalized.slice(0, -2);
  } else if (
    stripPlural &&
    normalized.endsWith("ות") &&
    normalized.length >= 4
  ) {
    normalized = normalized.slice(0, -2);
  }

  return normalized;
}

export function tokenizeForMatch(
  text: string,
  options: { stripPrefix?: boolean; stripPlural?: boolean } = {},
): string[] {
  return normalizeTextForMatch(text)
    .split(" ")
    .map((token) => normalizeToken(token, options))
    .filter(
      (token) =>
        token.length >= getMinimumTokenLength(token) &&
        !MATCH_STOPWORDS.has(token),
    );
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsWholePhrase(text: string, phrase: string): boolean {
  if (!text || !phrase) return false;

  const pattern = new RegExp(
    `(^|\\s)${escapeRegex(phrase).replace(/\\ /g, "\\s+")}(?=\\s|$)`,
  );

  return pattern.test(text);
}

function getPhraseMatches(text: string, phrases: string[]): string[] {
  return phrases.filter((phrase) => containsWholePhrase(text, phrase));
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  const current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + substitutionCost,
      );
    }

    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

function isFuzzyMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const lengthDelta = Math.abs(a.length - b.length);
  if (lengthDelta > 2) return false;
  if (a.length < 5 || b.length < 5) return false;

  const maxDistance = a.length <= 4 || b.length <= 4 ? 1 : 2;
  return levenshteinDistance(a, b) <= maxDistance;
}

function isPartialTokenMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a.length < 4 || b.length < 4) return false;

  return a.startsWith(b) || b.startsWith(a);
}

function getKeywordPhrases(tag: TagScoreEntry): string[] {
  return Array.from(
    new Set(
      [tag.name, ...(tag.keywords || []), ...(STATIC_TAG_KEYWORDS[tag.name] || [])]
        .map((text) => normalizeTextForMatch(text))
        .filter((text) => text.length >= 2 && !MATCH_STOPWORDS.has(text)),
    ),
  );
}

type TokenMatchStats = {
  exactMatches: number;
  partialMatches: number;
  fuzzyMatches: number;
  matchedTagTokens: string[];
};

function getTokenMatchStats(
  sourceTokens: string[],
  tagTokens: string[],
): TokenMatchStats {
  let exactMatches = 0;
  let partialMatches = 0;
  let fuzzyMatches = 0;
  const matchedTagTokens = new Set<string>();

  for (const sourceToken of sourceTokens) {
    const exactTagToken = tagTokens.find((tagToken) => tagToken === sourceToken);

    if (exactTagToken) {
      exactMatches += 1;
      matchedTagTokens.add(exactTagToken);
      continue;
    }

    const partialTagToken = tagTokens.find((tagToken) =>
      isPartialTokenMatch(sourceToken, tagToken),
    );

    if (partialTagToken) {
      partialMatches += 1;
      matchedTagTokens.add(partialTagToken);
      continue;
    }

    const fuzzyTagToken = tagTokens.find((tagToken) =>
      isFuzzyMatch(sourceToken, tagToken),
    );

    if (fuzzyTagToken) {
      fuzzyMatches += 1;
      matchedTagTokens.add(fuzzyTagToken);
    }
  }

  return {
    exactMatches,
    partialMatches,
    fuzzyMatches,
    matchedTagTokens: Array.from(matchedTagTokens),
  };
}

function scoreTokenMatches(
  stats: TokenMatchStats,
  weights: { exact: number; partial: number; fuzzy: number },
): number {
  return (
    stats.exactMatches * weights.exact +
    stats.partialMatches * weights.partial +
    stats.fuzzyMatches * weights.fuzzy
  );
}

function getDistinctTokenCount(tokens: string[]): number {
  return new Set(tokens).size;
}

export function shouldFetchSuggestedTags(title: string, content: string): boolean {
  const titleTokens = tokenizeForMatch(title, { stripPrefix: true });
  const contentTokens = tokenizeForMatch(content, { stripPrefix: true });
  const normalizedTitle = normalizeTextForMatch(title);

  if (contentTokens.length > 0) return true;
  if (titleTokens.length >= 2) return true;

  return normalizedTitle.length >= 16;
}

function getPopularityWeight(tag: TagScoreEntry, multiplier: number): number {
  return (
    clamp(Math.log1p(tag.useCount || 0) * 6, 0, 28) +
    clamp(Math.log1p(tag.recentCount || 0) * 4, 0, 12)
  ) * multiplier;
}

function getConfidenceMultiplier(
  lexicalScore: number,
  contentTokenCount: number,
): number {
  if (lexicalScore >= 90) return 1;
  if (lexicalScore >= 55) return contentTokenCount > 0 ? 0.75 : 0.55;
  if (lexicalScore >= 32) return contentTokenCount > 0 ? 0.4 : 0.2;

  return 0;
}

function getTagKeywordTexts(tag: TagScoreEntry): string[] {
  const staticKeywords = STATIC_TAG_KEYWORDS[tag.name] || [];
  return [tag.name, ...(tag.keywords || []), ...staticKeywords].filter(Boolean);
}

function getTagTokens(tag: TagScoreEntry): string[] {
  return Array.from(
    new Set(
      getTagKeywordTexts(tag).flatMap((text) =>
        tokenizeForMatch(text, { stripPrefix: true }),
      ),
    ),
  );
}

function getPromptTokens(title: string, content: string): {
  titleTokens: string[];
  contentTokens: string[];
} {
  return {
    titleTokens: tokenizeForMatch(title, { stripPrefix: true }),
    contentTokens: tokenizeForMatch(content, { stripPrefix: true }),
  };
}

function hasStrongLexicalEvidence(params: {
  exactPhraseHits: number;
  titleKeywordPhraseHits: number;
  titleTokenStats: TokenMatchStats;
  contentTokenStats: TokenMatchStats;
  matchedPromptTokens: number;
  lexicalScore: number;
}): boolean {
  const {
    exactPhraseHits,
    titleKeywordPhraseHits,
    titleTokenStats,
    contentTokenStats,
    matchedPromptTokens,
    lexicalScore,
  } = params;

  return (
    exactPhraseHits > 0 ||
    titleKeywordPhraseHits > 0 ||
    titleTokenStats.exactMatches >= 2 ||
    (titleTokenStats.exactMatches >= 1 &&
      (contentTokenStats.exactMatches > 0 || contentTokenStats.partialMatches > 0)) ||
    (matchedPromptTokens >= 2 && lexicalScore >= 32)
  );
}

export function getTopSuggestionNames(params: {
  title: string;
  content: string;
  tags: TagScoreEntry[];
  excludeTags?: string[];
  limit?: number;
}): string[] {
  const { title, content, tags, excludeTags = [], limit = 8 } = params;
  const excludedTagSet = new Set(
    excludeTags.map((tag) => normalizeTagName(tag)).filter(Boolean),
  );

  return tags
    .filter((tag) => !excludedTagSet.has(normalizeTagName(tag.name)))
    .map((tag) => ({
      name: tag.name,
      score: scoreSuggestedTag({ title, content, tag }),
      useCount: tag.useCount || 0,
      recentCount: tag.recentCount || 0,
    }))
    .filter((tag) => tag.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.recentCount || 0) - (a.recentCount || 0) ||
        (b.useCount || 0) - (a.useCount || 0) ||
        a.name.localeCompare(b.name, "he"),
    )
    .slice(0, limit)
    .map((tag) => tag.name);
  }

export function scoreSuggestedTag(params: {
  title: string;
  content: string;
  tag: TagScoreEntry;
}): number {
  const { title, content, tag } = params;
  const normalizedTitle = normalizeTextForMatch(title);
  const normalizedContent = normalizeTextForMatch(content);
  const normalizedTag = normalizeTextForMatch(tag.name);

  if (!normalizedTag) return 0;
  if (!shouldFetchSuggestedTags(title, content)) return 0;

  const { titleTokens, contentTokens } = getPromptTokens(title, content);
  const tagTokens = getTagTokens(tag);
  const keywordPhrases = getKeywordPhrases(tag);
  const titleKeywordPhraseMatches = getPhraseMatches(normalizedTitle, keywordPhrases);
  const contentKeywordPhraseMatches = getPhraseMatches(normalizedContent, keywordPhrases);
  const titleTokenStats = getTokenMatchStats(titleTokens, tagTokens);
  const contentTokenStats = getTokenMatchStats(contentTokens, tagTokens);
  const matchedPromptTokens = new Set([
    ...titleTokenStats.matchedTagTokens,
    ...contentTokenStats.matchedTagTokens,
  ]).size;
  const titlePromptTokenCount = getDistinctTokenCount(titleTokens);
  const contentPromptTokenCount = getDistinctTokenCount(contentTokens);

  let lexicalScore = 0;
  let exactPhraseHits = 0;

  if (normalizedTitle === normalizedTag) {
    lexicalScore += 220;
    exactPhraseHits += 1;
  }

  if (containsWholePhrase(normalizedTitle, normalizedTag)) {
    lexicalScore += 120;
    exactPhraseHits += 1;
  }

  if (containsWholePhrase(normalizedContent, normalizedTag)) {
    lexicalScore += 60;
    exactPhraseHits += 1;
  }

  lexicalScore +=
    titleKeywordPhraseMatches.filter((phrase) => phrase !== normalizedTag).length * 48;
  lexicalScore +=
    contentKeywordPhraseMatches.filter((phrase) => phrase !== normalizedTag).length * 20;
  lexicalScore += scoreTokenMatches(titleTokenStats, {
    exact: 22,
    partial: 8,
    fuzzy: 3,
  });
  lexicalScore += scoreTokenMatches(contentTokenStats, {
    exact: 8,
    partial: 3,
    fuzzy: 1,
  });

  if (lexicalScore <= 0) return 0;
  if (
    !hasStrongLexicalEvidence({
      exactPhraseHits,
      titleKeywordPhraseHits: titleKeywordPhraseMatches.length,
      titleTokenStats,
      contentTokenStats,
      matchedPromptTokens,
      lexicalScore,
    })
  ) {
    return 0;
  }

  const coverageBoost =
    Math.min(titlePromptTokenCount, titleTokenStats.matchedTagTokens.length) * 6 +
    Math.min(contentPromptTokenCount, contentTokenStats.matchedTagTokens.length) * 3;

  lexicalScore += coverageBoost;

  const confidenceMultiplier = getConfidenceMultiplier(
    lexicalScore,
    contentPromptTokenCount,
  );
  const popularityScore = getPopularityWeight(tag, confidenceMultiplier);

  return lexicalScore + popularityScore;
}

export function scoreAutocompleteTag(params: {
  query: string;
  tag: TagScoreEntry;
}): number {
  const { query, tag } = params;
  const normalizedQuery = normalizeTextForMatch(query);
  const normalizedTag = normalizeTextForMatch(tag.name);

  if (!normalizedQuery || !normalizedTag) return 0;

  const queryTokens = tokenizeForMatch(query, { stripPrefix: true });
  const tagTokens = getTagTokens(tag);
  const keywordPhrases = getKeywordPhrases(tag);
  const queryPhraseMatches = getPhraseMatches(normalizedQuery, keywordPhrases);
  const tokenStats = getTokenMatchStats(queryTokens, tagTokens);

  let lexicalScore = 0;

  if (normalizedTag === normalizedQuery) lexicalScore += 200;
  if (normalizedTag.startsWith(normalizedQuery)) lexicalScore += 120;
  if (containsWholePhrase(normalizedTag, normalizedQuery)) lexicalScore += 70;
  lexicalScore +=
    queryPhraseMatches.filter((phrase) => phrase !== normalizedTag).length * 45;
  lexicalScore += scoreTokenMatches(tokenStats, {
    exact: 26,
    partial: 16,
    fuzzy: 4,
  });

  if (lexicalScore <= 0) return 0;

  return lexicalScore + clamp(Math.log1p(tag.useCount || 0) * 4, 0, 18);
}
