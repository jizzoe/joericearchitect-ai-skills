import assert from "node:assert/strict";
import test from "node:test";

import { createReviewDiagnostic, diagnosticFromError, preservedDiagnostic, unavailableOutcome, unclassifiedRuntimeDiagnostic, validReviewDiagnostic } from "../review-diagnostics.mjs";

test("diagnostic envelope is versioned, finite, and excludes arbitrary fields", () => {
  const diagnostic = createReviewDiagnostic({ stage: "reviewer-execution", operation: "codex-strict-review", code: "independent-reviewer-codex-authentication-unavailable", category: "authentication-unavailable", subject: "reviewer-authentication", exitCode: 1, safeMessage: "Refresh the reviewer authentication and retry." });
  assert.deepEqual(Object.keys(diagnostic).sort(), ["category", "code", "exitCode", "operation", "safeMessage", "schemaVersion", "stage", "subject"]);
  assert.equal(validReviewDiagnostic(diagnostic), true);
  assert.equal(createReviewDiagnostic({ ...diagnostic, stderr: "secret" }), null);
  assert.deepEqual(unavailableOutcome(diagnostic), { status: "unavailable", code: diagnostic.code, diagnostic });
});

test("local errors and wrappers retain only safe diagnostic data", () => {
  const diagnostic = diagnosticFromError({ stage: "view-construction", operation: "archive-review-view", code: "independent-review-view-create-failed", subject: "review-archive", safeMessage: "The review archive could not be created.", error: { code: "EACCES", message: "/private/secret" }, exitCode: 1 });
  assert.equal(diagnostic.category, "permission-denied");
  assert.equal(JSON.stringify(diagnostic).includes("/private/secret"), false);
  assert.equal(preservedDiagnostic(unavailableOutcome(diagnostic)), diagnostic);
  const unknown = unclassifiedRuntimeDiagnostic({ stage: "reviewer-execution", operation: "codex-strict-review", code: "independent-reviewer-codex-unclassified-runtime-failure", subject: "reviewer-process", exitCode: 1, safeMessage: "The reviewer failed without a classifiable safe signal." });
  assert.equal(unknown.category, "unclassified-runtime-failure");
});
