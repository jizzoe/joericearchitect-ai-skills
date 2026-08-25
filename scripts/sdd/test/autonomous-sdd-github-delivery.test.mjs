import assert from "node:assert/strict";
import test from "node:test";

import {
  createHostOperationEnvelope,
  createHostResultReceipt,
  hostOperationEnvelopeDigest,
  revalidateControllerAdvance,
  validateHostOperationEnvelope,
  validateHostResultReceipt
} from "../autonomous-sdd-github-envelope.mjs";
import {
  assertOwnershipScope,
  ownershipScopeFor,
  planDeliveryStatus,
  planExactHeadCheck,
  planIssueClose,
  planIssueCreateOrReuse,
  planMerge,
  planPrCreateOrUpdate,
  planProjectSetStatus,
  planTopicBranchCreate,
  reconcileTransition,
  transitionPreconditionDigest
} from "../autonomous-sdd-github-transitions.mjs";
import {
  planBranchRetentionRestoration,
  preflightMergePolicy,
  validateBranchRetentionReceipt
} from "../autonomous-sdd-github-merge-policy.mjs";

const expiresAt = "2027-01-01T00:00:00.000Z";
const now = "2026-08-24T12:00:00.000Z";
const hex = (letter) => String(letter).repeat(64);

function makeEnvelope(overrides = {}) {
  return createHostOperationEnvelope({
    operation: "merge",
    repository: "jizzoe/sdd-fixture-main",
    targetIdentities: ["issue:42", "pr:7"],
    payloadDigest: hex("a"),
    preconditionDigest: hex("b"),
    idempotencyKey: "merge-42",
    ownershipScope: ["branch"],
    expiresAt,
    ...overrides
  });
}

test("envelope is non-secret and carries an exact digest", () => {
  const { valid, envelope, envelopeDigest } = makeEnvelope();
  assert.equal(valid, true);
  assert.equal(envelope.envelopeDigest, envelopeDigest);
  assert.equal(hostOperationEnvelopeDigest(envelope), envelopeDigest);
  assert.equal("token" in envelope, false);
  assert.equal("credential" in envelope, false);
});

test("expired, malformed, or unknown envelopes are rejected", () => {
  const { envelope } = makeEnvelope();
  assert.equal(validateHostOperationEnvelope(envelope, now), true);
  assert.equal(validateHostOperationEnvelope(envelope, expiresAt), false);
  assert.equal(validateHostOperationEnvelope(envelope, "not-a-time"), false);
  assert.equal(makeEnvelope({ operation: "deploy" }).valid, false);
  assert.equal(makeEnvelope({ repository: "bad" }).valid, false);
  assert.equal(makeEnvelope({ payloadDigest: "xyz" }).valid, false);
});

test("result receipt matches the envelope and rejects mismatch", () => {
  const { envelope } = makeEnvelope();
  const made = createHostResultReceipt({ envelope, outcome: "success", observedAt: now });
  assert.equal(made.valid, true);
  assert.equal(validateHostResultReceipt(made.receipt, envelope), true);
  const other = makeEnvelope({ repository: "jizzoe/other" });
  assert.equal(validateHostResultReceipt(made.receipt, other.envelope), false);
  assert.equal(validateHostResultReceipt({ ...made.receipt, operation: "issue-close" }, envelope), false);
});

test("controller revalidates receipt and live state before advancing", () => {
  const { envelope } = makeEnvelope();
  const success = createHostResultReceipt({ envelope, outcome: "success", observedAt: now }).receipt;
  assert.equal(revalidateControllerAdvance({ receipt: success, envelope, liveState: { state: "confirms" }, now }).decision, "advance");
  assert.equal(revalidateControllerAdvance({ receipt: success, envelope, liveState: { state: "conflicts" }, now }).decision, "reconcile");
  assert.equal(revalidateControllerAdvance({ receipt: success, envelope, liveState: { state: "unknown" }, now }).decision, "in-doubt");
  const denied = createHostResultReceipt({ envelope, outcome: "denied", observedAt: now }).receipt;
  assert.equal(revalidateControllerAdvance({ receipt: denied, envelope, liveState: { state: "confirms" }, now }).decision, "paused");
  const unknown = createHostResultReceipt({ envelope, outcome: "unknown", observedAt: now }).receipt;
  assert.equal(revalidateControllerAdvance({ receipt: unknown, envelope, liveState: { state: "confirms" }, now }).decision, "in-doubt");
  assert.equal(revalidateControllerAdvance({ receipt: success, envelope, liveState: { state: "confirms" }, now: expiresAt }).decision, "paused");
});

test("ownership scope only allows managed fields", () => {
  assert.deepEqual(ownershipScopeFor("issue"), ["title", "managedBlock", "labels"]);
  assert.equal(assertOwnershipScope({ objectKind: "issue", fields: ["title", "labels"] }).allowed, true);
  const violated = assertOwnershipScope({ objectKind: "issue", fields: ["title", "assignees"] });
  assert.equal(violated.allowed, false);
  assert.equal(violated.issues[0].code, "ownership-scope-field-not-managed");
  assert.equal(assertOwnershipScope({ objectKind: "gist", fields: [] }).classification, "invalid-object-kind");
});

test("issue adapter reuses exact duplicate and rejects bad repository", () => {
  const plan = planIssueCreateOrReuse({ repository: "jizzoe/sdd-fixture-main", title: "X", existingIssues: [{ title: "X", number: 1 }] });
  assert.equal(plan.action, "reuse");
  assert.equal(planIssueCreateOrReuse({ repository: "jizzoe/sdd-fixture-main", title: "New" }).action, "create");
  assert.equal(planIssueCreateOrReuse({ repository: "not-a-repo", title: "X" }).classification, "rejected");
});

