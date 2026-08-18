import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { checkAdapterDrift } from "../../../scripts/sdd/check-adapter-drift.mjs";

const root = new URL("../../..", import.meta.url).pathname;

function read(relativePath) {
  return fs.readFileSync(new URL(`../../../${relativePath}`, import.meta.url), "utf8");
}

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
  const result = checkAdapterDrift(root);
  assert.equal(result.valid, true, JSON.stringify(result.issues));
});

test("canonical lifecycle is distributable and compatibility paths stay thin", () => {
  const canonicalPath = "skills/base/autonomous-sdd-lifecycle/SKILL.md";
  const canonical = read(canonicalPath);
  assert.match(canonical, /^name: autonomous-sdd-lifecycle$/m);
  assert.match(canonical, /do not use for standalone phase actions or unbounded work/);
  assert.match(canonical, /skill-result-v1/);
  assert.match(canonical, /\.\.\/autonomous-goal-runner\/references\/sdd-delivery-request\.md/);
  assert.match(canonical, /See \[Shared guardrails\]\(\.\.\/_shared\/guardrails\.md\)\./);

  const compatibility = read("workflows/autonomous-sdd-lifecycle/workflow.md");
  assert.match(compatibility, new RegExp(canonicalPath.replaceAll("/", "\\/")));
  assert.match(compatibility, /must not duplicate or change lifecycle/);
  assert.ok(compatibility.length < 700, "compatibility workflow must remain thin");

  for (const reference of ["openspec-actions", "delivery", "recovery", "external-mutations"]) {
    const text = read(`workflows/autonomous-sdd-lifecycle/references/${reference}.md`);
    assert.match(text, new RegExp(`skills\\/base\\/autonomous-sdd-lifecycle\\/references\\/${reference}\\.md`));
    assert.ok(text.length < 300, `${reference} compatibility reference must remain thin`);
  }

  for (const adapter of [
    ".agents/skills/autonomous-sdd-lifecycle/SKILL.md",
    ".claude/skills/autonomous-sdd-lifecycle/SKILL.md"
  ]) {
    const text = read(adapter);
    assert.match(text, new RegExp(canonicalPath.replaceAll("/", "\\/")));
    assert.ok(text.length < 900, `${adapter} must remain thin`);
  }
});

test("delivery uses an installed-layout-safe sibling lifecycle reference", () => {
  const delivery = read("skills/base/autonomous-sdd-delivery/SKILL.md");
  assert.match(delivery, /\.\.\/autonomous-sdd-lifecycle\/SKILL\.md/);
  assert.doesNotMatch(delivery, /\.\.\/\.\.\/\.\.\/workflows\/autonomous-sdd-lifecycle/);
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

test("frictionless prototype fixtures continue objective work and preserve every material stop", () => {
  const cases = JSON.parse(
    fs.readFileSync(new URL("./fixtures/frictionless-prototype-loop.json", import.meta.url), "utf8")
  ).cases;
  const converged = cases.find((item) => item.id === "objective-correction-converges");
  assert.deepEqual(converged.ownerActions, []);
  assert.equal(converged.reviewPolicy, "same-session-local");
  assert.equal(converged.steps.find((step) => step.kind === "local-review").assurance, "local-review");
  assert.equal(converged.steps.at(-1).status, "passed");
  for (const id of ["material-decision-stops", "runtime-permission-denial-stops", "unsafe-action-stops", "expired-authorization-stops", "stale-final-evidence-stops"]) {
    const stopped = cases.find((item) => item.id === id);
    assert.equal(stopped.preservesRecovery, true, id);
    assert.ok(stopped.stop, id);
  }

  const lifecycle = read("skills/base/autonomous-sdd-lifecycle/SKILL.md");
  assert.match(lifecycle, /without a\s+routine Plan-to-Apply or Verified-to-Close prompt/s);
  assert.match(lifecycle, /does not override the host/);
  assert.match(lifecycle, /Never pass local-review evidence to the\s+production independent-review gate/s);
});
