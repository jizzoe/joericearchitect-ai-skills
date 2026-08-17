import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { checkAdapterDrift } from "../../../scripts/sdd/check-adapter-drift.mjs";

test("lifecycle scenarios cover required gates and outcomes", () => {
  const scenarios = JSON.parse(
    fs.readFileSync(new URL("./scenarios.json", import.meta.url), "utf8")
  ).scenarios;
  const gates = new Set(scenarios.map((scenario) => scenario.gate));
  const kinds = new Set(scenarios.map((scenario) => scenario.kind));

  for (const gate of ["preflight", "propose", "apply", "verify", "delivery", "sync", "archive", "cleanup"]) {
    assert.equal(gates.has(gate), true, `missing ${gate} gate`);
  }

  for (const id of ["delivery-request-preflight-gap", "controller-phase-resume", "controller-context-conflict", "independent-review-rereview", "independent-review-unavailable", "degraded-review-launcher-recovery", "per-resource-terminal-cleanup", "legacy-cleanup-migration-required"]) {
    assert.equal(scenarios.some((scenario) => scenario.id === id), true, `missing ${id} scenario`);
  }

  for (const kind of ["complete", "incomplete", "ambiguous", "no-op", "stop"]) {
    assert.equal(kinds.has(kind), true, `missing ${kind} outcome`);
  }
});

test("external mutation fixtures cover boundary failures", () => {
  const fixtures = JSON.parse(
    fs.readFileSync(new URL("./fixtures/external-mutations.json", import.meta.url), "utf8")
  ).fixtures;
  const cases = new Set(fixtures.map((fixture) => fixture.case));

  for (const requiredCase of ["unauthorized", "partial", "duplicate", "untrusted", "credential"]) {
    assert.equal(cases.has(requiredCase), true, `missing ${requiredCase} fixture`);
  }
});

test("Claude and Codex adapters identify canonical sources", () => {
  const result = checkAdapterDrift(new URL("../../..", import.meta.url).pathname);
  assert.equal(result.valid, true, JSON.stringify(result.issues));
});

test("zero-touch review fixtures cover objective correction, changed-head rereview, and terminal denial", () => {
  const cases = JSON.parse(
    fs.readFileSync(new URL("./fixtures/zero-touch-independent-review.json", import.meta.url), "utf8")
  ).cases;
  const corrected = cases.find((item) => item.id === "objective-correction-and-rereview");
  assert.deepEqual(corrected.ownerActions, []);
  const reviews = corrected.steps.filter((step) => step.kind === "degraded-review");
  assert.equal(reviews.length, 2);
  assert.notEqual(reviews[0].head, reviews[1].head);
  assert.equal(corrected.steps.filter((step) => step.kind === "parent-transport").every((step) => step.sandboxPermissions === "require_escalated"), true);
  const correction = corrected.steps.find((step) => step.kind === "objective-correction");
  assert.ok(correction.attempt <= corrected.correctionBudgetPerFailureSignature);
  assert.equal(corrected.steps.at(-1).status, "passed");

  const denied = cases.find((item) => item.id === "parent-transport-denied");
  assert.deepEqual(denied.ownerActions, []);
  assert.deepEqual(denied.steps.at(-1), {
    kind: "terminal",
    code: "review-launcher-runtime-transport-denied",
    manualFallback: false
  });
});
