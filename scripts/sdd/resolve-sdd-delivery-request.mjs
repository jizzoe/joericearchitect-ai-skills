#!/usr/bin/env node
import fs from "node:fs";

const changeName = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const modes = ["autonomous", "interactive"];
const qualityProfiles = ["production-rapid", "prototype-rapid"];
const authorizationProfiles = ["sdd-delivery"];
const reviewPolicies = ["strict-only", "strict-first-degraded"];
const shorthandProfiles = Object.freeze({
  prod: Object.freeze({ mode: "autonomous", qualityProfile: "production-rapid", authorizationProfile: "sdd-delivery", independentReviewPolicy: "strict-only", expiration: "4h" }),
  prototype: Object.freeze({ mode: "autonomous", qualityProfile: "prototype-rapid", authorizationProfile: "sdd-delivery", independentReviewPolicy: "strict-first-degraded", expiration: "4h" })
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
    field: "independentReviewPolicy",
    summary: "Strict review behavior when OS-isolated review is unavailable.",
    values: reviewPolicies
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
    const definition = byField.get(item.field);
    lines.push(`- ${item.field}: ${definition.summary} Values: ${definition.values.join(" | ")}.`);
  }
  return lines.join("\n");
}

function requestedFields(input) {
  return {
    target: input?.target,
    mode: input?.mode,
    qualityProfile: input?.qualityProfile ?? input?.profile,
    authorizationProfile: input?.authorizationProfile ?? input?.authorization,
    independentReviewPolicy: input?.independentReviewPolicy ?? input?.independentReview,
    expiration: input?.expiration
  };
}

export function resolveSddDeliveryRequest(input = {}, { goalStartedAt = new Date().toISOString() } = {}) {
  const values = requestedFields(input);
  const gaps = [];
  const missing = [];
  for (const definition of sddDeliveryRequestInputs) {
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
  if (values.independentReviewPolicy !== undefined && !reviewPolicies.includes(values.independentReviewPolicy)) gaps.push(issue("invalid-delivery-request-input", "independentReviewPolicy", values.independentReviewPolicy));
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
  const degraded = values.independentReviewPolicy === "strict-first-degraded";
  const effectiveAuthorization = Object.freeze({
    schemaVersion: 1,
    target,
    mode: values.mode,
    qualityProfile: values.qualityProfile,
    authorizationProfile: values.authorizationProfile,
    independentReviewPolicy: values.independentReviewPolicy,
    goalStartedAt: new Date(Date.parse(goalStartedAt)).toISOString(),
    expiresAt: expiration.expiresAt,
    correctionBudgetPerFailureSignature: correctionBudget,
    qualityGates: Object.freeze([
      "task-tests", "security-and-secret-review", "portability", "attribution",
      "requirements-mapping", "recovery-review", "openspec-verify", "independent-review",
      "openspec-validate-all-strict"
    ]),
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
    allowedMutations: Object.freeze(["write-design-brief"]),
    targets: Object.freeze([`workspace:ai-planning/design-briefs/${target.entries[0]}.md`]),
    review: Object.freeze({
      strictFirst: true,
      degradedFallbackAuthorized: degraded,
      launcherRecoveryAuthorized: degraded,
      authorizationDerivation: "exact-change-transition-package",
      riskAcceptanceReason: degraded
        ? "Owner selected strict-first-degraded to preserve fresh independent review after strict unavailability while accepting explicitly reduced OS-isolation assurance."
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
