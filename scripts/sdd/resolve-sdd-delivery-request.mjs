#!/usr/bin/env node
import fs from "node:fs";
import { normalizeAgentPolicy as normalizeCanonicalAgentPolicy } from "./autonomous-sdd-operation-contract.mjs";

const changeName = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const modes = ["autonomous", "interactive"];
const qualityProfiles = ["production-rapid", "prototype-rapid"];
const authorizationProfiles = ["sdd-delivery"];
const reviewPolicies = ["strict-only", "strict-first-degraded", "same-session-local"];
const agentPolicies = ["auto", "multi-agent", "single-agent"];
const independentReviewPolicies = new Set(["strict-only", "strict-first-degraded"]);
const shorthandProfiles = Object.freeze({
  prod: Object.freeze({ mode: "autonomous", qualityProfile: "production-rapid", authorizationProfile: "sdd-delivery", reviewPolicy: "strict-only", expiration: "4h" }),
  prototype: Object.freeze({ mode: "autonomous", qualityProfile: "prototype-rapid", authorizationProfile: "sdd-delivery", reviewPolicy: "same-session-local", expiration: "4h" })
});

export const sddDeliveryRequestInputs = Object.freeze([
  Object.freeze({
    field: "target",
    summary: "OpenSpec change to deliver, or an explicitly ordered queue of changes.",
    values: ["<change-name>", "[<first-change>, <second-change>, ...]"]
  }),
  Object.freeze({
    field: "mode",
    summary: "Whether the lifecycle runs continuously or pauses at normal interactive boundaries.",
    values: modes
  }),
  Object.freeze({
    field: "qualityProfile",
    summary: "Quality and evidence profile; rapid affects routine approvals, not production gates.",
    values: qualityProfiles
  }),
  Object.freeze({
    field: "authorizationProfile",
    summary: "Mutation boundary for the selected work; sdd-delivery covers its linked SDD lifecycle only.",
    values: authorizationProfiles
  }),
  Object.freeze({
    field: "reviewPolicy",
    summary: "Assurance policy selected by the execution-mode and quality-profile matrix.",
    values: reviewPolicies
  }),
  Object.freeze({
    field: "agentPolicy",
    summary: "Agent-context topology; auto is deterministic and conservative.",
    values: agentPolicies
  }),
  Object.freeze({
    field: "expiration",
    summary: "Hard run deadline, expressed as a positive duration or future UTC timestamp.",
    values: ["<positive hours, e.g. 12h>", "<future ISO-8601 UTC timestamp>"]
  })
]);

const byField = new Map(sddDeliveryRequestInputs.map((item) => [item.field, item]));
const text = (value) => typeof value === "string" && value.trim().length > 0;
const issue = (code, field, detail) => ({ code, field, ...(detail ? { detail } : {}) });

function normalizeTarget(value) {
  const entries = typeof value === "string"
    ? [value]
    : Array.isArray(value)
      ? value
      : typeof value?.change === "string"
        ? [value.change]
        : Array.isArray(value?.queue)
          ? value.queue
          : null;
  if (!entries?.length || entries.some((entry) => !changeName.test(entry)) || new Set(entries).size !== entries.length) return null;
  return Object.freeze({ kind: entries.length === 1 ? "change" : "ordered-queue", entries: Object.freeze([...entries]) });
}

function parseExpiration(value, goalStartedAt) {
  const started = Date.parse(goalStartedAt);
  if (Number.isNaN(started)) return null;
  const durationResult = (hours) => {
    const timestamp = started + hours * 3_600_000;
    if (!Number.isFinite(timestamp) || Math.abs(timestamp) > 8_640_000_000_000_000) return null;
    return { kind: "duration", durationHours: hours, expiresAt: new Date(timestamp).toISOString() };
  };
  if (text(value)) {
    const duration = value.trim().match(/^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)$/i);
    if (duration) {
      const hours = Number(duration[1]);
      if (!Number.isFinite(hours) || hours <= 0) return null;
      return durationResult(hours);
    }
    const absolute = Date.parse(value);
    if (!Number.isNaN(absolute) && absolute > started) return { kind: "timestamp", expiresAt: new Date(absolute).toISOString() };
  }
  if (Number.isFinite(value?.hours) && value.hours > 0) {
    return durationResult(value.hours);
  }
  if (text(value?.expiresAt)) return parseExpiration(value.expiresAt, goalStartedAt);
  return null;
}

function clarification(items) {
  const lines = ["I need these delivery inputs before I can select work or make changes:"];
  for (const item of items) {
    const definition = byField.get(item.field === "independentReviewPolicy" ? "reviewPolicy" : item.field);
    lines.push(`- ${item.field}: ${definition.summary} Values: ${definition.values.join(" | ")}.`);
  }
  return lines.join("\n");
}

