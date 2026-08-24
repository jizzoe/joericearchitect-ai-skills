import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  createEphemeralStore,
  createSimulatedAdapters,
  driveFixtureRun,
  executeTransition,
  fixtureTemplate,
  roleManifests,
  seedBindings,
  selectNextTransition,
  thinReviewLoop,
} from "../autonomous-sdd-vertical-slice.mjs";

// Requirement-to-test map (spec capability: autonomous-sdd-vertical-slice)
// 1. Pure selector makes one deterministic transition choice ->
//    "selector returns exactly one transition per valid state",
//    "selector pauses when no legal transition remains at a stage",
//    "selector is deterministic under replay (property/symmetry)".
// 2. Simulated adapters are non-mutating and capability-scoped ->
//    "simulated adapters are non-mutating and capability-scoped".
// 3. Executor persists write-ahead attempts and commits one permitted state ->
//    "executor persists write-ahead states and commits",
//    "executor observes before retry when an attempt is unreconciled",
//    "executor records in-doubt when an adapter throws".
// 4. Thin sealed review loop invalidates on any review-relevant change ->
//    "review loop reuses unchanged bindings and refreshes on change",
//    "production review uses strict review and the reviewer never fixes".
// 5. Minimal ephemeral store is distinct from the durable backend ->
//    "ephemeral store never writes real controller state".
// 6. Both authority profiles produce the same lifecycle facts ->
//    "both profiles produce the same lifecycle facts with different approval".
// 7. Failure and recovery conditions produce exact typed pauses ->
//    "selector pauses on unknown stage, profile, deadline, and budget",
//    "production review requires strict review readiness without degradation",
//    "executor pauses on a stale owner",
//    "executor pauses on a malformed adapter outcome",
//    "fresh-review-on-change routes a fix when a finding invalidates the review".
// 8. Selector and review-invalidation are proven deterministically ->
//    injected clock (fixedClock) plus the property/symmetry test above.

const fixedClock = { now: () => "2026-01-01T00:00:00.000Z" };

test("selector returns exactly one transition per valid state", () => {
  const proposal = selectNextTransition({ stage: "admitted", profile: "prototype-rapid", evidence: {} });
  assert.equal(proposal.kind, "transition");
  assert.equal(proposal.step, "proposal");
  assert.equal(proposal.operation, null);

  const conformance = selectNextTransition({ stage: "admitted", profile: "prototype-rapid", evidence: { proposal: true, planning: true } });
  assert.equal(conformance.step, "planningConformance");
  assert.equal(conformance.operation, "plan-review");

  const apply = selectNextTransition({ stage: "planned", profile: "prototype-rapid", evidence: { applyEligibility: true } });
  assert.equal(apply.step, "apply");

  const verify = selectNextTransition({ stage: "reviewed", profile: "prototype-rapid", evidence: { current: true } });
  assert.equal(verify.step, "verify");
});

test("selector pauses on unknown stage, profile, deadline, and budget", () => {
  assert.equal(selectNextTransition({ stage: "unknown", profile: "prototype-rapid" }).reason, "stage-unknown");
  assert.equal(selectNextTransition({ stage: "admitted", profile: "invalid" }).reason, "profile-invalid");
  assert.equal(
    selectNextTransition({ stage: "admitted", profile: "prototype-rapid", deadline: "2026-01-01T00:00:00.000Z", clock: { now: () => "2026-01-02T00:00:00.000Z" } }).reason,
    "deadline-expired",
  );
  assert.equal(selectNextTransition({ stage: "admitted", profile: "prototype-rapid", budgets: { correctionExhausted: true } }).reason, "budget-exhausted");
});

test("selector pauses when no legal transition remains at a stage", () => {
  const result = selectNextTransition({
    stage: "admitted",
    profile: "prototype-rapid",
    evidence: { proposal: true, planningConformance: true, planning: true },
  });
  assert.equal(result.kind, "pause");
  assert.equal(result.reason, "no-legal-transition");
});

