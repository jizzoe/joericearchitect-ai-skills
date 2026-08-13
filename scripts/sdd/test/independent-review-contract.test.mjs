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
  fs.writeFileSync(path.join(root, "openspec/changes/example/proposal.md"), "uncommitted-worktree-content\n");
  const result = buildReviewPackage({ repositoryPath: root, baseCommit: base, headCommit: head, artifactPaths: ["openspec/changes/example/proposal.md"], validationEvidence: ["tests"] });
  assert.equal(result.valid, true, JSON.stringify(result));
  assert.equal(validateReviewPackage(result.package).valid, true);
  assert.equal(result.package.artifacts[0].sha256, "27dd8ed44a83ff94d557f9fd0412ed5a8cbca69ea04922d88c01184a07300a5a");
});

test("package builder rejects a committed artifact symlink without reading its target", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "independent-review-symlink-"));
  const canaryPath = path.join(os.tmpdir(), `independent-review-canary-${process.pid}-${Date.now()}`);
  const run = (...args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
  try {
    run("init"); run("config", "user.email", "fixture@example.invalid"); run("config", "user.name", "Fixture");
    fs.writeFileSync(path.join(root, "regular.md"), "base\n"); run("add", "."); run("commit", "-m", "base");
    const base = run("rev-parse", "HEAD").trim();
    fs.writeFileSync(canaryPath, "outside-canary\n");
    try {
      fs.symlinkSync(canaryPath, path.join(root, "linked-artifact.md"));
    } catch (error) {
      if (["EPERM", "EACCES"].includes(error?.code)) return t.skip("filesystem does not permit symlink fixtures");
      throw error;
    }
    run("add", "linked-artifact.md"); run("commit", "-m", "head");
    const head = run("rev-parse", "HEAD").trim();
    const result = buildReviewPackage({ repositoryPath: root, baseCommit: base, headCommit: head, artifactPaths: ["linked-artifact.md"], validationEvidence: ["tests"] });
    assert.equal(result.valid, false);
    assert.equal(result.issues[0].code, "independent-review-package-artifact-not-regular");
    assert.equal(fs.readFileSync(canaryPath, "utf8"), "outside-canary\n");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(canaryPath, { force: true });
  }
});
