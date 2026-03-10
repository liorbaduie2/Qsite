import assert from "node:assert/strict";

import { getTopSuggestionNames, scoreAutocompleteTag } from "../lib/tag-matching";
import { rankHybridTagSuggestions } from "../lib/tag-suggestions/hybrid-ranker";
import {
  HYBRID_TAG_SUGGESTION_REGRESSION_CASES,
  TAG_AUTOCOMPLETE_REGRESSION_CASES,
  TAG_SUGGESTION_REGRESSION_CATALOG,
  TAG_SUGGESTION_REGRESSION_CASES,
} from "../lib/tag-suggestion-regression";

for (const testCase of TAG_SUGGESTION_REGRESSION_CASES) {
  const topSuggestions = getTopSuggestionNames({
    title: testCase.title,
    content: testCase.content,
    tags: TAG_SUGGESTION_REGRESSION_CATALOG,
    limit: 3,
  });

  assert(
    testCase.expectedAny.some((tag) => topSuggestions.includes(tag)),
    `${testCase.id}: expected one of ${testCase.expectedAny.join(", ")}, got ${topSuggestions.join(", ")}`,
  );

  if (testCase.forbiddenTop?.length) {
    assert(
      testCase.forbiddenTop.every((tag) => !topSuggestions.includes(tag)),
      `${testCase.id}: forbidden tag appeared in top suggestions: ${topSuggestions.join(", ")}`,
    );
  }
}

for (const testCase of HYBRID_TAG_SUGGESTION_REGRESSION_CASES) {
  const topSuggestions = rankHybridTagSuggestions({
    title: testCase.title,
    content: testCase.content,
    candidates: testCase.candidates,
    limit: 3,
  });

  assert(
    testCase.expectedAny.some((tag) => topSuggestions.includes(tag)),
    `${testCase.id}: expected one of ${testCase.expectedAny.join(", ")}, got ${topSuggestions.join(", ")}`,
  );

  if (testCase.forbiddenTop?.length) {
    assert(
      testCase.forbiddenTop.every((tag) => !topSuggestions.includes(tag)),
      `${testCase.id}: forbidden tag appeared in top suggestions: ${topSuggestions.join(", ")}`,
    );
  }
}

for (const testCase of TAG_AUTOCOMPLETE_REGRESSION_CASES) {
  const matches = testCase.catalog
    .map((tag) => ({
      name: tag.name,
      score: scoreAutocompleteTag({
        query: testCase.query,
        tag,
      }),
    }))
    .filter((tag) => tag.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "he"))
    .map((tag) => tag.name);

  assert(
    testCase.expectedAny.some((tag) => matches.includes(tag)),
    `${testCase.id}: expected one of ${testCase.expectedAny.join(", ")}, got ${matches.join(", ")}`,
  );

  if (testCase.forbiddenAny?.length) {
    assert(
      testCase.forbiddenAny.every((tag) => !matches.includes(tag)),
      `${testCase.id}: forbidden autocomplete tag appeared: ${matches.join(", ")}`,
    );
  }
}

console.log(
  `Tag suggestion regression passed (${TAG_SUGGESTION_REGRESSION_CASES.length + HYBRID_TAG_SUGGESTION_REGRESSION_CASES.length + TAG_AUTOCOMPLETE_REGRESSION_CASES.length} cases).`,
);
