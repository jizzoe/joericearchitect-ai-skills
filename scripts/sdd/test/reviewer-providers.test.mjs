import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { defaultReviewerProvidersPath, loadReviewerProviders, resolveReviewerProvider, validateReviewerProvidersConfig } from "../reviewer-providers.mjs";

const valid = () => ({
  schemaVersion: 1,
  providers: [
    { name: "codex-strict", adapter: "codex-detached-read-only-v1", executable: "codex", assurance: "strict-isolated", transport: "parent-capture" },
    { name: "claude-degraded", adapter: "claude-detached-restricted-v1", executable: "claude", assurance: "authorized-degraded", transport: "subprocess" }
  ]
});

test("valid registry validates and resolves providers by name", () => {
  const config = valid();
  assert.equal(validateReviewerProvidersConfig(config).valid, true);
  assert.equal(resolveReviewerProvider(config, "codex-strict").adapter, "codex-detached-read-only-v1");
  assert.equal(resolveReviewerProvider(config, "claude-degraded").transport, "subprocess");
  assert.equal(resolveReviewerProvider(config, "missing"), null);
});

test("invalid entries are rejected deterministically", () => {
  const unknownAdapter = valid(); unknownAdapter.providers[0].adapter = "unknown-adapter";
  assert.equal(validateReviewerProvidersConfig(unknownAdapter).reason, "reviewer-providers-entry-invalid");
  const duplicate = valid(); duplicate.providers.push({ ...duplicate.providers[0] });
  assert.equal(validateReviewerProvidersConfig(duplicate).reason, "reviewer-providers-duplicate-name");
  const empty = valid(); empty.providers = [];
  assert.equal(validateReviewerProvidersConfig(empty).reason, "reviewer-providers-config-invalid");
  assert.equal(validateReviewerProvidersConfig(null).reason, "reviewer-providers-config-invalid");
});

test("loadReviewerProviders reads and validates a JSON registry file", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "reviewer-providers-"));
  try {
    const p = path.join(dir, "providers.json");
    fs.writeFileSync(p, JSON.stringify(valid()));
    assert.equal(loadReviewerProviders(p).valid, true);
    fs.writeFileSync(p, "not-json");
    assert.equal(loadReviewerProviders(p).reason, "reviewer-providers-config-unreadable");
    assert.equal(loadReviewerProviders("").reason, "reviewer-providers-config-path-invalid");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("defaultReviewerProvidersPath is the config/reviewer-providers.json location", () => {
  assert.equal(defaultReviewerProvidersPath("/repo"), path.join("/repo", "config", "reviewer-providers.json"));
  assert.equal(defaultReviewerProvidersPath(""), null);
});
