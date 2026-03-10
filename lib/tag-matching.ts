export interface TagScoreEntry {
  name: string;
  description?: string | null;
  useCount?: number | null;
  recentCount?: number | null;
  keywords?: string[] | null;
}

const STATIC_TAG_KEYWORDS: Record<string, string[]> = {
  יוטיוב: ["סרטון", "סרטונים", "וידאו", "ערוץ", "להעלות", "העלאה"],
  טיקטוק: ["סרטון", "סרטונים", "וידאו קצר", "רילס", "להעלות", "ויראלי"],
  אינסטגרם: ["רילס", "סטורי", "פוסט", "פיד", "להעלות", "עוקבים"],
  פייסבוק: ["פוסט", "פוסטים", "קבוצה", "עמוד", "להעלות", "שיתוף"],
  פוסטים: ["פוסט", "פוסטים", "פרסום", "לפרסם", "להעלות"],
  סטורי: ["סטורי", "סטוריז", "סיפור", "להעלות"],
  "רשתות חברתיות": [
    "פוסט",
    "פוסטים",
    "סרטון",
    "סרטונים",
    "סושיאל",
    "להעלות",
    "לפרסם",
  ],
  סרטים: ["סרט", "סרטים", "סרטון", "סרטונים", "וידאו"],
  משחקים: ["משחק", "גיימינג", "גיימר", "סטים"],
  סטים: ["steam", "סטים", "משחקים", "גיימינג"],
  אתר: ["אתר", "אתרים", "עמוד", "דף", "פרסום"],
  "דעות גולשים": ["תגובות", "דעות", "ביקורות", "גולשים"],
  React: ["קומפוננטה"],
  תכנות: ["react", "nextjs", "hooks", "קומפוננטה", "state", "frontend"],
  פיתוח: ["react", "nextjs", "hooks", "קומפוננטה", "frontend", "state"],
  שינה: ["לילה", "בלילה", "קם בלילה", "מתעורר בלילה", "שינה מקוטעת"],
  "חוסר שינה": [
    "קם בלילה",
    "מתעורר בלילה",
    "שלוש פעמים בלילה",
    "שינה לא רציפה",
    "שינה מקוטעת",
  ],
  עייפות: ["מותש", "מותשת", "אין לי כוח", "אין כוח", "חסר כוח", "תשוש"],
  חולשה: ["חסר כוח", "אין כוח", "מותש", "מותשת", "חלש"],
};

const TAG_DISAMBIGUATION_RULES: Record<
  string,
  {
    weakTerms: string[];
    requiredContextTerms: string[];
  }
