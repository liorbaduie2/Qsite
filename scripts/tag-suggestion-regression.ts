import assert from "node:assert/strict";

import { getTopSuggestionNames } from "../lib/tag-matching";
import {
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

console.log(
  `Tag suggestion regression passed (${TAG_SUGGESTION_REGRESSION_CASES.length} cases).`,
);
