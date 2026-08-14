import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const commit = (value) => typeof value === "string" && /^[0-9a-f]{40}$/.test(value);
const text = (value) => typeof value === "string" && value.trim().length > 0;
const date = (value) => text(value) && !Number.isNaN(Date.parse(value));
const safePath = (value) => {
  if (!text(value) || /[\\\x00-\x1f\x7f]/.test(value) || path.posix.isAbsolute(value) || path.win32.isAbsolute(value)) return false;
  return value.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
};
const failure = (code, detail) => ({ valid: false, issues: [{ code, ...(detail ? { detail } : {}) }] });
const secretLike = /(gh[pousr]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{16,}|-----BEGIN (?:[A-Z ]+)?PRIVATE KEY-----|Bearer\s+[A-Za-z0-9._-]{12,})/i;
const degradedBoundary = "fresh-separated-reviewer-only";
const unresolvedSeverities = new Set(["blocker", "high", "objective-fix"]);
const protectedCapabilities = ["workspaceWrite", "gitWrite", "githubMutation", "credentialAccess", "authenticatedNetwork", "externalSend", "deployment", "release", "delegatedMutation"];
const degradedAuthenticityLimitations = ["authenticatedParentLaunchEvidence", "hostPinnedReviewerExecutableIdentity"];

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

export function packageDigest(input) {
  const { manifestDigest, ...unsigned } = input ?? {};
  return sha(canonicalJson(unsigned));
}

export function validateReviewPackage(value) {
  if (!value || value.schemaVersion !== 1 || !commit(value.baseCommit) || !commit(value.headCommit) || !text(value.diff) ||
      !Array.isArray(value.validationEvidence) || !value.validationEvidence.length || !value.validationEvidence.every(text) ||
      !Array.isArray(value.artifacts) || !value.artifacts.length || !text(value.manifestDigest)) return failure("independent-review-package-malformed");
  if (!value.artifacts.every((item) => safePath(item?.path) && /^[0-9a-f]{64}$/.test(item.sha256 ?? "") && Number.isInteger(item.bytes) && item.bytes >= 0)) return failure("independent-review-package-artifact-invalid");
  if (secretLike.test(value.diff) || value.validationEvidence.some((item) => secretLike.test(item))) return failure("independent-review-package-sensitive-content");
  if (value.manifestDigest !== packageDigest(value)) return failure("independent-review-package-digest-mismatch");
  return { valid: true, issues: [] };
}

export function buildReviewPackage({ repositoryPath, baseCommit, headCommit, artifactPaths, validationEvidence }) {
  if (!text(repositoryPath) || !Array.isArray(artifactPaths) || !artifactPaths.length || !Array.isArray(validationEvidence) || !validationEvidence.length) return failure("independent-review-package-input-incomplete");
  try {
    const resolve = (ref) => execFileSync("git", ["-C", repositoryPath, "rev-parse", "--verify", `${ref}^{commit}`], { encoding: "utf8" }).trim();
    const base = resolve(baseCommit); const head = resolve(headCommit);
    if (!commit(base) || !commit(head) || base !== baseCommit || head !== headCommit) return failure("independent-review-package-commit-not-canonical");
    const diff = execFileSync("git", ["-C", repositoryPath, "diff", "--no-ext-diff", "--no-textconv", "--binary", base, head], { encoding: "utf8" });
    const artifacts = artifactPaths.map((relative) => {
      if (!safePath(relative)) throw new Error("unsafe-artifact-path");
      const listing = execFileSync("git", ["-C", repositoryPath, "ls-tree", "-z", head, "--", relative], { encoding: "buffer" });
      const match = listing.toString("utf8").match(/^([0-9]{6}) (blob|tree|commit) ([0-9a-f]{40})\t([^\0]+)\0$/);
      if (!match || !["100644", "100755"].includes(match[1]) || match[2] !== "blob" || match[4] !== relative) {
        throw new Error("independent-review-package-artifact-not-regular");
      }
      const body = execFileSync("git", ["-C", repositoryPath, "cat-file", "blob", match[3]], { encoding: "buffer" });
      if (secretLike.test(body.toString("utf8"))) throw new Error("independent-review-package-sensitive-content");
      return { path: relative, sha256: sha(body), bytes: body.length };
    });
    const draft = { schemaVersion: 1, baseCommit: base, headCommit: head, diff, artifacts, validationEvidence: [...validationEvidence] };
    const result = { ...draft, manifestDigest: packageDigest(draft) };
    return { valid: true, package: result };
  } catch (error) { return failure(["unsafe-artifact-path", "independent-review-package-artifact-not-regular", "independent-review-package-sensitive-content"].includes(error.message) ? error.message : "independent-review-package-build-failed"); }
}

