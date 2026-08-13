import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { buildReviewPackage, packageDigest, validateReviewPackage, validateReviewResult } from "../independent-review-contract.mjs";

const fixture = (name) => JSON.parse(fs.readFileSync(new URL(`../../../evals/skills/independent-review/fixtures/${name}`, import.meta.url), "utf8"));
test("review package requires canonical immutable fields and digest", () => {
  const value = fixture("valid-package.json"); value.manifestDigest = packageDigest(value);
  assert.equal(validateReviewPackage(value).valid, true);
  assert.equal(validateReviewPackage({ ...value, manifestDigest: "bad" }).valid, false);
  assert.equal(validateReviewPackage({ ...value, artifacts: [{ ...value.artifacts[0], path: "../secret" }] }).valid, false);
});
test("review result binds a fresh configured reviewer to one package", () => {
  const pack = fixture("valid-package.json"); pack.manifestDigest = packageDigest(pack);
  const result = fixture("valid-result.json"); result.manifestDigest = pack.manifestDigest;
  const configuredReviewer = { type: "fixture", identity: "fresh-reviewer", attestation: { ref: "fixture-attestation" } };
  assert.equal(validateReviewResult(result, { expectedPackage: pack, configuredReviewer, implementerSession: "implementer" }).valid, true);
  assert.equal(validateReviewResult({ ...result, unavailableCode: undefined }, { expectedPackage: pack, configuredReviewer, implementerSession: "implementer" }).valid, true);
  assert.equal(validateReviewResult({ ...result, reviewer: { ...result.reviewer, identity: "implementer" } }, { expectedPackage: pack, configuredReviewer, implementerSession: "implementer" }).valid, false);
  assert.equal(validateReviewResult({ ...result, headCommit: "cccccccccccccccccccccccccccccccccccccccc" }, { expectedPackage: pack, configuredReviewer, implementerSession: "implementer" }).valid, false);
});

test("strict unavailable results cannot claim successful isolation controls", () => {
  const reviewPackage = fixture("valid-package.json"); reviewPackage.manifestDigest = packageDigest(reviewPackage);
  const result = fixture("valid-result.json");
  Object.assign(result, { manifestDigest: reviewPackage.manifestDigest, status: "unavailable", unavailableCode: "runtime-unavailable", attestation: { ...result.attestation, nonInteractive: false, isolatedContext: false, freshContext: false, readOnly: false } });
  assert.equal(validateReviewResult(result, { expectedPackage: reviewPackage }).valid, true);
  for (const field of ["nonInteractive", "isolatedContext", "freshContext", "readOnly"]) {
    const invalid = { ...result, attestation: { ...result.attestation, [field]: true } };
    assert.equal(validateReviewResult(invalid, { expectedPackage: reviewPackage }).issues[0].code, "independent-review-result-unavailable-claims-isolation");
  }
});
test("package builder rederives a disposable repository's exact diff", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "independent-review-"));
  const run = (...args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
  run("init"); run("config", "user.email", "fixture@example.invalid"); run("config", "user.name", "Fixture");
  fs.mkdirSync(path.join(root, "openspec/changes/example"), { recursive: true });
  fs.writeFileSync(path.join(root, "openspec/changes/example/proposal.md"), "one\n"); run("add", "."); run("commit", "-m", "base");
  const base = run("rev-parse", "HEAD").trim();
  fs.writeFileSync(path.join(root, "openspec/changes/example/proposal.md"), "two\n"); run("add", "."); run("commit", "-m", "head");
  const head = run("rev-parse", "HEAD").trim();
  const result = buildReviewPackage({ repositoryPath: root, baseCommit: base, headCommit: head, artifactPaths: ["openspec/changes/example/proposal.md"], validationEvidence: ["tests"] });
  assert.equal(result.valid, true, JSON.stringify(result));
  assert.equal(validateReviewPackage(result.package).valid, true);
});
