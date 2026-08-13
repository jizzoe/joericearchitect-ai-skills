import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { executeIndependentReview, probeIndependentReviewAdapter } from "../../../scripts/sdd/execute-independent-review.mjs";
import { buildReviewPackage, packageDigest, validateReviewPackage, validateReviewResult } from "../../../scripts/sdd/independent-review-contract.mjs";
import { validateAiSkillsConfig } from "../../../scripts/validation/validate-base-skill-contracts.mjs";

const fixture = (name) => JSON.parse(fs.readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
const capabilities = { adapter: "fixture", attestationRef: "fixture-attestation", probeReference: "fixture-probe", runtimeEnforced: true, freshContext: true, readOnlyView: true, nonInteractive: true, denied: { workspaceWrite: true, gitWrite: true, githubMutation: true, credentialAccess: true, authenticatedNetwork: true, externalSend: true, deployment: true, release: true, delegatedMutation: true } };
const reviewPackage = () => { const value = fixture("valid-package.json"); value.manifestDigest = packageDigest(value); return value; };
const result = () => { const value = fixture("valid-result.json"); value.manifestDigest = reviewPackage().manifestDigest; return value; };

test("scenario matrix covers strict and authorized-degraded safety boundaries", () => {
  const matrix = JSON.parse(fs.readFileSync(new URL("./scenarios.json", import.meta.url), "utf8"));
  assert.equal(matrix.skill, "independent-review");
  assert.deepEqual(matrix.scenarios.map((scenario) => scenario.kind).sort(), ["autonomous-allowed-action", "autonomous-pause", "missing-input", "non-trigger", "output-path-safety", "portable-second-workspace", "trigger", "untrusted-content"]);
});

test("independent-review eval matrix rejects malformed, secret, stale, self-review, wrong-attestation, and duplicate results", () => {
  const pack = reviewPackage();
  assert.equal(validateReviewPackage({ ...pack, diff: "Bearer abcdefghijklmnop" }).valid, false);
  assert.equal(validateReviewPackage({ ...pack, manifestDigest: "0".repeat(64) }).valid, false);
  const current = result();
  const configuredReviewer = { type: "fixture", identity: "fresh-reviewer", attestation: { ref: "fixture-attestation" } };
  assert.equal(validateReviewResult({ ...current, reviewer: { ...current.reviewer, identity: "implementer" } }, { expectedPackage: pack, configuredReviewer, implementerSession: "implementer" }).valid, false);
  assert.equal(validateReviewResult({ ...current, attestation: { ...current.attestation, ref: "wrong" } }, { expectedPackage: pack, configuredReviewer, implementerSession: "implementer" }).valid, false);
  assert.equal(validateReviewResult({ ...current, headCommit: "c".repeat(40) }, { expectedPackage: pack, configuredReviewer, implementerSession: "implementer" }).valid, false);
  assert.equal(validateReviewResult({ ...current, attestation: { ...current.attestation, freshContext: false } }, { expectedPackage: pack, configuredReviewer, implementerSession: "implementer" }).valid, false);
  assert.equal(validateReviewResult(current, { expectedPackage: pack, configuredReviewer, implementerSession: "implementer", seenRecordIds: new Set([current.reviewRecordId]) }).valid, false);
});

test("independent-review eval matrix rejects every prohibited mutation capability", async () => {
  for (const denied of Object.keys(capabilities.denied)) {
    const adapter = { ...capabilities, denied: { ...capabilities.denied, [denied]: false } };
    assert.equal(probeIndependentReviewAdapter(adapter).available, false);
    assert.equal((await executeIndependentReview({ package: reviewPackage(), adapter, invoke: async () => result() })).status, "unavailable");
  }
});

test("canonical review assets are portable to a second repository and both adapter result shapes", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "second-review-workspace-"));
  const git = (...args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
  try {
    git("init"); git("config", "user.email", "fixture@example.invalid"); git("config", "user.name", "Fixture");
    fs.mkdirSync(path.join(root, "governed/change"), { recursive: true });
    fs.writeFileSync(path.join(root, "governed/change/spec.md"), "base\n"); git("add", "."); git("commit", "-m", "base");
    const base = git("rev-parse", "HEAD");
    fs.writeFileSync(path.join(root, "governed/change/spec.md"), "head\n"); git("add", "."); git("commit", "-m", "head");
    const head = git("rev-parse", "HEAD");
    const built = buildReviewPackage({ repositoryPath: root, baseCommit: base, headCommit: head, artifactPaths: ["governed/change/spec.md"], validationEvidence: ["alternate-test"] });
    assert.equal(built.valid, true, JSON.stringify(built));
    assert.equal(validateAiSkillsConfig({ schemaVersion: 1, independentReview: { enabled: true, adapter: "alternate-reviewer", attestationRef: "attestations/alternate.json", reviewPath: "isolated/view", allowedCommands: ["git-diff"], artifactPaths: ["governed/change/spec.md"], evidenceRoot: "records/reviews" } }).valid, true);
    for (const [type, identity, ref] of [["codex", "alternate-codex", "attestations/codex.json"], ["claude", "alternate-claude", "attestations/claude.json"]]) {
      const shaped = result();
      shaped.reviewer = { type, identity, adapter: type };
      shaped.attestation.ref = ref;
      shaped.baseCommit = base; shaped.headCommit = head; shaped.manifestDigest = built.package.manifestDigest;
      assert.equal(validateReviewResult(shaped, { expectedPackage: built.package, configuredReviewer: { type, identity, attestation: { ref } }, implementerSession: "alternate-implementer" }).valid, true);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
