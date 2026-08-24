import crypto from "node:crypto";

import {
  digestOperationContract,
  evaluateOperationGate,
  routeOperationOutcome,
  validateReviewReuse,
} from "./autonomous-sdd-operation-contract.mjs";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const freeze = (value) => Object.freeze(value);

const defaultClock = freeze({ now: () => new Date().toISOString() });
const farFuture = "2999-01-01T00:00:00.000Z";
const supportedProfiles = freeze(["prototype-rapid", "production-rapid"]);

// Step -> registry operation used for gate evaluation. `null` marks a
// slice-declared step (proposal and review) that has no direct registry entry.
const stepOperation = freeze({
  proposal: null,
  planningConformance: "plan-review",
  apply: "apply",
  review: null,
  verify: "verify",
});

// Stage advanced to once a step commits.
const nextStage = freeze({
  proposal: "admitted",
  planningConformance: "planned",
  apply: "applied",
  review: "reviewed",
  verify: "verified",
});

export const sliceStages = freeze(["admitted", "planned", "applied", "reviewed", "verified"]);

// Data-defined slice pipeline. `proposal` and `planningConformance` share the
// `admitted` stage and are disambiguated by the current evidence.
export const slicePipeline = freeze([
  freeze({ step: "proposal", stage: "admitted", profiles: supportedProfiles }),
  freeze({ step: "planningConformance", stage: "admitted", profiles: supportedProfiles }),
  freeze({ step: "apply", stage: "planned", profiles: supportedProfiles }),
  freeze({ step: "review", stage: "applied", profiles: supportedProfiles }),
  freeze({ step: "verify", stage: "reviewed", profiles: supportedProfiles }),
]);

// Disposable fixture template: a planned non-SDD skill that supplies the
// proposal/design/tasks shape and verification commands the simulated adapters
// mirror. It carries no product-specific repository or credential values.
export const fixtureTemplate = freeze({
  name: "add-typescript-javascript-review",
  kind: "non-sdd-skill",
  proposal: freeze({
    why: "Add a TypeScript/JavaScript review skill to the shared quality library.",
    whatChanges: freeze(["base review skill", "verification commands", "fixtures"]),
  }),
  design: freeze({ decisions: freeze(["reuse base-code-review contract", "assistant-neutral"]) }),
  tasks: freeze([
    freeze({ id: "1.1", description: "scaffold the review skill" }),
    freeze({ id: "1.2", description: "add verification commands" }),
  ]),
  verificationCommands: freeze(["node --test", "npm run lint"]),
});

// Narrow role/context manifests, mapped to existing skills/base/* skills.
export const roleManifests = freeze({
  planner: freeze({ role: "planner", skill: "sdd-requirements-to-plan" }),
  implementer: freeze({ role: "implementer", skill: "base-skill-authoring" }),
  "verification-worker": freeze({ role: "verification-worker", skill: "base-verification-loop" }),
  "independent-reviewer": freeze({ role: "independent-reviewer", skill: "independent-review" }),
  controller: freeze({ role: "controller", skill: "autonomous-sdd-lifecycle" }),
});

const pause = (reason, disposition) => freeze({ kind: "pause", reason, disposition });

const stepDispositions = freeze({
  succeeded: "continue",
  complete: "complete",
  "objective-failure": "objective-correction",
  "human-decision": "human-decision",
  "terminal-failure": "terminal-failure",
});

function routeStepOutcome(step, outcome, failureSignature) {
  if (stepOperation[step]) {
    return routeOperationOutcome({ operation: stepOperation[step], outcome, failureSignature });
  }
  const disposition = stepDispositions[outcome];
  if (!disposition) return { classification: "paused", disposition: "human-decision", reason: "outcome-unknown" };
  if (disposition === "objective-correction" && !text(failureSignature)) {
    return { classification: "paused", disposition: "human-decision", reason: "correction-not-eligible" };
  }
  const classification = disposition === "continue" || disposition === "complete" ? "completed"
    : disposition === "objective-correction" ? "correct" : "paused";
  return { classification, disposition };
}