function requestedFields(input) {
  const legacyReviewPolicy = input?.independentReviewPolicy ?? input?.independentReview;
  return {
    target: input?.target,
    mode: input?.mode,
    qualityProfile: input?.qualityProfile ?? input?.profile,
    authorizationProfile: input?.authorizationProfile ?? input?.authorization,
    reviewPolicy: input?.reviewPolicy ?? legacyReviewPolicy,
    legacyReviewPolicy,
    reviewPolicyExplicit: input?.reviewPolicy !== undefined,
    expiration: input?.expiration,
    agentPolicy: input?.agentPolicy,
    agentSignals: input?.agentSignals
  };
}

function reviewPolicyIssue(values) {
  if (!reviewPolicies.includes(values.reviewPolicy)) return issue("invalid-delivery-request-input", "reviewPolicy", values.reviewPolicy);
  if (values.reviewPolicyExplicit && values.legacyReviewPolicy !== undefined && values.reviewPolicy !== values.legacyReviewPolicy) {
    return issue("conflicting-delivery-request-input", "reviewPolicy", "independentReviewPolicy");
  }
  if (values.legacyReviewPolicy !== undefined && !independentReviewPolicies.has(values.legacyReviewPolicy)) {
    return issue("invalid-delivery-request-input", "independentReviewPolicy", values.legacyReviewPolicy);
  }
  const localPrototype = values.mode === "autonomous" && values.qualityProfile === "prototype-rapid";
  if (localPrototype && values.reviewPolicy !== "same-session-local") {
    return issue("delivery-request-matrix-conflict", "reviewPolicy", "autonomous prototype-rapid requires same-session-local");
  }
  if (!localPrototype && values.reviewPolicy === "same-session-local") {
    return issue("delivery-request-matrix-conflict", "reviewPolicy", "same-session-local is limited to autonomous prototype-rapid");
  }
  return null;
}