test("project and delivery status adapters converge idempotently", () => {
  const field = { name: "Status", options: ["Ready", "In Progress", "Done"] };
  assert.equal(planProjectSetStatus({ statusField: field, currentStatus: "Done", requestedStatus: "Done" }).action, "noop");
  assert.equal(planProjectSetStatus({ statusField: field, currentStatus: "Ready", requestedStatus: "Done" }).action, "set-status");
  assert.equal(planProjectSetStatus({ statusField: field, requestedStatus: "Nope" }).error, "unknown-project-status");
  assert.equal(planDeliveryStatus({ currentStatus: "Done", targetStatus: "Done", allowedOptions: ["Done"] }).action, "noop");
  assert.equal(planDeliveryStatus({ currentStatus: "Ready", targetStatus: "Done", allowedOptions: ["Done"] }).action, "set-status");
});

test("branch, PR, and exact-head adapters reject divergent or wrong targets", () => {
  const head = hex("c");
  const repo = "jizzoe/sdd-fixture-main";
  assert.equal(planTopicBranchCreate({ repository: repo, branch: "topic", expectedHead: head }).action, "create");
  assert.equal(planTopicBranchCreate({ repository: repo, branch: "topic", expectedHead: head, existingBranch: { head } }).action, "noop");
  assert.equal(planTopicBranchCreate({ repository: repo, branch: "topic", expectedHead: head, existingBranch: { head: hex("z") } }).error, "divergent-branch-head");
  assert.equal(planPrCreateOrUpdate({ headBranch: "topic", baseBranch: "main", title: "t" }).action, "create");
  assert.equal(planPrCreateOrUpdate({ existingPr: { headBranch: "topic", baseBranch: "main" }, headBranch: "topic", baseBranch: "main" }).action, "reuse");
  assert.equal(planPrCreateOrUpdate({ existingPr: { headBranch: "other", baseBranch: "main" }, headBranch: "topic", baseBranch: "main" }).error, "pr-branch-mismatch");
  assert.equal(planExactHeadCheck({ expectedHead: head, observedHead: head }).action, "pass");
  assert.equal(planExactHeadCheck({ expectedHead: head, observedHead: hex("z") }).error, "head-mismatch");
});

test("merge and issue-close adapters are guarded and idempotent", () => {
  assert.equal(planMerge({ mergeable: true }).action, "merge");
  assert.equal(planMerge({ mergeable: false }).error, "not-mergeable");
  assert.equal(planMerge({ mergeable: true, retentionRequired: true, autoDeleteHeadBranches: true, retentionAuthorized: false }).error, "retention-not-authorized");
  assert.equal(planIssueClose({ observedIssueState: "CLOSED" }).action, "noop");
  assert.equal(planIssueClose({ observedIssueState: "OPEN" }).action, "close");
});

test("observe-before-retry reconciles without a duplicate", () => {
  const plan = planIssueCreateOrReuse({ repository: "jizzoe/sdd-fixture-main", title: "X" });
  assert.equal(reconcileTransition({ plan }).action, "apply");
  assert.equal(reconcileTransition({ plan, observedState: { status: "matches" } }).action, "noop");
  assert.equal(reconcileTransition({ plan, observedState: { status: "diverges" } }).action, "conflict");
  assert.equal(reconcileTransition({ plan, observedState: { status: "unknown" } }).action, "in-doubt");
  assert.equal(reconcileTransition({ plan: { ok: false, error: "x" } }).action, "paused");
});

test("merge preflight and branch retention restore only the exact head without force", () => {
  assert.equal(preflightMergePolicy({ observedMergeStrategy: "squash", autoDeleteHeadBranches: true, requiresBranchRetention: true }).retention, "restore-exact-head");
  assert.equal(preflightMergePolicy({ autoDeleteHeadBranches: false, requiresBranchRetention: true }).retention, "verify-retained");
  assert.equal(preflightMergePolicy({}).retention, "none");
  const head = hex("d");
  const restore = planBranchRetentionRestoration({ expectedHead: head, policy: { retention: "restore-exact-head" } });
  assert.equal(restore.action, "restore");
  assert.equal(restore.force, false);
  assert.equal(restore.head, head);
  assert.equal(planBranchRetentionRestoration({ expectedHead: head, observedRef: { head }, policy: { retention: "restore-exact-head" } }).action, "noop");
  assert.equal(planBranchRetentionRestoration({ expectedHead: head, observedRef: { head: hex("z") }, policy: { retention: "restore-exact-head" } }).error, "divergent-observed-ref");
  assert.equal(planBranchRetentionRestoration({ expectedHead: head, policy: { retention: "none" } }).action, "noop");
  assert.equal(validateBranchRetentionReceipt({ receipt: { restoredHead: head, branch: "topic", force: false }, expectedHead: head }).valid, true);
  assert.equal(validateBranchRetentionReceipt({ receipt: { restoredHead: head, branch: "topic", force: true }, expectedHead: head }).reason, "branch-retention-force-forbidden");
  assert.equal(validateBranchRetentionReceipt({ receipt: { restoredHead: hex("z"), branch: "topic", force: false }, expectedHead: head }).reason, "branch-retention-head-mismatch");
});

test("transition precondition digest is deterministic and credential-free", () => {
  const a = transitionPreconditionDigest({ operation: "merge", repository: "jizzoe/sdd-fixture-main", targets: ["pr:7", "issue:42"] });
  const b = transitionPreconditionDigest({ operation: "merge", repository: "jizzoe/sdd-fixture-main", targets: ["issue:42", "pr:7"] });
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{64}$/);
});
