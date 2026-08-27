#!/usr/bin/env node
import { createHash } from "node:crypto";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

import { canonicalJson } from "./independent-review-contract.mjs";

export const reviewAdapterDispatchSchemaVersion = 1;
export const reviewAdapterIds = Object.freeze([
  "codex-detached-read-only-v1",
  "claude-detached-restricted-v1"
]);

const definitions = Object.freeze({
  "codex-detached-read-only-v1": Object.freeze({
    resultAdapter: "codex",
    reviewerIdentityClass: "codex",
    runtimeHelper: "platform-review-adapters",
    strictOperation: "build-codex-parent-strict-review-tool-request",
    degradedOperation: "build-codex-parent-review-host-tool-request",
    launcherBoundary: "detached-exact-head-inner-read-only",
    innerBoundary: "read-only-sandbox",
    runtimeReceiptSources: Object.freeze(["codex-exec-tool"])
  }),
  "claude-detached-restricted-v1": Object.freeze({
    resultAdapter: "claude",
    reviewerIdentityClass: "claude",
    runtimeHelper: "platform-review-adapters",
    strictOperation: "claude-detached-strict-review",
    degradedOperation: "claude-detached-degraded-review",
    launcherBoundary: "detached-exact-head-read-tools-only",
    innerBoundary: "read-search-tools-only",
    runtimeReceiptSources: Object.freeze(["claude-parent-runtime"])
  })
});

const text = (value) => typeof value === "string" && value.trim().length > 0;
const fail = (code) => ({ valid: false, code });
const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");

function snapshotShape(value) {
  return value?.schemaVersion === 1 && Array.isArray(value.sources) &&
    value.sources.every(text) && new Set(value.sources).size === value.sources.length &&
    value.values && typeof value.values === "object" && !Array.isArray(value.values);
}

function bindingFor(reviewAdapter) {
  const definition = definitions[reviewAdapter];
  if (!definition) return null;
  const unsigned = {
    schemaVersion: reviewAdapterDispatchSchemaVersion,
    reviewAdapter,
    launcherKind: reviewAdapter,
    resultAdapter: definition.resultAdapter,
    reviewerIdentityClass: definition.reviewerIdentityClass,
    runtimeHelper: definition.runtimeHelper,
    strictOperation: definition.strictOperation,
    degradedOperation: definition.degradedOperation,
    launcherBoundary: definition.launcherBoundary,
    innerBoundary: definition.innerBoundary,
    runtimeReceiptSources: Object.freeze([...definition.runtimeReceiptSources])
  };
  return Object.freeze({ ...unsigned, bindingDigest: digest(unsigned) });
}

/**
 * Resolve only the immutable work-unit snapshot. This function deliberately
 * accepts neither a repository path nor product configuration, so dispatch
 * cannot reread a later configuration value.
 */
export function resolveReviewAdapterDispatch(configurationSnapshot) {
  if (!snapshotShape(configurationSnapshot) || !text(configurationSnapshot.values.reviewAdapter)) {
    return fail("review-adapter-selection-missing");
  }
  const binding = bindingFor(configurationSnapshot.values.reviewAdapter);
  return binding
    ? { valid: true, code: "review-adapter-dispatch-ready", binding }
    : fail("review-adapter-selection-unsupported");
}

export function reviewAdapterBindingMatches(configurationSnapshot, binding) {
  const resolved = resolveReviewAdapterDispatch(configurationSnapshot);
  return resolved.valid && canonicalJson(binding) === canonicalJson(resolved.binding);
}

/**
 * Validate any supplied endpoint against the one resolved binding. Omitted
 * endpoints are ignored; supplied endpoints must match exactly.
 */
export function validateReviewAdapterDispatchBinding({
  configurationSnapshot,
  binding,
  launcher,
  reviewer,
  runtimeReceipt,
  result
} = {}) {
  const resolved = resolveReviewAdapterDispatch(configurationSnapshot);
  if (!resolved.valid) return resolved;
  const expected = resolved.binding;
  if (binding !== undefined && canonicalJson(binding) !== canonicalJson(expected)) {
    return fail("review-adapter-binding-mismatch");
  }
  if (launcher !== undefined && launcher?.kind !== expected.launcherKind) {
    return fail("review-adapter-launcher-mismatch");
  }
  if (reviewer !== undefined && reviewer?.adapter !== expected.resultAdapter) {
    return fail("review-adapter-reviewer-mismatch");
  }
  if (runtimeReceipt !== undefined && (runtimeReceipt?.reviewAdapter !== expected.reviewAdapter ||
      runtimeReceipt?.runtimeHelper !== expected.runtimeHelper ||
      !expected.runtimeReceiptSources.includes(runtimeReceipt?.source))) {
    return fail("review-adapter-runtime-receipt-mismatch");
  }
  if (result !== undefined && result?.reviewer?.adapter !== expected.resultAdapter) {
    return fail("review-adapter-result-mismatch");
  }
  return { valid: true, code: "review-adapter-binding-valid", binding: expected };
}

/**
 * Select one operation from an injected implementation map by the sealed
 * adapter ID. There is no direct implementation or launcher argument.
 */
export function selectReviewAdapterImplementation({
  configurationSnapshot,
  implementations,
  phase = "strict"
} = {}) {
  const resolved = resolveReviewAdapterDispatch(configurationSnapshot);
  if (!resolved.valid) return resolved;
  if (!["strict", "authorized-degraded"].includes(phase) ||
      !implementations || typeof implementations !== "object" || Array.isArray(implementations)) {
    return fail("review-adapter-implementation-missing");
  }
  const implementation = implementations[resolved.binding.reviewAdapter];
  const operation = phase === "strict" ? implementation?.strict : implementation?.degraded;
  if (implementation?.reviewAdapter !== resolved.binding.reviewAdapter ||
      !reviewAdapterBindingMatches(configurationSnapshot, implementation?.binding) ||
      typeof operation !== "function") {
    return fail("review-adapter-implementation-missing");
  }
  return {
    valid: true,
    code: "review-adapter-implementation-selected",
    binding: resolved.binding,
    implementation,
    operation
  };
}

export function runReviewAdapterDispatchCli(argv = process.argv.slice(2)) {
  if (argv.length !== 2 || argv[0] !== "resolve") return fail("review-adapter-dispatch-cli-arguments-invalid");
  try {
    return resolveReviewAdapterDispatch(JSON.parse(fs.readFileSync(argv[1], "utf8")));
  } catch {
    return fail("review-adapter-dispatch-input-unavailable");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length === 3 && ["--help", "-h"].includes(process.argv[2])) {
    process.stdout.write("usage: review-adapter-dispatch.mjs resolve <configuration-snapshot.json>\n");
    process.exit(0);
  }
  const outcome = runReviewAdapterDispatchCli();
  process.stdout.write(`${JSON.stringify(outcome, null, 2)}\n`);
  process.exit(outcome.valid ? 0 : 1);
}
