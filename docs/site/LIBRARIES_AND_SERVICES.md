# Libraries and Services

[Back to index](./README.md)

## Shared libraries

### `lib/ai/embeddings.ts`
- Runtime: shared/server
- Description: Embedding helpers used by the semantic tag-suggestion pipeline.
- Exports: `TAG_EMBEDDING_DIMENSION`, `TAG_EMBEDDING_MODEL`, `buildContentHash`, `generateEmbedding`, `generateEmbeddings`, `hasEmbeddingProviderConfigured`, `serializeEmbeddingVector`
- Named functions: `normalizeEmbeddingInput`, `payload`, `vectors`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `lib/dev-phone-codes.ts`
- Runtime: shared/server
- Description: Supporting code file for dev phone codes.
- Exports: `devPhoneCodes`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `lib/notifications.ts`
- Runtime: shared/server
- Description: Service-role helper for cross-user notification inserts.
- Exports: `CreateNotificationParams`, `NotificationType`, `createNotification`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `notifications`
- Supabase RPCs: None

### `lib/permissionKeys.ts`
- Runtime: shared/server
- Description: Canonical permission key vocabulary.
- Exports: `ADMIN_ROLE_LABELS`, `ALL_PERMISSION_KEYS`, `AdminRoleKey`, `PERMISSION_DEFINITIONS`, `PermissionCategory`, `PermissionDefinition`, `PermissionKey`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `lib/permissions.ts`
- Runtime: shared/server
- Description: Permission lookup helpers and auth-integration glue.
- Exports: `canUserLogin`, `deductReputation`, `getUserPermissions`, `getUserRoleHebrew`, `suspendUser`
- Named functions: None
- Fetch calls: `/api/permissions/get-user-permissions`, `/api/permissions/can-user-login`, `/api/permissions/suspend-user`, `/api/permissions/deduct-reputation`, `/api/permissions/get-user-role-hebrew`
- Supabase tables/views: None
- Supabase RPCs: None

### `lib/supabase/admin.ts`
- Runtime: shared/server
- Description: Service-role Supabase client factory for privileged operations.
- Exports: `getAdminClient`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `lib/supabase/client.ts`
- Runtime: shared/server
- Description: Browser Supabase client factory.
- Exports: `createClient`, `getSupabaseKey`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `lib/supabase/middleware.ts`
- Runtime: shared/server
- Description: Middleware helper for auth refresh and request gating.
- Exports: `updateSession`
- Named functions: `isGuestAllowedPath`
- Fetch calls: None
- Supabase tables/views: `profiles`
- Supabase RPCs: None

### `lib/supabase/server.ts`
- Runtime: shared/server
- Description: Server Supabase client factory bound to request cookies.
- Exports: `createClient`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `lib/tag-matching.ts`
- Runtime: shared/server
- Description: Hebrew-aware tag normalization, fuzzy matching, and scoring engine.
- Exports: `TagScoreEntry`, `buildSuggestionSearchTerms`, `getTopSuggestionNames`, `normalizeTagName`, `normalizeTextForMatch`, `scoreAutocompleteTag`, `scoreSuggestedTag`, `shouldFetchSuggestedTags`, `tokenizeForMatch`
- Named functions: `addSearchTerm`, `buildTokenPhrases`, `clamp`, `containsWholePhrase`, `escapeRegex`, `getConfidenceMultiplier`, `getDistinctTokenCount`, `getKeywordPhrases`, `getMinimumTokenLength`, `getPhraseMatches`, `getPopularityWeight`, `getPrefixPhraseMatches`, `getPromptTokens`, `getTagKeywordTexts`, `getTagTokens`, `getTokenMatchStats`, `getTokenPrefixStats`, `hasHebrewCharacters`, `hasStrongAutocompleteEvidence`, `hasStrongLexicalEvidence`, `isFuzzyMatch`, `isPartialTokenMatch`, `levenshteinDistance`, `normalizeToken`, `promptHasContextTerms`, `scoreTokenMatches`, `shouldSuppressAmbiguousTagMatch`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `lib/tag-suggestion-regression.ts`
- Runtime: shared/server
- Description: Supporting code file for tag suggestion regression.
- Exports: `HYBRID_TAG_SUGGESTION_REGRESSION_CASES`, `HybridTagSuggestionRegressionCase`, `TAG_AUTOCOMPLETE_REGRESSION_CASES`, `TAG_SUGGESTION_REGRESSION_CASES`, `TAG_SUGGESTION_REGRESSION_CATALOG`, `TagAutocompleteRegressionCase`, `TagSuggestionRegressionCase`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `lib/tag-suggestions/embedding-sync.ts`
- Runtime: shared/server
- Description: Sync helpers that persist question and tag embeddings into Supabase tables.
- Exports: `TagEmbeddingSyncResult`, `syncTagEmbeddings`, `upsertQuestionEmbedding`
- Named functions: `getAdminSupabaseClient`
- Fetch calls: None
- Supabase tables/views: `tags`, `tag_embeddings`, `question_embeddings`
- Supabase RPCs: None

