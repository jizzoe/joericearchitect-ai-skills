import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { buildReviewPackage, packageDigest, parseReviewFindingsPayload, validateReviewFindingsPayload, validateReviewPackage, validateReviewResult } from "../independent-review-contract.mjs";

const fixture = (name) => JSON.parse(fs.readFileSync(new URL(`../../../evals/skills/independent-review/fixtures/${name}`, import.meta.url), "utf8"));

test("one findings-payload contract accepts only the existing exact schema", () => {
  const finding = { id: "F-1", severity: "warning", evidence: "scripts/sdd/example.mjs", recommendation: "Inspect the warning." };
  const passed = { schemaVersion: 1, findings: [], status: "passed" };
  const failed = { schemaVersion: 1, findings: [finding], status: "failed" };
  for (const value of [passed, failed, { ...failed, findings: [{ ...finding, severity: "blocker" }] },
    { ...failed, findings: [{ ...finding, severity: "high" }] }, { ...failed, findings: [{ ...finding, severity: "objective-fix" }] },
    { ...failed, findings: [{ ...finding, severity: "false-positive" }] }]) {
    assert.equal(validateReviewFindingsPayload(value).valid, true, JSON.stringify(value));
  }
  const invalid = [
    null, [], {}, { ...passed, schemaVersion: 2 }, { ...passed, status: "unavailable" },
    { ...passed, extra: true }, { ...passed, findings: "none" },
    { ...failed, findings: [{ ...finding, id: "" }] },
    { ...failed, findings: [{ ...finding, severity: "critical" }] },
    { ...failed, findings: [{ ...finding, evidence: "../outside" }] },
    { ...failed, findings: [{ ...finding, evidence: "scripts/file.mjs:2" }] },
    { ...failed, findings: [{ ...finding, evidence: ".ai-independent-review-package/index.json" }] },
    { ...failed, findings: [{ ...finding, evidence: ".ai-independent-review-package.json" }] },
    { ...failed, findings: [{ ...finding, recommendation: "" }] },
    { ...failed, findings: [{ ...finding, extra: true }] }
  ];
  for (const value of invalid) assert.equal(validateReviewFindingsPayload(value).valid, false, JSON.stringify(value));

  assert.deepEqual(parseReviewFindingsPayload(JSON.stringify(passed)), { parsed: true, payload: passed });
  assert.deepEqual(parseReviewFindingsPayload(JSON.stringify({ structured_output: passed })), { parsed: true, payload: passed });
  assert.deepEqual(parseReviewFindingsPayload(JSON.stringify({ result: JSON.stringify(passed) })), { parsed: true, payload: passed });
  assert.deepEqual(parseReviewFindingsPayload(JSON.stringify({ structured_output: passed }), { allowEnvelope: false }).payload.structured_output, passed);
  assert.equal(parseReviewFindingsPayload("not-json").parsed, false);
});
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
  const lineSuffixedFinding = { id: "line-suffix", severity: "warning", evidence: "scripts/sdd/independent-review-contract.mjs:91", recommendation: "use a repository-relative file path" };
  assert.equal(validateReviewResult({ ...result, status: "failed", findings: [lineSuffixedFinding] }, { expectedPackage: pack, configuredReviewer, implementerSession: "implementer" }).issues[0].code, "independent-review-result-finding-invalid");
  assert.equal(validateReviewResult({ ...result, startedAt: result.completedAt, completedAt: result.startedAt }, { expectedPackage: pack }).issues[0].code, "independent-review-result-chronology-invalid");
});

test("passed review results cannot contain unresolved findings", () => {
  const pack = fixture("valid-package.json"); pack.manifestDigest = packageDigest(pack);
  const result = fixture("valid-result.json"); result.manifestDigest = pack.manifestDigest;
  const finding = { id: "finding", severity: "objective-fix", evidence: "scripts/sdd/independent-review-contract.mjs", recommendation: "apply the objective correction" };
  const invalid = validateReviewResult({ ...result, status: "passed", findings: [finding] }, { expectedPackage: pack });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.issues[0].code, "independent-review-result-status-finding-inconsistent");
  assert.equal(validateReviewResult({ ...result, status: "failed", findings: [finding] }, { expectedPackage: pack }).valid, true);
  assert.equal(validateReviewResult({ ...result, status: "passed", findings: [{ ...finding, severity: "warning" }] }, { expectedPackage: pack }).valid, true);
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