// Pure next-transition selector. Consumes authoritative state, the operation
// registry, evidence, live checks, deadline, and budgets; performs no I/O; and
// returns exactly one transition or a typed pause.
export function selectNextTransition({
  stage,
  profile,
  evidence = {},
  liveChecks = {},
  deadline,
  budgets = {},
  clock = defaultClock,
} = {}) {
  if (!sliceStages.includes(stage)) return pause("stage-unknown", "human-decision");
  if (!supportedProfiles.includes(profile)) return pause("profile-invalid", "human-decision");
  if (text(deadline) && clock.now() > deadline) return pause("deadline-expired", "human-decision");
  if (budgets.correctionExhausted === true) return pause("budget-exhausted", "human-decision");

  const candidates = slicePipeline.filter((entry) => entry.stage === stage && entry.profiles.includes(profile));
  if (!candidates.length) return pause("no-legal-transition", "human-decision");
  const step = candidates.find((entry) => evidence[entry.step] !== true);
  if (!step) return pause("no-legal-transition", "human-decision");

  const operation = stepOperation[step.step];
  let gate;
  if (operation) {
    gate = evaluateOperationGate({
      operation,
      stage,
      targetKind: "change",
      authorization: { qualityProfile: profile, expiresAt: deadline ?? farFuture },
      claimActive: liveChecks.claimActive !== false,
      evidenceCurrent: evidence,
      adapterAvailable: liveChecks.adapterAvailable !== false,
      runtimePermitted: liveChecks.runtimePermitted !== false,
    });
    if (!gate.allowed) return pause(gate.reason, gate.disposition);
  } else {
    if (step.step === "review" && profile === "production-rapid" && evidence.reviewReady !== true) {
      return pause("review-not-ready", "human-decision");
    }
    gate = { gateDigest: digestOperationContract({ step: step.step, profile, reviewReady: evidence.reviewReady === true }) };
  }

  return freeze({ kind: "transition", step: step.step, stage, profile, operation, gateDigest: gate.gateDigest });
}

// Minimal ephemeral store: in-memory attempts and transitions for one
// disposable fixture run. It never writes real controller state and is
// deliberately distinct from the future durable backend.
export function createEphemeralStore({ clock = defaultClock, runId = "fixture-run" } = {}) {
  const state = { runId, stage: "admitted", ownerToken: null, nextId: 1, attempts: new Map(), transitions: [] };
  return {
    getState: () => ({
      runId: state.runId,
      stage: state.stage,
      ownerToken: state.ownerToken,
      attempts: [...state.attempts.values()].map((attempt) => ({ ...attempt })),
      transitions: state.transitions.map((transition) => ({ ...transition })),
    }),
    acquire: (token) => {
      if (state.ownerToken !== null && state.ownerToken !== token) return { acquired: false, reason: "stale-owner" };
      state.ownerToken = token;
      return { acquired: true };
    },
    appendAttempt: (record) => {
      const id = state.nextId++;
      const attempt = { id, state: "prepared", outcome: null, evidenceRef: null, ...record, at: clock.now() };
      state.attempts.set(id, attempt);
      return { ...attempt };
    },
    setAttempt: (id, patch) => {
      const attempt = state.attempts.get(id);
      if (!attempt) return null;
      const updated = { ...attempt, ...patch, at: clock.now() };
      state.attempts.set(id, updated);
      return { ...updated };
    },
    setStage: (stage) => { state.stage = stage; },
    appendTransition: (transition) => { state.transitions.push({ ...transition, at: clock.now() }); },
    snapshot: () => JSON.parse(JSON.stringify({ ...state, attempts: [...state.attempts.values()] })),
  };
}

// Fixed simulated adapters (non-mutating, capability-scoped). Each returns
// validated data only and can never select the next transition or expand
// authority.
export function createSimulatedAdapters({ fixture = fixtureTemplate } = {}) {
  const make = (id, capability, produce) => freeze({
    id,
    capability,
    invoke: (input) => {
      if (!input || !text(input.transition?.step) || !Number.isInteger(input.attemptId)) {
        return freeze({ outcome: "unknown", reason: "adapter-input-invalid" });
      }
      return freeze({ outcome: "succeeded", ...produce(input) });
    },
  });

  return freeze({
    proposal: make("proposal", "propose", () => ({
      evidenceRef: digestOperationContract({ proposal: fixture.proposal, design: fixture.design, tasks: fixture.tasks }),
    })),
    planningConformance: make("planningConformance", "planning-conformance", () => ({
      evidenceRef: digestOperationContract({ conforms: true, template: fixture.name }),
    })),
    apply: make("apply", "apply", () => ({
      evidenceRef: digestOperationContract({ applied: true, artifactManifest: fixture.tasks }),
    })),
    verify: make("verify", "verify", () => ({
      evidenceRef: digestOperationContract({ verified: true, commands: fixture.verificationCommands }),
    })),
  });
}

