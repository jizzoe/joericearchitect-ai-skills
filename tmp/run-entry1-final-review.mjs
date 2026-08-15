import { randomUUID } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";

import { createDetachedReviewView, removeDetachedReviewView } from "../scripts/sdd/detached-review-view.mjs";
import { buildReviewPackage } from "../scripts/sdd/independent-review-contract.mjs";
import { acceptReviewLauncherHostResponse, prepareReviewLauncherRecovery } from "../scripts/sdd/review-launcher-recovery.mjs";
import { executeReviewLauncherHost } from "../scripts/sdd/review-launcher-host.mjs";
import { codexAuthenticationEnvironment, runCodexDegradedReviewAdapter, sanitizedReviewEnvironment } from "../scripts/sdd/platform-review-adapters.mjs";

const repositoryPath = "/Users/joerice/git/joericearchitect/joericearchitect-ai-skills";
const baseCommit = "019ce930cbc5b8dc99fff7cd53e08738b0ac871b";
const headCommit = "49704a81ca32bca694ed1e23d8e3ba6af988f9ba";
const expiresAt = "2026-08-15T04:00:00.000Z";
const preparedPath = "/tmp/entry1-final-review-prepared.json";
const responsePath = "/tmp/entry1-final-review-response.json";
const acceptedPath = "/tmp/entry1-final-review-accepted.json";