### `lib/tag-suggestions/hybrid-ranker.ts`
- Runtime: shared/server
- Description: Ranking helpers that merge lexical and semantic tag candidates.
- Exports: `RankedHybridTagCandidate`, `mergeHybridTagCandidates`, `rankHybridTagCandidates`, `rankHybridTagSuggestions`
- Named functions: `clamp`, `getAutocompleteBoost`, `getFallbackPopularityBoost`, `getFeedbackBoost`, `getSemanticBoost`, `getSemanticOnlyConfidence`, `getSimilarQuestionBoost`, `hasHybridEvidence`, `maxNullable`, `mergeStringArray`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `lib/tag-suggestions/source-text.ts`
- Runtime: shared/server
- Description: Source-text builders for embedding generation.
- Exports: `buildQuestionEmbeddingText`, `buildTagEmbeddingText`
- Named functions: `compactText`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `lib/tag-suggestions/supabase-search.ts`
- Runtime: shared/server
- Description: Supabase-backed search helpers for semantic and autocomplete tag retrieval.
- Exports: `isMissingTagSearchRpcError`, `matchSemanticTagCandidates`, `matchSimilarQuestionTagCandidates`, `searchAutocompleteCandidates`
- Named functions: `mapRpcCandidate`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `lib/tag-suggestions/types.ts`
- Runtime: shared/server
- Description: Tag-suggestion support module for types.
- Exports: `HybridTagCandidate`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `lib/twilio.ts`
- Runtime: shared/server
- Description: Twilio wrapper for SMS verification flows.
- Exports: `sendSMS`
- Named functions: `getClient`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `lib/utils.ts`
- Runtime: shared/server
- Description: Supporting code file for utils.
- Exports: `ONLINE_THRESHOLD_SECONDS`, `cn`, `formatRelativeTime`, `hasEnvVars`, `isOnline`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None


## App support modules

### `app/lib/theme-service.ts`
- Runtime: shared/server
- Description: Theme preference loader and persistence helper.
- Exports: `ThemeService`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_preferences`
- Supabase RPCs: None

### `app/utils/timeGreeting.ts`
- Runtime: shared/server
- Description: Utility that maps the current time to a greeting string.
- Exports: `getTimeBasedGreeting`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None


## Scripts

### `scripts/create-user.js`
- Runtime: shared/server
- Description: Supporting code file for create user.
- Exports: None
- Named functions: `createUser`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `scripts/generate-site-docs.mjs`
- Runtime: shared/server
- Description: Documentation generator that scans the codebase and writes the site handbook.
- Exports: None
- Named functions: `analyzeCodeFile`, `analyzeSqlFile`, `buildSqlInventory`, `classifyApiDomain`, `classifyPageSurface`, `collectFiles`, `describe`, `describeApi`, `extractMatches`, `filtered`, `formatInlineList`, `groupBy`, `humanize`, `main`, `relPathToApi`, `relPathToRoute`, `renderApi`, `renderApiBlock`, `renderArchitecture`, `renderCodeBlock`, `renderCodeInventories`, `renderDataModel`, `renderIndex`, `renderPages`, `renderRouteBlock`, `renderWorkflows`, `toPosix`, `unique`, `walk`, `withApi`, `withRoute`, `writeDoc`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `scripts/sync-tag-embeddings.ts`
- Runtime: shared/server
- Description: Supporting code file for sync tag embeddings.
- Exports: None
- Named functions: `loadEnvFile`, `main`, `readNumericFlag`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `scripts/tag-suggestion-regression.ts`
- Runtime: shared/server
- Description: Supporting code file for tag suggestion regression.
- Exports: None
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