// Bounded executor with write-ahead states and observe-before-retry.
export function executeTransition({ transition, store, adapters, ownerToken, clock = defaultClock } = {}) {
  const acquired = store.acquire(ownerToken);
  if (!acquired.acquired) return { state: "paused", reason: "stale-owner", disposition: "human-decision" };

  const unreconciled = store.getState().attempts.some(
    (attempt) => attempt.operation === transition.step && ["in-flight", "in-doubt"].includes(attempt.state),
  );
  if (unreconciled) return { state: "in-doubt", reason: "attempt-unreconciled", disposition: "human-decision" };

  const adapter = adapters[transition.step];
  if (!adapter) return { state: "paused", reason: "adapter-unavailable", disposition: "terminal-failure" };

  const attempt = store.appendAttempt({ operation: transition.step, state: "prepared" });
  store.setAttempt(attempt.id, { state: "in-flight" });

  let output;
  try {
    output = adapter.invoke({ transition, attemptId: attempt.id });
  } catch {
    store.setAttempt(attempt.id, { state: "in-doubt" });
    return { state: "in-doubt", reason: "adapter-failed", disposition: "human-decision", attemptId: attempt.id };
  }

  store.setAttempt(attempt.id, { state: "observed", outcome: output.outcome, evidenceRef: output.evidenceRef ?? null });

  const route = routeStepOutcome(transition.step, output.outcome, output.failureSignature);
  if (route.classification === "paused") {
    return { state: "paused", reason: route.reason ?? "outcome-unknown", disposition: route.disposition, attemptId: attempt.id, output };
  }

  store.setAttempt(attempt.id, { state: "committed" });
  return { state: "committed", disposition: route.disposition, attemptId: attempt.id, output, evidenceRef: output.evidenceRef ?? null };
}

// Thin sealed review loop reusing the existing review-reuse contract. The
// reviewer never fixes; findings are returned and routed to a fresh implementer
// correction.
export function thinReviewLoop({ store, profile, previousBindings = {}, currentBindings = {}, clock = defaultClock, strictDelivery, reviewDispatch } = {}) {
  const reviewOperation = profile === "production-rapid" ? "strict-review" : "local-review";
  const attempt = store.appendAttempt({ operation: "review", state: "prepared" });

  const reuse = validateReviewReuse({
    sealedPackageDigest: previousBindings.sealedPackageDigest,
    currentSealedPackageDigest: currentBindings.sealedPackageDigest,
    reviewedHead: previousBindings.reviewedHead,
    currentHead: currentBindings.reviewedHead,
    artifactManifestDigest: previousBindings.artifactManifestDigest,
    currentArtifactManifestDigest: currentBindings.artifactManifestDigest,
    applyEvidenceDigest: previousBindings.applyEvidenceDigest,
    currentApplyEvidenceDigest: currentBindings.applyEvidenceDigest,
    dispositionsDigest: previousBindings.dispositionsDigest,
    currentDispositionsDigest: currentBindings.dispositionsDigest,
    policyGateDigest: previousBindings.policyGateDigest,
    currentPolicyGateDigest: currentBindings.policyGateDigest,
  });

  if (reuse.valid && reuse.reusable) {
    store.setAttempt(attempt.id, { state: "committed", outcome: "review-reused" });
    return freeze({ state: "reused", reviewOperation, attemptId: attempt.id });
  }

  // M3-S2: the production review step routes through review admission plus the
  // single-owner dispatcher when one is supplied; it owns launch through
  // terminal evidence and never accepts a transcript or claimed success.
  if (profile === "production-rapid" && typeof reviewDispatch === "function") {
    const dispatch = reviewDispatch({ launchId: `review-${attempt.id}`, attemptId: attempt.id, currentBindings });
    if (!dispatch || dispatch.allowed !== true) {
      store.setAttempt(attempt.id, {
        state: "committed",
        outcome: "review-unavailable",
        evidenceRef: digestOperationContract({ reviewOperation, code: dispatch?.code ?? "strict-review-unavailable" }),
      });
      return freeze({ state: "paused", reviewOperation, attemptId: attempt.id, reason: dispatch?.code ?? "strict-review-unavailable", disposition: "human-decision" });
    }
    const findings = dispatch.result?.findings ?? [];
    store.setAttempt(attempt.id, {
      state: "committed",
      outcome: "review-fresh",
      evidenceRef: digestOperationContract({ reviewOperation, findings, terminalArtifactKey: dispatch.key }),
    });
    return freeze({ state: "fresh", reviewOperation, attemptId: attempt.id, findings, requiresFix: findings.length > 0, terminalArtifactKey: dispatch.key });
  }

  // M3-S1: the production review step routes through the strict host-captured
  // transport and requires a parent-owned schema-valid terminal artifact. A
  // transcript or claimed success is never acceptance evidence.
  if (profile === "production-rapid" && typeof strictDelivery === "function") {
    const delivery = strictDelivery({ launchId: `review-${attempt.id}`, attemptId: attempt.id, currentBindings });
    if (!delivery || delivery.allowed !== true) {
      store.setAttempt(attempt.id, {
        state: "committed",
        outcome: "review-unavailable",
        evidenceRef: digestOperationContract({ reviewOperation, code: delivery?.code ?? "strict-review-unavailable" }),
      });
      return freeze({ state: "paused", reviewOperation, attemptId: attempt.id, reason: delivery?.code ?? "strict-review-unavailable", disposition: "human-decision" });
    }
    const findings = delivery.result?.findings ?? [];
    store.setAttempt(attempt.id, {
      state: "committed",
      outcome: "review-fresh",
      evidenceRef: digestOperationContract({ reviewOperation, findings, terminalArtifactKey: delivery.key }),
    });
    return freeze({ state: "fresh", reviewOperation, attemptId: attempt.id, findings, requiresFix: findings.length > 0, terminalArtifactKey: delivery.key });
  }

  const findings = currentBindings.findings ?? [];
  store.setAttempt(attempt.id, {
    state: "committed",
    outcome: "review-fresh",
    evidenceRef: digestOperationContract({ reviewOperation, findings }),
  });
  return freeze({ state: "fresh", reviewOperation, attemptId: attempt.id, findings, requiresFix: findings.length > 0 });
}