test("production review requires strict review readiness without degradation", () => {
  const paused = selectNextTransition({ stage: "applied", profile: "production-rapid", evidence: { apply: true } });
  assert.equal(paused.kind, "pause");
  assert.equal(paused.reason, "review-not-ready");

  const ready = selectNextTransition({ stage: "applied", profile: "production-rapid", evidence: { apply: true, reviewReady: true } });
  assert.equal(ready.kind, "transition");
  assert.equal(ready.step, "review");
});

test("selector is deterministic under replay (property/symmetry)", () => {
  const input = { stage: "planned", profile: "production-rapid", evidence: { applyEligibility: true, reviewReady: true } };
  assert.deepEqual(selectNextTransition(input), selectNextTransition(input));
  const proto = selectNextTransition({ stage: "applied", profile: "prototype-rapid", evidence: { apply: true } });
  const prod = selectNextTransition({ stage: "applied", profile: "production-rapid", evidence: { apply: true, reviewReady: true } });
  assert.equal(proto.step, "review");
  assert.equal(prod.step, "review");
  assert.notEqual(proto.gateDigest, prod.gateDigest);
});

test("simulated adapters are non-mutating and capability-scoped", () => {
  const adapters = createSimulatedAdapters();
  assert.deepEqual(Object.keys(adapters).sort(), ["apply", "planningConformance", "proposal", "verify"]);

  const out = adapters.proposal.invoke({ transition: { step: "proposal" }, attemptId: 1 });
  assert.equal(out.outcome, "succeeded");
  assert.ok(out.evidenceRef);
  assert.equal("transition" in out, false);
  assert.equal("authority" in out, false);
  assert.equal(adapters.proposal.invoke({}).outcome, "unknown");
});

