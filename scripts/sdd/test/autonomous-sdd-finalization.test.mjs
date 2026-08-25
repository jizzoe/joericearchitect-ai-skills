import assert from "node:assert/strict";
import test from "node:test";

import {
  claimReleaseOrder,
  classifyResourceEligibility,
  partialCleanupBlocksRelease,
  terminalConvergencePredicate
} from "../autonomous-sdd-finalization.mjs";

const head = (letter) => String(letter).repeat(40);
const delivery = (letter) => ({ merged: true, reference: "pr-1", deliveredHeadCommit: head(letter) });

const completeInput = {
  implementation: delivery("a"),
  sync: delivery("b"),
  archive: delivery("c"),
  issueClosed: true,
  projectDone: true,
  cleanupCompleted: true,
  terminal: { terminalStatus: "complete", finalHead: head("d"), cleanupDisposition: "completed" }
};

test("terminalConvergencePredicate requires every predicate", () => {
  assert.equal(terminalConvergencePredicate(completeInput).complete, true);
  const missing = terminalConvergencePredicate({ ...completeInput, issueClosed: false });
  assert.equal(missing.complete, false);
  assert.deepEqual(missing.missing, ["issue-closed"]);
  const missingCleanup = terminalConvergencePredicate({ ...completeInput, cleanupCompleted: false });
  assert.ok(missingCleanup.missing.includes("cleanup-completed"));
  const missingDelivery = terminalConvergencePredicate({ ...completeInput, implementation: undefined });
  assert.ok(missingDelivery.missing.includes("implementation-delivered"));
  const missingTerminal = terminalConvergencePredicate({ ...completeInput, terminal: { terminalStatus: "blocked" } });
  assert.ok(missingTerminal.missing.includes("terminal-complete"));
});

test("claimReleaseOrder requires cleanup -> terminal -> issue/project", () => {
  const ordered = claimReleaseOrder({ cleanupDisposition: "completed", terminalStatus: "complete", issueClosed: true, projectDone: true });
  assert.equal(ordered.release, true);
  const blocked = claimReleaseOrder({ cleanupDisposition: "partial", terminalStatus: "complete", issueClosed: true, projectDone: true });
  assert.equal(blocked.release, false);
  assert.deepEqual(blocked.missing, ["cleanup-disposition-completed"]);
  const missingProject = claimReleaseOrder({ cleanupDisposition: "completed", terminalStatus: "complete", issueClosed: true, projectDone: false });
  assert.deepEqual(missingProject.missing, ["project-done"]);
});

const eligible = { kind: "worktree", owned: true, ownershipToken: "tok", clean: true, headCommit: head("e"), deliveredHeadCommit: head("e"), deliveryCurrent: true };

test("classifyResourceEligibility marks exact clean delivered resources eligible", () => {
  assert.equal(classifyResourceEligibility({ resource: eligible }).classification, "eligible");
});

test("classifyResourceEligibility retains ineligible resources with typed reasons", () => {
  const cases = [
    [{ ...eligible, owned: false }, "unrelated-or-unowned"],
    [{ ...eligible, ownershipToken: "" }, "ownership-token-missing"],
    [{ ...eligible, legacy: true }, "legacy-unmigrated"],
    [{ ...eligible, remote: true }, "remote-resource"],
    [{ ...eligible, primary: true }, "primary-resource"],
    [{ ...eligible, locked: true }, "locked-resource"],
    [{ ...eligible, clean: false }, "dirty-resource"],
    [{ ...eligible, headCommit: undefined }, "head-missing"],
    [{ ...eligible, deliveryCurrent: false }, "delivery-evidence-stale"],
    [{ ...eligible, deliveredHeadCommit: head("f") }, "divergent-head"]
  ];
  for (const [resource, reason] of cases) {
    const result = classifyResourceEligibility({ resource });
    assert.equal(result.classification, "ineligible");
    assert.equal(result.reason, reason);
  }
  assert.equal(classifyResourceEligibility({ resource: { kind: "gist" } }).reason, "unknown-resource-kind");
});

test("partialCleanupBlocksRelease only completes when no outcome is blocked", () => {
  const complete = partialCleanupBlocksRelease({ outcomes: [{ status: "completed" }, { status: "already-completed" }] });
  assert.equal(complete.complete, true);
  const partial = partialCleanupBlocksRelease({ outcomes: [{ status: "completed" }, { status: "blocked" }] });
  assert.equal(partial.complete, false);
  assert.equal(partial.blocked.length, 1);
  assert.equal(partialCleanupBlocksRelease({ outcomes: [] }).complete, false);
});