export function seedBindings() {
  const sha = (value) => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
  return freeze({
    sealedPackageDigest: sha("package"),
    reviewedHead: "head",
    artifactManifestDigest: sha("manifest"),
    applyEvidenceDigest: sha("apply"),
    dispositionsDigest: sha("dispositions"),
    policyGateDigest: sha("policy"),
  });
}

// Drives one fixture run end-to-end for a profile: proposal → planning
// conformance → apply → review → verify, with fresh-review-on-change when the
// sealed bindings change after a review. Returns the lifecycle facts.
export function driveFixtureRun({
  profile,
  store = createEphemeralStore(),
  adapters = createSimulatedAdapters(),
  bindings = seedBindings(),
  mutateAfterReview = false,
  clock = defaultClock,
} = {}) {
  const facts = [];
  const ownerToken = `owner-${profile}`;
  const evidence = { applyEligibility: true, reviewReady: profile === "production-rapid" };

  const advance = (stepName, committedEvidence) => {
    const transition = selectNextTransition({ stage: store.getState().stage, profile, evidence, clock });
    if (transition.kind !== "transition" || transition.step !== stepName) {
      facts.push({ step: stepName, outcome: "paused", reason: transition.reason ?? "unexpected-transition" });
      return false;
    }
    store.appendTransition({ step: transition.step, gateDigest: transition.gateDigest });
    const result = executeTransition({ transition, store, adapters, ownerToken, clock });
    facts.push({ step: transition.step, outcome: result.state, disposition: result.disposition, evidenceRef: result.evidenceRef ?? null });
    if (result.state === "committed") {
      Object.assign(evidence, committedEvidence);
      store.setStage(nextStage[transition.step]);
    }
    return result.state === "committed";
  };

  if (!advance("proposal", { proposal: true, planning: true })) return facts;
  if (!advance("planningConformance", { planningConformance: true })) return facts;
  if (!advance("apply", { apply: true })) return facts;

  const review = thinReviewLoop({
    store,
    profile,
    previousBindings: bindings,
    currentBindings: mutateAfterReview ? { ...bindings, reviewedHead: `${bindings.reviewedHead}-changed` } : bindings,
    clock,
  });
  facts.push({ step: "review", outcome: review.state, reviewOperation: review.reviewOperation, requiresFix: review.requiresFix ?? false });

  if (review.state === "fresh" && review.requiresFix) {
    facts.push({ step: "fresh-review-on-change", outcome: "fix-routed", disposition: "objective-correction" });
    return facts;
  }
  Object.assign(evidence, { current: true });
  store.setStage(nextStage.review);

  if (!advance("verify", { verify: true })) return facts;
  return facts;
}