export function resolveSddDeliveryRequest(input = {}, { goalStartedAt = new Date().toISOString() } = {}) {
  const values = requestedFields(input);
  if (values.reviewPolicy === undefined && values.mode === "autonomous" && values.qualityProfile === "prototype-rapid") values.reviewPolicy = "same-session-local";
  if (values.reviewPolicy === undefined && values.qualityProfile === "production-rapid") values.reviewPolicy = "strict-only";
  const gaps = [];
  const missing = [];
  for (const definition of sddDeliveryRequestInputs.filter((item) => !["reviewPolicy", "agentPolicy"].includes(item.field))) {
    const value = values[definition.field];
    if (value === undefined || value === null || value === "") {
      const record = issue("missing-delivery-request-input", definition.field);
      missing.push(record);
      gaps.push(record);
    }
  }

  const target = values.target === undefined ? null : normalizeTarget(values.target);
  const expiration = values.expiration === undefined ? null : parseExpiration(values.expiration, goalStartedAt);
  if (values.target !== undefined && !target) gaps.push(issue("invalid-delivery-request-input", "target"));
  if (values.mode !== undefined && !modes.includes(values.mode)) gaps.push(issue("invalid-delivery-request-input", "mode", values.mode));
  if (values.qualityProfile !== undefined && !qualityProfiles.includes(values.qualityProfile)) gaps.push(issue("invalid-delivery-request-input", "qualityProfile", values.qualityProfile));
  if (values.authorizationProfile !== undefined && !authorizationProfiles.includes(values.authorizationProfile)) gaps.push(issue("invalid-delivery-request-input", "authorizationProfile", values.authorizationProfile));
  if (values.reviewPolicy !== undefined) {
    const policyIssue = reviewPolicyIssue(values);
    if (policyIssue) gaps.push(policyIssue);
  }
  const agentTopology = normalizeCanonicalAgentPolicy(values.agentPolicy, values.agentSignals);
  if (!agentTopology.valid) gaps.push(issue("invalid-delivery-request-input", "agentPolicy", values.agentPolicy));
  if (values.expiration !== undefined && !expiration) gaps.push(issue("invalid-delivery-request-input", "expiration"));

  const requestedBudget = input.correctionBudgetPerFailureSignature;
  if (requestedBudget !== undefined && (!Number.isInteger(requestedBudget) || requestedBudget < 0 || requestedBudget > 3)) {
    gaps.push(issue("invalid-delivery-request-correction-budget", "qualityProfile", String(requestedBudget)));
  }

  if (gaps.length) {
    const fields = [...new Set(gaps.map((item) => item.field))].map((field) => ({ field }));
    return {
      ready: false,
      classification: missing.length ? "needs-input" : "invalid",
      issues: gaps,
      clarification: clarification(fields)
    };
  }

  const correctionBudget = requestedBudget ?? 3;
  const degraded = values.reviewPolicy === "strict-first-degraded";
  const localReview = values.reviewPolicy === "same-session-local";
  const requiredQualityActions = Object.freeze([
    "focused-tests", "critical-flow", "requirements-mapping", "local-code-security-review",
    ...(values.qualityProfile === "production-rapid"
      ? ["regression-coverage", "repeatability", "operational-checks", "exact-head-ci", "independent-review"]
      : []),
    "openspec-verify", "openspec-validate-all-strict", "lifecycle-reconciliation"
  ]);
  const completionEvidencePredicates = Object.freeze([
    "all-applicable-quality-actions-current-and-passing",
    "final-target-package-workspace-and-head-bound",
    "no-unresolved-objective-findings",
    "delivery-sync-archive-current",
    "issue-project-and-cleanup-reconciled",
    "no-residual-owned-state"
  ]);
  const blockingApprovalGates = Object.freeze(values.mode === "interactive"
    ? ["plan-to-apply-confirmation", "verified-to-close-confirmation"]
    : []);
  const effectiveAuthorization = Object.freeze({
    schemaVersion: 2,
    target,
    mode: values.mode,
    qualityProfile: values.qualityProfile,
    authorizationProfile: values.authorizationProfile,
    reviewPolicy: values.reviewPolicy,
    agentPolicy: agentTopology.policy,
    agentTopology,
    ...(independentReviewPolicies.has(values.reviewPolicy)
      ? { independentReviewPolicy: values.reviewPolicy, independentReviewPolicyDeprecated: true }
      : {}),
    goalStartedAt: new Date(Date.parse(goalStartedAt)).toISOString(),
    expiresAt: expiration.expiresAt,
    correctionBudgetPerFailureSignature: correctionBudget,
    blockingApprovalGates,
    requiredQualityActions,
    completionEvidencePredicates,
    qualityGates: requiredQualityActions,
    lifecycle: Object.freeze({
      allowed: Object.freeze([
        "issue-create-or-reuse", "project-item-create-or-reuse", "openspec-plan", "apply",
        "implementation-pr", "merge-implementation-pr", "sync-pr", "merge-sync-pr",
        "archive-pr", "merge-archive-pr", "close-issue", "set-project-done",
        "delete-confirmed-merged-change-branch"
      ]),
      forbidden: Object.freeze([
        "deployment", "release", "credential-or-scope-change", "external-message", "unrelated-mutation"
      ])
    }),
    deliveryPreparation: Object.freeze({
      selectedEntry: target.entries[0],
      outputPath: `ai-planning/design-briefs/${target.entries[0]}.md`
    }),
    allowedMutations: Object.freeze([
      "read-workspace", "write-design-brief", "run-test", "run-validation",
      "issue-create-or-update", "project-update", "draft-pr-create-or-update",
      "run-lifecycle-action", "write-result", "notify-state"
    ]),
    targets: Object.freeze([`workspace:ai-planning/design-briefs/${target.entries[0]}.md`]),
    review: Object.freeze({
      assurance: localReview ? "local-review" : "independent-review",
      strictFirst: !localReview,
      sameSessionLocal: localReview,
      degradedFallbackAuthorized: degraded,
      launcherRecoveryAuthorized: degraded,
      authorizationDerivation: "exact-change-transition-package",
      riskAcceptanceReason: degraded
        ? "Owner selected strict-first-degraded to preserve fresh independent review after strict unavailability while accepting explicitly reduced OS-isolation assurance."
        : localReview
          ? "Owner selected bounded autonomous prototype delivery with explicitly labeled same-session local review; this evidence cannot satisfy a production independent-review gate."
          : null
    })
  });

  return { ready: true, classification: "resolved", issues: [], effectiveAuthorization };
}

export function resolveShipSddRequest(command, options = {}) {
  if (typeof command !== "string") return resolveSddDeliveryRequest({}, options);
  const match = command.trim().match(/^ship-sdd\s+(\[[^\]]+\]|\S+)\s+(prod|prototype)(?:\s+(\S+))?$/);
  if (!match) {
    return { ready: false, classification: "invalid", issues: [issue("invalid-delivery-request-input", "target", "expected ship-sdd")], clarification: "Use ship-sdd <change-or-ordered-queue> <prod|prototype> [duration]." };
  }
  const [, rawTarget, alias, duration] = match;
  const target = rawTarget.startsWith("[") ? rawTarget.slice(1, -1).split(",").map((entry) => entry.trim()) : rawTarget;
  const preset = shorthandProfiles[alias];
  if (!preset || !target) {
    return { ready: false, classification: "invalid", issues: [issue("invalid-delivery-request-input", !target ? "target" : "qualityProfile")], clarification: "Use ship-sdd <change-or-ordered-queue> <prod|prototype> [duration]." };
  }
  return resolveSddDeliveryRequest({ target, ...preset, ...(duration ? { expiration: duration } : {}) }, options);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: resolve-sdd-delivery-request.mjs <request.json> [goal-started-at]");
    process.exit(2);
  }
  const result = resolveSddDeliveryRequest(JSON.parse(fs.readFileSync(inputPath, "utf8")), {
    goalStartedAt: process.argv[3] ?? new Date().toISOString()
  });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ready ? 0 : 1);
}
