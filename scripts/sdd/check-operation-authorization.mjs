#!/usr/bin/env node
import { operationVocabulary } from "../validation/validate-base-skill-contracts.mjs";

export const profileOperations = {
  "research-read-only": new Set(["read-source", "write-findings", "write-sources", "write-result", "notify-state"]),
  "local-implementation": new Set(["read-workspace", "local-edit", "run-test", "run-validation", "objective-correction", "write-result", "notify-state"]),
  "tracker-maintenance": new Set(["read-tracker", "backup-tracker", "upsert-allowlisted-record", "write-reconciliation-report", "write-result", "notify-state"]),
  "sdd-delivery": new Set(["read-workspace", "run-test", "run-validation", "issue-create-or-update", "project-update", "draft-pr-create-or-update", "run-lifecycle-action", "write-result", "notify-state"])
};

export const highImpactLifecycleActions = new Set(["merge-pr", "archive-change", "delete-merged-topic-branch"]);
const lifecycleActions = new Set(["sync-change", ...highImpactLifecycleActions]);
const lifecycleTargetPrefixes = {
  "merge-pr": "pr:",
  "archive-change": "change:",
  "delete-merged-topic-branch": "branch:"
};

function nonEmpty(value) { return typeof value === "string" && value.trim().length > 0; }
function fail(code, detail) { return { allowed: false, classification: "paused", issues: [{ code, ...(detail ? { detail } : {}) }] }; }

function targetMatches(authorized, requested) {
  if (authorized === requested) return true;
  if (typeof authorized !== "string" || typeof requested !== "string") return false;
  if (!authorized.startsWith("workspace:") || !requested.startsWith("workspace:")) return false;
  const root = authorized.slice("workspace:".length).replace(/\/$/, "");
  const target = requested.slice("workspace:".length);
  return root.length > 0 && (target === root || target.startsWith(`${root}/`));
}

function authorizationExpired(authorization, now) {
  const expiration = authorization?.expiresAt ?? authorization?.stoppingConditions?.expiresAt;
  if (!expiration) return false;
  const when = Date.parse(expiration);
  return Number.isNaN(when) || when <= Date.parse(now ?? new Date().toISOString());
}

function adapterAllows(config, runtime, adapterName, operation) {
  const adapter = config?.adapters?.[adapterName];
  if (!adapter?.enabled || !adapter.operations?.includes(operation)) return false;
  const capabilities = runtime?.adapterCapabilities?.[adapterName];
  return Array.isArray(capabilities) && capabilities.includes(operation);
}

export function checkOperationAuthorization(input) {
  const { authorization = {}, runtime = {}, config = {}, request = {} } = input;
  const profile = request.profile;
  const operation = request.operation;
  if (!profileOperations[profile]) return fail("unknown-profile", profile);
  if (!operationVocabulary.has(operation)) return fail("unknown-operation", operation);
  if (!profileOperations[profile].has(operation)) return fail("operation-not-in-profile", operation);
  if (!authorization.allowedMutations?.includes(operation)) return fail("operation-not-authorized", operation);
  if (!authorization.targets?.some((target) => targetMatches(target, request.target))) return fail("unauthorized-target", request.target);
  if (authorizationExpired(authorization, input.now)) return fail("expired-authorization");
  if (runtime.permissionGaps?.length || (Array.isArray(runtime.permittedOperations) && !runtime.permittedOperations.includes(operation))) return fail("runtime-permission-gap", operation);
  if (request.adapter && !authorization.targets?.includes(`adapter:${request.adapter}`)) return fail("unauthorized-adapter", request.adapter);
  if (request.adapter && !adapterAllows(config, runtime, request.adapter, operation)) return fail("adapter-capability-mismatch", request.adapter);
  if (operation === "objective-correction" && Number(request.correctionAttempts ?? 0) >= 3) return fail("correction-limit-exhausted");
  if (operation === "run-lifecycle-action" && !lifecycleActions.has(request.lifecycleAction)) return fail("unnamed-or-unsupported-lifecycle-action");
  if (highImpactLifecycleActions.has(request.lifecycleAction)) {
    if (profile !== "sdd-delivery") return fail("high-impact-action-profile-mismatch", request.lifecycleAction);
    if (!request.target?.startsWith(lifecycleTargetPrefixes[request.lifecycleAction])) return fail("lifecycle-target-type-mismatch", request.lifecycleAction);
    if (!nonEmpty(request.recovery)) return fail("missing-recovery", request.lifecycleAction);
    if (request.evidenceCurrent !== true) return fail("incomplete-lifecycle-evidence", request.lifecycleAction);
  }
  return { allowed: true, classification: "authorized", issues: [] };
}

export function checkDeliveryPreapproval(input) {
  const { executionMode, deliveryProfile, request = {}, preapproval, runtime = {} } = input;
  if (!highImpactLifecycleActions.has(request.lifecycleAction)) return { allowed: true, classification: "authorized", issues: [] };
  if (executionMode === "interactive" && deliveryProfile === "production-rapid") return fail("just-in-time-approval-required", request.lifecycleAction);
  if (executionMode !== "interactive" || deliveryProfile !== "prototype-rapid") return fail("delivery-preapproval-not-eligible", request.lifecycleAction);
  if (!preapproval || preapproval.operation !== request.lifecycleAction || preapproval.target !== request.target) return fail("preapproval-target-or-operation-mismatch");
  if (!request.target?.startsWith(lifecycleTargetPrefixes[request.lifecycleAction])) return fail("lifecycle-target-type-mismatch", request.lifecycleAction);
  if (!nonEmpty(preapproval.recovery) || preapproval.evidenceCurrent !== true) return fail("incomplete-delivery-preapproval");
  const expires = Date.parse(preapproval.expiresAt);
  if (Number.isNaN(expires) || expires <= Date.parse(input.now ?? new Date().toISOString())) return fail("expired-delivery-preapproval");
  if (runtime.permissionGaps?.length || (Array.isArray(runtime.permittedOperations) && !runtime.permittedOperations.includes("run-lifecycle-action"))) return fail("runtime-permission-gap", "run-lifecycle-action");
  return { allowed: true, classification: "authorized", issues: [] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.error("This module is imported by deterministic validators and tests.");
  process.exit(2);
}