function packageForHead() {
  const artifactPaths = execFileSync("git", ["-C", repositoryPath, "ls-tree", "-r", "--name-only", headCommit, "--", "openspec/changes/add-authorized-degraded-independent-review"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  const built = buildReviewPackage({
    repositoryPath,
    baseCommit,
    headCommit,
    artifactPaths,
    validationEvidence: [
      "node --test: 213 passed",
      "focused authorization, launcher, adapter, result-contract, and delivery gates: 35 passed",
      "openspec validate --all --strict in clean exact-head clone: 22 passed, 0 failed",
      "adapter drift, metadata, shared guardrails, artifact quality, whitespace, and secret-pattern review: passed"
    ]
  });
  if (!built.valid) throw new Error(JSON.stringify(built));
  return built.package;
}

const corrections = [
  ["517852fa79ac692f88f3f36c6feb1c121d3465a2", "1e2cf9d1b8b92dcbe51d7400adab3334ae276a9adfb2ee981b821908c5189374", "degraded-review-expiry-toctou", "scripts/sdd/execute-independent-review.mjs", "review-correction-degraded-expiry.md"],
  ["37af92279ee5e05a0da6e36223da702e50487ee4", "c57f1b69d5cb83e6faf15115a60417492eda2cb872696cdcaec3909f56bccb5e", "strict-review-inherits-credentials", "scripts/sdd/platform-review-adapters.mjs", "review-correction-reviewer-environment.md"],
  ["df15a5b37557fc88ed4902f7642bb06d1e399cf0", "d335b7a0581a035cbf7f0533fb2699fe9c1e3e70ca401f4496fa5daee865ddd6", "degraded-host-package-not-rederived", "scripts/sdd/review-launcher-host.mjs", "review-correction-host-package-rederivation.md"],
  ["e7de61cfeb358fe2743e42200dfe28edc2464f2c", "7f15d28f22f4a7d0caa49207ded970ecbe929ffa12926906bf63aec5fe02d45d", "degraded-reviewer-home-credential-access", "scripts/sdd/platform-review-adapters.mjs", "review-correction-reviewer-home-access.md"],
  ["b83e57d4cbbe47f034c59b6c13e46e418187af3b", "503f7a6cbb365d545b47915f02bec6efdd9975d3e89c17b0f0622c6ef7945478", "codex-permission-profile-serialization", "scripts/sdd/platform-review-adapters.mjs", "review-correction-permission-profile-serialization.md"],
  ["d17d2b5e488c766b96de886441cf5a28fd78315c", "c34d6df754d82a1bfd9f2a6edf882cb8d7892895f3a3b5b2b8d43ab062d90883", "review-package-write-symlink-escape", "scripts/sdd/review-launcher-host.mjs", "review-correction-package-write-symlink.md"],
  ["b04c92dd926b871671a937851104d15ec7a7ad43", "87d4c83bf503da93e2e21cdfbf75e9af4a91acbd1a18d87b2f65be701a58fc70", "review-artifact-symlink-read-escape", "scripts/sdd/independent-review-contract.mjs", "review-correction-artifact-symlink.md"],
  ["f01b627907f7ed0c769f32f29e9dab942c9b6ccf", "6842e9ca7f7892c7181b26dac3218446fb93fd1a7b82413317bc4ccd6d0b6952", "checkpoint-global-correction-cap-conflicts-with-per-signature-budget", "scripts/sdd/checkpoint.mjs", "review-correction-checkpoint-correction-budget.md"],
  ["34943ca50208d81f0b5e3fd5a856330b162ada8b", "432434b497495f8552fae867f07264ff3e2cf810b6bf5e9af6459c7bd0fe7409", "review-launcher-missing-implementer-identity", "scripts/sdd/review-launcher-recovery.mjs", "review-correction-launcher-implementer-identity.md"],
  ["db4d1c9b6557de9aea8c4025b892df0cc9b448fd", "961c4db89fce7cf51fd85c4a5fd25a609399be3f9e467d6359525321519e013f", "delivery-profile-gate-bypass", "scripts/sdd/check-operation-authorization.mjs", "review-correction-delivery-profile-gate.md"],
  ["b184f29df02cfae36070b7943553efee57f8eb13", "d700bbbafff76162b64cd6c9f14213eb0958b334fe445a532e5c52a95d8e9449", "caller-controlled-correction-counter", "scripts/sdd/check-operation-authorization.mjs", "review-correction-durable-correction-counter.md"],
  ["52a9f98e1e4facde46485b5892d2776ba05cad77", "d6e30270ce9adb497fa364b80e46441167170b98501e2f7441792394ae2f4686", "correction-budget-signature-renaming", "scripts/sdd/check-operation-authorization.mjs", "review-correction-failure-signature-binding.md"],
  ["cb2a3111a74f8c8083a1410f065b6e88f48fb77b", "8f1254fcba26334c1c6c20c98f9c2d2acbc6dfc967fdb0039e7dc4bc81028352", "correction-chain-linkage-not-validated", "scripts/sdd/checkpoint.mjs", "review-correction-chain-linkage.md"],
  ["6643a61f079023f3eb3d034fa1d4bb760136ffef", "c5e723101cca7751df2d3df090ac433394fdbcfee97ec6879acbc7dea8ea560b", "degraded-expiration-not-bounded-by-goal", "scripts/sdd/degraded-independent-review-authorization.mjs", "review-correction-goal-expiration-boundary.md"],
  ["9b81ffb14601402e8ce7befd746c2c2575af57a1", "493894d723784d59cded35697975f141e2b69208b1c4bd50b1e6a6c3bb22a4d3", "capability-ledger-omits-accepted-authenticity-limitations", "scripts/sdd/platform-review-adapters.mjs", "review-correction-capability-ledger-authenticity.md"],
  ["15e6950efe0bcfe6b8b1500e3cc58baeeb22ee54", "a3a30fe25270c48c2dca1b10285fbf0852ccb96e5df8aec1cd253573bfeb8cd3", "finding-disposition-allows-unresolved-delivery", "scripts/sdd/independent-review.mjs:128 and scripts/sdd/review-findings.mjs:12-19 allow a `passed` result containing blocker, high, or objective-fix findings to authorize delivery whenever the implementer supplies any non-human disposition. There is no severity-to-disposition compatibility check, and an `objective-fix` disposition is treated as ready before a correction changes the head and receives fresh review. This conflicts with openspec/changes/add-authorized-degraded-independent-review/specs/bounded-autonomous-execution/spec.md:68, which requires unresolved objective fixes to stop delivery.", "review-correction-unresolved-disposition-gate.md", "degraded-8bab692b-d15d-4beb-babd-59546bfcab90"],
  [headCommit, "caec49fe6db2b791cfdd0332d56d060329659a53c23a2315e2f1a0dab6bfa10c", "failure-signature-delimiter-collision", "scripts/sdd/correction-chain.mjs", "review-correction-failure-signature-delimiter.md", "degraded-f7e6c7d3-9040-4b72-bdc6-2b15b2d27d66"]
];

function correctionRecords() {
  let previousHead = "dbe7b283fd788e85f131c8dab46093d5fb8de4fd";
  let previousManifestDigest = "8441e4bda08e515eb6a24d590ce39dbfca4daaeedf46abdc7ecee99fd75f35e5";
  return corrections.map(([head, manifestDigest, findingId, sourceEvidence, evidence, reviewRecordId], index) => {
    const failureSource = { kind: "independent-review", reviewRecordId: reviewRecordId ?? `entry1-failed-review-${index + 1}`, findingId, severity: "high", evidence: sourceEvidence, transition: "merge-pr" };
    const item = {
      id: `entry1-correction-${index + 1}`,
      change: "add-authorized-degraded-independent-review",
      attempt: index + 1,
      failureSource,
      failureSignature: `independent-review/${findingId}/${sourceEvidence}/merge-pr`,
      classification: "objective-fix",
      behaviorPreserving: true,
      current: true,
      ancestryVerified: true,
      evidenceReference: `openspec/changes/add-authorized-degraded-independent-review/evidence/${evidence}`,
      baseCommit,
      previousHead,
      previousManifestDigest,
      headCommit: head,
      manifestDigest
    };
    previousHead = head;
    previousManifestDigest = manifestDigest;
    return item;
  });
}

function strictUnavailable(reviewPackage, unavailableCode) {
  const instant = new Date().toISOString();
  const executionId = randomUUID();
  return {
    schemaVersion: 1,
    reviewRecordId: `strict-unavailable-${executionId}`,
    executionId,
    reviewer: { type: "codex", identity: "entry1-final-strict-reviewer", adapter: "codex" },
    attestation: { ref: "attestations/codex-read-only-v1.json", nonInteractive: false, isolatedContext: false, freshContext: false, readOnly: false },
    assuranceLevel: "strict-isolated",
    baseCommit,
    headCommit,
    manifestDigest: reviewPackage.manifestDigest,
    startedAt: instant,
    completedAt: new Date().toISOString(),
    findings: [],
    status: "unavailable",
    unavailableCode
  };
}

function authorization(reviewPackage) {
  const derivedCorrections = correctionRecords();
  const shared = { enabled: true, change: "add-authorized-degraded-independent-review", transitions: ["merge-pr"], expiresAt };
  return {
    expiresAt,
    implementerSession: "entry1-implementer-session",
    degradedIndependentReview: {
      ...shared,
      riskReason: "Owner accepts explicitly bounded degraded review as a best-effort independent quality check after strict unavailability; ordinary launcher evidence and basename identity are not security-verifiable.",
      fallbackBoundary: "fresh-separated-reviewer-only",
      baseCommit,
      headCommit: "dbe7b283fd788e85f131c8dab46093d5fb8de4fd",
      manifestDigest: "8441e4bda08e515eb6a24d590ce39dbfca4daaeedf46abdc7ecee99fd75f35e5",
      allowDerivedObjectiveCorrections: true,
      derivedCorrections
    },
    reviewLauncher: {
      ...shared,
      boundary: "detached-exact-head-inner-read-only",
      launcherId: "codex-review-launcher",
      baseCommit,
      headCommit,
      manifestDigest: reviewPackage.manifestDigest
    }
  };
}

function prepare() {
  const reviewPackage = packageForHead();
  if (reviewPackage.manifestDigest !== corrections.at(-1)[1]) throw new Error("final manifest mismatch");
  const strictAttempt = createDetachedReviewView({ repositoryPath, headCommit });
  if (strictAttempt.available) {
    removeDetachedReviewView(strictAttempt.view);
    throw new Error("strict detached view unexpectedly available; invoke the strict adapter instead of degraded recovery");
  }
  const strictResult = strictUnavailable(reviewPackage, strictAttempt.code);
  const request = {
    failureCode: strictResult.unavailableCode,
    authorization: authorization(reviewPackage),
    selectedEntry: "add-authorized-degraded-independent-review",
    transition: "merge-pr",
    reviewPackage,
    strictResult,
    launcher: { id: "codex-review-launcher", kind: "codex-detached-read-only-v1", hostScript: "scripts/sdd/review-launcher-host.mjs", enabled: true, executable: "codex", detachedView: true, innerReadOnlySandbox: true, ephemeral: true, sealedPackageOnly: true, credentialScrubbed: true, nonInteractive: true },
    runtime: { permittedReviewLaunchers: ["codex-review-launcher"] },
    repositoryPath,
    reviewer: { type: "codex-degraded", identity: "entry1-final-degraded-reviewer", attestation: { ref: "accepted-degraded-codex-v1" } },
    attestationRef: "accepted-degraded-codex-v1",
    correctionAttempts: 17,
    derivedCorrection: true,
    correctionEvidence: correctionRecords().at(-1)
  };
  const prepared = prepareReviewLauncherRecovery(request);
  fs.writeFileSync(preparedPath, `${JSON.stringify(prepared, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ strictAttempt, manifestDigest: reviewPackage.manifestDigest, artifactCount: reviewPackage.artifacts.length, prepared: { allowed: prepared.allowed, code: prepared.code, requestDigest: prepared.hostRequest?.requestDigest } }, null, 2));
}

function host() {
  const prepared = JSON.parse(fs.readFileSync(preparedPath, "utf8"));
  const response = executeReviewLauncherHost(prepared.hostRequest);
  fs.writeFileSync(responsePath, `${JSON.stringify(response, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ allowed: response.allowed, status: response.status, code: response.code, hostExecutionId: response.hostExecutionId, reviewRecordId: response.result?.reviewRecordId, findings: response.result?.findings ?? [], cleanup: response.cleanup }, null, 2));
  if (!response.allowed) process.exitCode = 1;
}

function hostDebug() {
  const prepared = JSON.parse(fs.readFileSync(preparedPath, "utf8"));
  let execution = null;
  const response = executeReviewLauncherHost(prepared.hostRequest, {
    invoke: (request) => runCodexDegradedReviewAdapter({
      ...request,
      run: (executable, args, options) => {
        const result = spawnSync(executable, args, options);
        execution = { status: result.status, signal: result.signal ?? null, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
        return result;
      }
    })
  });
  fs.writeFileSync(responsePath, `${JSON.stringify(response, null, 2)}\n`, { mode: 0o600 });
  const executionSummary = response.allowed
    ? { status: execution?.status, signal: execution?.signal ?? null }
    : execution;
  console.log(JSON.stringify({ response: { allowed: response.allowed, status: response.status, code: response.code, detail: response.detail, hostExecutionId: response.hostExecutionId, findings: response.result?.findings ?? [] }, execution: executionSummary }, null, 2));
  if (!response.allowed) process.exitCode = 1;
}

function accept() {
  const prepared = JSON.parse(fs.readFileSync(preparedPath, "utf8"));
  const response = JSON.parse(fs.readFileSync(responsePath, "utf8"));
  const runtimeLaunchEvidence = {
    attestedBy: "trusted-runtime",
    outsideManagedSandbox: true,
    executionRef: `managed-runtime:${response.hostExecutionId}`,
    launcherId: prepared.expectedRecovery.launcherId,
    launcherKind: prepared.expectedRecovery.launcherKind,
    hostScript: prepared.expectedRecovery.hostScript,
    requestDigest: prepared.hostRequest.requestDigest,
    hostExecutionId: response.hostExecutionId
  };
  const accepted = acceptReviewLauncherHostResponse({ prepared, response, runtimeLaunchEvidence });
  fs.writeFileSync(acceptedPath, `${JSON.stringify(accepted, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ allowed: accepted.allowed, status: accepted.status, code: accepted.code, reviewRecordId: accepted.result?.reviewRecordId, findings: accepted.result?.findings ?? [], assuranceLevel: accepted.result?.assuranceLevel }, null, 2));
  if (!accepted.allowed || accepted.status !== "passed") process.exitCode = 1;
}

function probe(useSanitizedEnvironment = false) {
  const probeRoot = fs.mkdtempSync("/tmp/codex-sealed-review-probe.");
  const run = spawnSync("codex", [
    "exec",
    "--strict-config",
    "--config", "default_permissions=\"sealed-review\"",
    "--config", "permissions.sealed-review={filesystem={\":minimal\"=\"read\",\":workspace_roots\"={\".\"=\"read\"}},network={enabled=false}}",
    "--config", "shell_environment_policy.inherit=\"none\"",
    "--ephemeral",
    "--ignore-user-config",
    "--ignore-rules",
    "--skip-git-repo-check",
    "--cd", probeRoot,
    "Do not use tools. Reply exactly OK."
  ], {
    cwd: probeRoot,
    encoding: "utf8",
    timeout: 120_000,
    env: useSanitizedEnvironment
      ? sanitizedReviewEnvironment(process.env, { ...codexAuthenticationEnvironment(), NO_COLOR: "1", GITHUB_TOKEN: "", GH_TOKEN: "", SSH_AUTH_SOCK: "", AWS_ACCESS_KEY_ID: "", AWS_SECRET_ACCESS_KEY: "", AWS_SESSION_TOKEN: "", NPM_TOKEN: "" })
      : process.env
  });
  console.log(JSON.stringify({ mode: useSanitizedEnvironment ? "sanitized" : "ambient", status: run.status, signal: run.signal ?? null, stdout: run.stdout ?? "", stderr: run.stderr ?? "" }, null, 2));
  if (run.status !== 0) process.exitCode = 1;
}

const mode = process.argv[2];
if (mode === "prepare") prepare();
else if (mode === "host") host();
else if (mode === "host-debug") hostDebug();
else if (mode === "accept") accept();
else if (mode === "probe") probe(true);
else if (mode === "probe-ambient") probe();
else if (mode === "probe-sanitized") probe(true);
else throw new Error("expected prepare, host, host-debug, accept, probe, probe-ambient, or probe-sanitized");