test("vertical slice contains no product-specific constants", () => {
  const src = fs.readFileSync(new URL("../autonomous-sdd-vertical-slice.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(src, /jizzoe|joericearchitect|github\.com|second-product/);
});

test("executor persists write-ahead states and commits", () => {
  const store = createEphemeralStore({ clock: fixedClock });
  const transition = selectNextTransition({ stage: "admitted", profile: "prototype-rapid", evidence: {} });
  const result = executeTransition({ transition, store, adapters: createSimulatedAdapters(), ownerToken: "owner-1", clock: fixedClock });
  assert.equal(result.state, "committed");
  assert.equal(result.disposition, "continue");
  assert.ok(store.getState().attempts.some((a) => a.operation === "proposal" && a.state === "committed"));
});

test("executor pauses on a stale owner", () => {
  const store = createEphemeralStore({ clock: fixedClock });
  store.acquire("owner-A");
  const transition = selectNextTransition({ stage: "admitted", profile: "prototype-rapid", evidence: {} });
  const result = executeTransition({ transition, store, adapters: createSimulatedAdapters(), ownerToken: "owner-B", clock: fixedClock });
  assert.equal(result.state, "paused");
  assert.equal(result.reason, "stale-owner");
});

test("executor observes before retry when an attempt is unreconciled", () => {
  const store = createEphemeralStore({ clock: fixedClock });
  store.appendAttempt({ operation: "proposal", state: "in-doubt" });
  const transition = selectNextTransition({ stage: "admitted", profile: "prototype-rapid", evidence: {} });
  const result = executeTransition({ transition, store, adapters: createSimulatedAdapters(), ownerToken: "owner-1", clock: fixedClock });
  assert.equal(result.state, "in-doubt");
  assert.equal(result.reason, "attempt-unreconciled");
});

test("executor records in-doubt when an adapter throws", () => {
  const store = createEphemeralStore({ clock: fixedClock });
  const adapters = { proposal: { id: "proposal", capability: "propose", invoke: () => { throw new Error("boom"); } } };
  const transition = selectNextTransition({ stage: "admitted", profile: "prototype-rapid", evidence: {} });
  const result = executeTransition({ transition, store, adapters, ownerToken: "owner-1", clock: fixedClock });
  assert.equal(result.state, "in-doubt");
  assert.equal(result.reason, "adapter-failed");
});

test("executor pauses on a malformed adapter outcome", () => {
  const store = createEphemeralStore({ clock: fixedClock });
  const adapters = { proposal: { id: "proposal", capability: "propose", invoke: () => ({ outcome: "unknown" }) } };
  const transition = selectNextTransition({ stage: "admitted", profile: "prototype-rapid", evidence: {} });
  const result = executeTransition({ transition, store, adapters, ownerToken: "owner-1", clock: fixedClock });
  assert.equal(result.state, "paused");
  assert.equal(result.reason, "outcome-unknown");
});

test("review loop reuses unchanged bindings and refreshes on change", () => {
  const bindings = seedBindings();
  const store = createEphemeralStore({ clock: fixedClock });
  const reused = thinReviewLoop({ store, profile: "prototype-rapid", previousBindings: bindings, currentBindings: bindings, clock: fixedClock });
  assert.equal(reused.state, "reused");
  assert.equal(reused.reviewOperation, "local-review");

  const changed = thinReviewLoop({ store, profile: "prototype-rapid", previousBindings: bindings, currentBindings: { ...bindings, reviewedHead: "head-changed" }, clock: fixedClock });
  assert.equal(changed.state, "fresh");
});

test("production review uses strict review and the reviewer never fixes", () => {
  const bindings = { ...seedBindings(), findings: [{ id: "f1", severity: "objective-fix" }] };
  const store = createEphemeralStore({ clock: fixedClock });
  const review = thinReviewLoop({ store, profile: "production-rapid", previousBindings: bindings, currentBindings: { ...bindings, reviewedHead: "head-changed" }, clock: fixedClock });
  assert.equal(review.reviewOperation, "strict-review");
  assert.equal(review.state, "fresh");
  assert.equal(review.requiresFix, true);
  assert.equal(store.getState().attempts.every((a) => a.operation !== "apply"), true);
});

test("ephemeral store never writes real controller state", () => {
  const store = createEphemeralStore({ clock: fixedClock });
  store.appendAttempt({ operation: "proposal", state: "committed" });
  const snapshot = JSON.stringify(store.snapshot());
  assert.doesNotMatch(snapshot, /runs\/|controller\.json|claim|archive/);
});

test("both profiles produce the same lifecycle facts with different approval", () => {
  const proto = driveFixtureRun({ profile: "prototype-rapid", clock: fixedClock });
  const prod = driveFixtureRun({ profile: "production-rapid", clock: fixedClock });
  assert.deepEqual(proto.map((f) => f.step), prod.map((f) => f.step));
  assert.equal(proto.at(-1).step, "verify");
  assert.equal(prod.at(-1).step, "verify");
  assert.equal(proto.find((f) => f.step === "review").reviewOperation, "local-review");
  assert.equal(prod.find((f) => f.step === "review").reviewOperation, "strict-review");
});

test("fresh-review-on-change routes a fix when a finding invalidates the review", () => {
  const bindings = { ...seedBindings(), findings: [{ id: "f1", severity: "objective-fix" }] };
  const facts = driveFixtureRun({ profile: "prototype-rapid", bindings, mutateAfterReview: true, clock: fixedClock });
  const fresh = facts.find((f) => f.step === "fresh-review-on-change");
  assert.equal(fresh.outcome, "fix-routed");
  assert.equal(facts.some((f) => f.step === "verify"), false);
});

test("fixture template and role manifests are data-only and complete", () => {
  assert.equal(fixtureTemplate.name, "add-typescript-javascript-review");
  assert.ok(fixtureTemplate.verificationCommands.length > 0);
  assert.deepEqual(Object.keys(roleManifests).sort(), ["controller", "implementer", "independent-reviewer", "planner", "verification-worker"]);
});