> = {
  כושר: {
    weakTerms: ["כוח"],
    requiredContextTerms: [
      "אימון",
      "אימונים",
      "כושר",
      "חדר כושר",
      "מכון",
      "משקולות",
      "סקוואט",
      "אירובי",
      "שריר",
      "חזרות",
      "מתאמן",
      "מכשירים",
    ],
  },
  סרטים: {
    weakTerms: ["סרטון", "סרטונים", "וידאו"],
    requiredContextTerms: [
      "סרט",
      "סרטים",
      "קולנוע",
      "נטפליקס",
      "שחקן",
      "שחקנים",
      "במאי",
      "טריילר",
      "הקרנה",
    ],
  },
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

function getPrefixPhraseMatches(query: string, phrases: string[]): string[] {
  if (!query) return [];

  const queryTokens = tokenizeForMatch(query, { stripPrefix: true });

  return phrases.filter((phrase) => {
    const normalizedPhrase = normalizeTextForMatch(phrase);
    if (!normalizedPhrase) return false;
    if (normalizedPhrase === query || normalizedPhrase.startsWith(query)) {
      return true;
    }

    if (queryTokens.length === 0) {
      return false;
    }

    const phraseTokens = tokenizeForMatch(normalizedPhrase, { stripPrefix: true });
    return (
      phraseTokens.length > 0 &&
      queryTokens.every((queryToken) =>
        phraseTokens.some((phraseToken) => phraseToken.startsWith(queryToken)),
      )
    );
  });
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
      [
        tag.name,
        ...(tag.keywords || []),
        ...(STATIC_TAG_KEYWORDS[tag.name] || []),
      ]
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

type TokenPrefixStats = {
  prefixMatches: number;
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
    const exactTagToken = tagTokens.find(
      (tagToken) => tagToken === sourceToken,
    );

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

function getTokenPrefixStats(
  sourceTokens: string[],
  tagTokens: string[],
): TokenPrefixStats {
  let prefixMatches = 0;
  const matchedTagTokens = new Set<string>();

  for (const sourceToken of sourceTokens) {
    const prefixedTagToken = tagTokens.find((tagToken) =>
      tagToken.startsWith(sourceToken),
    );

    if (prefixedTagToken) {
      prefixMatches += 1;
      matchedTagTokens.add(prefixedTagToken);
    }
  }

  return {
    prefixMatches,
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

export function shouldFetchSuggestedTags(
  title: string,
  content: string,
): boolean {
  const titleTokens = tokenizeForMatch(title, { stripPrefix: true });
  const contentTokens = tokenizeForMatch(content, { stripPrefix: true });
  const normalizedTitle = normalizeTextForMatch(title);

  if (contentTokens.length > 0) return true;
  if (titleTokens.length >= 2) return true;

  return normalizedTitle.length >= 16;
}

function getPopularityWeight(tag: TagScoreEntry, multiplier: number): number {
  return (
    (clamp(Math.log1p(tag.useCount || 0) * 6, 0, 28) +
      clamp(Math.log1p(tag.recentCount || 0) * 4, 0, 12)) *
    multiplier
  );
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

function getPromptTokens(
  title: string,
  content: string,
): {
  titleTokens: string[];
  contentTokens: string[];
} {
  return {
    titleTokens: tokenizeForMatch(title, { stripPrefix: true }),
    contentTokens: tokenizeForMatch(content, { stripPrefix: true }),
  };
}

function promptHasContextTerms(
  promptTokens: Set<string>,
  contextTerms: string[],
): boolean {
  return contextTerms.some((term) =>
    tokenizeForMatch(term, { stripPrefix: true }).some((token) =>
      promptTokens.has(token),
    ),
  );
}

function shouldSuppressAmbiguousTagMatch(params: {
  tag: TagScoreEntry;
  normalizedTitle: string;
  normalizedContent: string;
  normalizedTag: string;
  titleTokens: string[];
  contentTokens: string[];
  titleKeywordPhraseMatches: string[];
  contentKeywordPhraseMatches: string[];
  titleTokenStats: TokenMatchStats;
  contentTokenStats: TokenMatchStats;
  matchedPromptTokens: number;
}): boolean {
  const {
    tag,
    normalizedTitle,
    normalizedContent,
    normalizedTag,
    titleTokens,
    contentTokens,
    titleKeywordPhraseMatches,
    contentKeywordPhraseMatches,
    titleTokenStats,
    contentTokenStats,
    matchedPromptTokens,
  } = params;

  const rule = TAG_DISAMBIGUATION_RULES[normalizeTagName(tag.name)];
  if (!rule) return false;

  if (
    normalizedTitle === normalizedTag ||
    containsWholePhrase(normalizedTitle, normalizedTag) ||
    containsWholePhrase(normalizedContent, normalizedTag)
  ) {
    return false;
  }

  const promptTokens = new Set([...titleTokens, ...contentTokens]);
  if (promptHasContextTerms(promptTokens, rule.requiredContextTerms)) {
    return false;
  }

  const weakTerms = new Set(rule.weakTerms.map((term) => normalizeTextForMatch(term)));
  const weakPhraseHits =
    titleKeywordPhraseMatches.filter((phrase) => weakTerms.has(phrase)).length +
    contentKeywordPhraseMatches.filter((phrase) => weakTerms.has(phrase)).length;
  const weakTokenHits = [
    ...titleTokenStats.matchedTagTokens,
    ...contentTokenStats.matchedTagTokens,
  ].filter((token) => weakTerms.has(token)).length;
  const maxWeakOnlyPromptMatches =
    normalizeTagName(tag.name) === "סרטים" ? 2 : 1;

  return (
    weakPhraseHits > 0 &&
    weakTokenHits > 0 &&
    matchedPromptTokens <= maxWeakOnlyPromptMatches
  );
}

function buildTokenPhrases(tokens: string[], size: number): string[] {
  const phrases: string[] = [];

  if (size <= 1 || tokens.length < size) {
    return phrases;
  }

  for (let index = 0; index <= tokens.length - size; index += 1) {
    const phrase = tokens.slice(index, index + size).join(" ").trim();
    if (phrase) {
      phrases.push(phrase);
    }
  }

  return phrases;
}

function addSearchTerm(
  weightedTerms: Map<string, number>,
  rawTerm: string,
  weight: number,
): void {
  if (weight <= 0) return;

  const term = normalizeTextForMatch(rawTerm);
  if (!term || term.length < 2) return;

  const existingWeight = weightedTerms.get(term) || 0;
  if (weight > existingWeight) {
    weightedTerms.set(term, weight);
  }
}

export function buildSuggestionSearchTerms(
  title: string,
  content: string,
  limit = 10,
): string[] {
  const normalizedTitle = normalizeTextForMatch(title);
  const normalizedContent = normalizeTextForMatch(content);
  const { titleTokens, contentTokens } = getPromptTokens(title, content);
  const weightedTerms = new Map<string, number>();

  if (normalizedTitle.length >= 4) {
    addSearchTerm(weightedTerms, normalizedTitle, 140);
  }

  if (normalizedContent.length >= 8 && contentTokens.length <= 8) {
    addSearchTerm(weightedTerms, normalizedContent, 30);
  }

  for (const phrase of buildTokenPhrases(titleTokens, 3)) {
    addSearchTerm(weightedTerms, phrase, 125);
  }

  for (const phrase of buildTokenPhrases(titleTokens, 2)) {
    addSearchTerm(weightedTerms, phrase, 118);
  }

  for (const phrase of buildTokenPhrases(contentTokens, 3)) {
    addSearchTerm(weightedTerms, phrase, 72);
  }

  for (const phrase of buildTokenPhrases(contentTokens, 2)) {
    addSearchTerm(weightedTerms, phrase, 64);
  }

  titleTokens.forEach((token, index) =>
    addSearchTerm(weightedTerms, token, 95 - index * 3),
  );
  contentTokens.forEach((token, index) =>
    addSearchTerm(weightedTerms, token, 52 - index * 2),
  );

  return Array.from(weightedTerms.entries())
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, clamp(limit, 1, 16))
    .map(([term]) => term);
}

function hasStrongAutocompleteEvidence(params: {
  normalizedQuery: string;
  normalizedTag: string;
  queryTokens: string[];
  prefixPhraseMatches: string[];
  tokenPrefixStats: TokenPrefixStats;
  wholePhraseMatches: string[];
  lexicalScore: number;
}): boolean {
  const {
    normalizedQuery,
    normalizedTag,
    queryTokens,
    prefixPhraseMatches,
    tokenPrefixStats,
    wholePhraseMatches,
    lexicalScore,
  } = params;

  if (!normalizedQuery) return false;
  if (
    normalizedTag === normalizedQuery ||
    normalizedTag.startsWith(normalizedQuery)
  ) {
    return true;
  }

  const isShortSingleTokenQuery =
    queryTokens.length <= 1 && normalizedQuery.length <= 3;
  if (isShortSingleTokenQuery) {
    return (
      prefixPhraseMatches.length > 0 || tokenPrefixStats.prefixMatches > 0
    );
  }

  const isShortQuery = queryTokens.length <= 1 && normalizedQuery.length <= 4;
  if (isShortQuery) {
    return (
      prefixPhraseMatches.length > 0 ||
      tokenPrefixStats.prefixMatches > 0 ||
      wholePhraseMatches.length > 0
    );
  }

  return (
    prefixPhraseMatches.length > 0 ||
    tokenPrefixStats.prefixMatches >= queryTokens.length ||
    wholePhraseMatches.length > 0 ||
    lexicalScore >= 60
  );
}

function hasStrongLexicalEvidence(params: {
  exactPhraseHits: number;
  titleKeywordPhraseHits: number;
  titleMultiWordKeywordPhraseHits: number;
  titleTokenStats: TokenMatchStats;
  contentTokenStats: TokenMatchStats;
  matchedPromptTokens: number;
  lexicalScore: number;
}): boolean {
  const {
    exactPhraseHits,
    titleKeywordPhraseHits,
    titleMultiWordKeywordPhraseHits,
    titleTokenStats,
    contentTokenStats,
    matchedPromptTokens,
    lexicalScore,
  } = params;

  return (
    exactPhraseHits > 0 ||
    titleMultiWordKeywordPhraseHits > 0 ||
    (titleKeywordPhraseHits > 0 && titleTokenStats.exactMatches > 0) ||
    titleTokenStats.exactMatches >= 2 ||
    (titleTokenStats.exactMatches >= 1 &&
      (contentTokenStats.exactMatches > 0 ||
        contentTokenStats.partialMatches > 0)) ||
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
  const { title, content, tags, excludeTags = [], limit = 5 } = params;
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
  const titleKeywordPhraseMatches = getPhraseMatches(
    normalizedTitle,
    keywordPhrases,
  );
  const contentKeywordPhraseMatches = getPhraseMatches(
    normalizedContent,
    keywordPhrases,
  );
  const titleTokenStats = getTokenMatchStats(titleTokens, tagTokens);
  const contentTokenStats = getTokenMatchStats(contentTokens, tagTokens);
  const matchedPromptTokens = new Set([
    ...titleTokenStats.matchedTagTokens,
    ...contentTokenStats.matchedTagTokens,
  ]).size;
  const titleMultiWordKeywordPhraseHits = titleKeywordPhraseMatches.filter((phrase) =>
    phrase.includes(" "),
  ).length;
  const titlePromptTokenCount = getDistinctTokenCount(titleTokens);
  const contentPromptTokenCount = getDistinctTokenCount(contentTokens);
  const titleSignalScore =
    titleKeywordPhraseMatches.length * 18 +
    titleTokenStats.exactMatches * 14 +
    titleTokenStats.partialMatches * 6 +
    titleTokenStats.fuzzyMatches * 2;
  const contentSignalScore =
    contentKeywordPhraseMatches.length * 10 +
    contentTokenStats.exactMatches * 6 +
    contentTokenStats.partialMatches * 2 +
    contentTokenStats.fuzzyMatches;

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
    titleKeywordPhraseMatches.filter((phrase) => phrase !== normalizedTag)
      .length * 48;
  lexicalScore +=
    contentKeywordPhraseMatches.filter((phrase) => phrase !== normalizedTag)
      .length * 20;
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
      titleMultiWordKeywordPhraseHits,
      titleTokenStats,
      contentTokenStats,
      matchedPromptTokens,
      lexicalScore,
    })
  ) {
    return 0;
  }

  if (
    shouldSuppressAmbiguousTagMatch({
      tag,
      normalizedTitle,
      normalizedContent,
      normalizedTag,
      titleTokens,
      contentTokens,
      titleKeywordPhraseMatches,
      contentKeywordPhraseMatches,
      titleTokenStats,
      contentTokenStats,
      matchedPromptTokens,
    })
  ) {
    return 0;
  }

  const coverageBoost =
    Math.min(titlePromptTokenCount, titleTokenStats.matchedTagTokens.length) *
      8 +
    Math.min(
      contentPromptTokenCount,
      contentTokenStats.matchedTagTokens.length,
    ) *
      2;

  lexicalScore += coverageBoost;

  if (titlePromptTokenCount > 0) {
    if (titleSignalScore > 0) {
      // Title-aligned tags should win more often when the title is specific.
      lexicalScore += clamp(titleSignalScore * 0.35, 0, 28);
    } else if (contentSignalScore > 0) {
      // Keep body-only matches available, but slightly behind title-matching tags.
      lexicalScore *= 0.88;
    }
  }

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
  const prefixPhraseMatches = getPrefixPhraseMatches(
    normalizedQuery,
    keywordPhrases,
  );
  const tokenStats = getTokenMatchStats(queryTokens, tagTokens);
  const tokenPrefixStats = getTokenPrefixStats(queryTokens, tagTokens);

  let lexicalScore = 0;

  if (normalizedTag === normalizedQuery) lexicalScore += 200;
  if (normalizedTag.startsWith(normalizedQuery)) lexicalScore += 140;
  if (containsWholePhrase(normalizedTag, normalizedQuery)) lexicalScore += 70;
  lexicalScore +=
    prefixPhraseMatches.filter((phrase) => phrase !== normalizedTag).length * 60;
  lexicalScore += tokenPrefixStats.prefixMatches * 28;
  lexicalScore +=
    queryPhraseMatches.filter((phrase) => phrase !== normalizedTag).length * 45;
  lexicalScore += scoreTokenMatches(tokenStats, {
    exact: 26,
    partial: 16,
    fuzzy: 4,
  });

  if (lexicalScore <= 0) return 0;
  if (
    !hasStrongAutocompleteEvidence({
      normalizedQuery,
      normalizedTag,
      queryTokens,
      prefixPhraseMatches,
      tokenPrefixStats,
      wholePhraseMatches: queryPhraseMatches,
      lexicalScore,
    })
  ) {
    return 0;
  }

  return lexicalScore + clamp(Math.log1p(tag.useCount || 0) * 4, 0, 18);
}