function validLedger(value) {
  if (!value || !["enforced", "unavailable", "instructionConstrained"].every((key) => Array.isArray(value[key]) && value[key].every(text))) return false;
  const entries = Object.values(value).flat();
  return new Set(entries).size === entries.length && protectedCapabilities.every((capability) => entries.includes(capability)) &&
    degradedAuthenticityLimitations.every((capability) => value.unavailable.includes(capability));
}

function validDegradedBindings(value, expectedPackage) {
  const strict = value.strictUnavailable;
  const authorization = value.degradedAuthorization;
  if (!validLedger(value.capabilityLedger) || !strict || strict.status !== "unavailable" || strict.baseCommit !== value.baseCommit || strict.headCommit !== value.headCommit || strict.manifestDigest !== value.manifestDigest || !text(strict.reviewRecordId) || !text(strict.executionId) || !text(strict.adapter) || !text(strict.unavailableCode)) return false;
  if (!authorization || !text(authorization.change) || authorization.transition !== "merge-pr" || authorization.fallbackBoundary !== degradedBoundary || !text(authorization.riskReason) || !date(authorization.expiresAt)) return false;
  if (expectedPackage && (strict.baseCommit !== expectedPackage.baseCommit || strict.headCommit !== expectedPackage.headCommit || strict.manifestDigest !== expectedPackage.manifestDigest)) return false;
  return true;
}

export function validateReviewResult(value, { expectedPackage, configuredReviewer, implementerSession, seenRecordIds = new Set() } = {}) {
  if (!value || value.schemaVersion !== 1 || !text(value.reviewRecordId) || !text(value.executionId) || !text(value.reviewer?.type) || !text(value.reviewer?.identity) || !text(value.reviewer?.adapter) || !text(value.attestation?.ref) || typeof value.attestation?.nonInteractive !== "boolean" || typeof value.attestation?.isolatedContext !== "boolean" || typeof value.attestation?.freshContext !== "boolean" || typeof value.attestation?.readOnly !== "boolean" || !["strict-isolated", "authorized-degraded"].includes(value.assuranceLevel) || !commit(value.baseCommit) || !commit(value.headCommit) || !text(value.manifestDigest) || !date(value.startedAt) || !date(value.completedAt) || !Array.isArray(value.findings) || !["passed", "failed", "unavailable"].includes(value.status)) return failure("independent-review-result-malformed");
  if (value.status === "unavailable" && !text(value.unavailableCode)) return failure("independent-review-result-unavailable-code-missing");
  if (value.assuranceLevel === "strict-isolated" && value.status !== "unavailable" && (value.attestation.nonInteractive !== true || value.attestation.isolatedContext !== true || value.attestation.freshContext !== true || value.attestation.readOnly !== true)) return failure("independent-review-result-not-isolated-read-only");
  if (value.assuranceLevel === "strict-isolated" && value.status === "unavailable" && (value.attestation.nonInteractive !== false || value.attestation.isolatedContext !== false || value.attestation.freshContext !== false || value.attestation.readOnly !== false)) return failure("independent-review-result-unavailable-claims-isolation");
  if (value.assuranceLevel === "authorized-degraded" && (value.attestation.nonInteractive !== true || value.attestation.freshContext !== true || value.attestation.isolatedContext === true || value.attestation.readOnly === true || !validDegradedBindings(value, expectedPackage))) return failure("independent-review-result-degraded-evidence-invalid");
  if (seenRecordIds.has(value.reviewRecordId)) return failure("independent-review-result-duplicate-record");
  if (value.reviewer.identity === implementerSession) return failure("independent-review-self-review");
  if (configuredReviewer && (value.reviewer.type !== configuredReviewer.type || value.reviewer.identity !== configuredReviewer.identity || value.attestation.ref !== configuredReviewer.attestation?.ref)) return failure("independent-review-result-attestation-mismatch");
  if (expectedPackage && (value.baseCommit !== expectedPackage.baseCommit || value.headCommit !== expectedPackage.headCommit || value.manifestDigest !== expectedPackage.manifestDigest)) return failure("independent-review-result-stale-input");
  if (!value.findings.every((finding) => text(finding?.id) && ["blocker", "high", "objective-fix", "warning", "false-positive"].includes(finding.severity) && safePath(finding.evidence) && text(finding.recommendation))) return failure("independent-review-result-finding-invalid");
  if (Date.parse(value.completedAt) < Date.parse(value.startedAt)) return failure("independent-review-result-chronology-invalid");
  if (value.status === "passed" && value.findings.some((finding) => unresolvedSeverities.has(finding.severity))) return failure("independent-review-result-status-finding-inconsistent");
  return { valid: true, issues: [] };
}
