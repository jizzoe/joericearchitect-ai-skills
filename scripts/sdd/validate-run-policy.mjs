#!/usr/bin/env node
import fs from "node:fs";
import { checkOperationAuthorization } from "./check-operation-authorization.mjs";

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

function includesForbidden(allowed = [], forbidden = []) {
  const forbiddenSet = new Set(forbidden.map((item) => String(item).toLowerCase()));
  return allowed.filter((item) => forbiddenSet.has(String(item).toLowerCase()));
}

export function validateRunPolicy(input) {
  const authorization = input.authorization ?? {};
  const runtime = input.runtime ?? {};
  const canonicalText = input.canonicalText ?? "";
  const productConstants = input.productConstants ?? [];
  const issues = [];

  if (!hasText(authorization.objective)) {
    issues.push({ code: "missing-objective", severity: "error" });
  }
  if (!hasItems(authorization.targets)) {
    issues.push({ code: "missing-target", severity: "error" });
  }
  if (!authorization.workSelection || !hasText(authorization.workSelection.policy)) {
    issues.push({ code: "missing-work-selection", severity: "error" });
  }
  if (!hasItems(authorization.allowedMutations)) {
    issues.push({ code: "missing-mutation-boundary", severity: "error" });
  }
  if (!hasItems(authorization.forbiddenActions)) {
    issues.push({ code: "missing-forbidden-actions", severity: "error" });
  }
  if (!authorization.stoppingConditions || Object.keys(authorization.stoppingConditions).length === 0) {
    issues.push({ code: "missing-stopping-conditions", severity: "error" });
  }
  if (!hasItems(authorization.evidence)) {
    issues.push({ code: "missing-evidence", severity: "error" });
  }

  const conflicts = includesForbidden(
    authorization.allowedMutations,
    authorization.forbiddenActions
  );
  for (const action of conflicts) {
    issues.push({ code: "forbidden-action-allowed", severity: "error", action });
  }

  if (authorization.expiresAt) {
    const expires = Date.parse(authorization.expiresAt);
    const now = input.now ? Date.parse(input.now) : Date.now();
    if (Number.isNaN(expires)) {
      issues.push({ code: "invalid-expiration", severity: "error" });
    } else if (expires <= now) {
      issues.push({ code: "expired-authorization", severity: "error" });
    }
  }

  if (runtime.permissionGaps && runtime.permissionGaps.length > 0) {
    issues.push({
      code: "runtime-permission-gap",
      severity: "blocker",
      gaps: runtime.permissionGaps
    });
  }

  if (input.operationRequest) {
    const operationCheck = checkOperationAuthorization({
      now: input.now,
      authorization,
      runtime,
      config: input.config ?? {},
      request: input.operationRequest
    });
    if (!operationCheck.allowed) {
      for (const operationIssue of operationCheck.issues) {
        issues.push({ code: `operation-${operationIssue.code}`, severity: "blocker", detail: operationIssue.detail });
      }
    }
  }

  for (const constant of productConstants) {
    if (!hasText(constant)) {
      continue;
    }
    if (canonicalText.toLowerCase().includes(constant.toLowerCase())) {
      issues.push({
        code: "product-constant-in-canonical-asset",
        severity: "error",
        constant
      });
    }
  }

  return {
    valid: issues.length === 0,
    classification: issues.length === 0 ? "authorized" : "blocked",
    issues
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: validate-run-policy.mjs <input.json>");
    process.exit(2);
  }
  const result = validateRunPolicy(readJson(inputPath));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.valid ? 0 : 1);
}
