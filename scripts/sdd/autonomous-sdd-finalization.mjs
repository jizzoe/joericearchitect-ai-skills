export const resourceKinds = Object.freeze(["worktree", "branch"]);

const fullCommit = (value) => typeof value === "string" && /^[0-9a-f]{40}$/i.test(value);
const text = (value) => typeof value === "string" && value.trim().length > 0;

function delivery(item) {
  return Boolean(item && item.merged === true && text(item.reference) && fullCommit(item.deliveredHeadCommit));
}

export function terminalConvergencePredicate({ implementation, sync, archive, issueClosed, projectDone, cleanupCompleted, terminal } = {}) {
  const missing = [];
  if (!delivery(implementation)) missing.push("implementation-delivered");
  if (!delivery(sync)) missing.push("sync-delivered");
  if (!delivery(archive)) missing.push("archive-delivered");
  if (issueClosed !== true) missing.push("issue-closed");
  if (projectDone !== true) missing.push("project-done");
  if (cleanupCompleted !== true) missing.push("cleanup-completed");
  if (terminal?.terminalStatus !== "complete") {
    missing.push("terminal-complete");
  } else {
    if (!fullCommit(terminal.finalHead)) missing.push("terminal-final-head");
    if (terminal.cleanupDisposition !== "completed") missing.push("terminal-cleanup-disposition");
  }
  return { complete: missing.length === 0, missing };
}

export function claimReleaseOrder({ cleanupDisposition, terminalStatus, issueClosed, projectDone } = {}) {
  const missing = [];
  if (cleanupDisposition !== "completed") missing.push("cleanup-disposition-completed");
  if (terminalStatus !== "complete") missing.push("terminal-status-complete");
  if (issueClosed !== true) missing.push("issue-closed");
  if (projectDone !== true) missing.push("project-done");
  return {
    release: missing.length === 0,
    reason: missing.length === 0 ? "claim-release-authorized" : "claim-release-blocked",
    missing
  };
}

export function classifyResourceEligibility({ resource } = {}) {
  if (!resource || !resourceKinds.includes(resource.kind)) {
    return { classification: "ineligible", reason: "unknown-resource-kind" };
  }
  if (resource.owned !== true) return { classification: "ineligible", reason: "unrelated-or-unowned" };
  if (!text(resource.ownershipToken)) return { classification: "ineligible", reason: "ownership-token-missing" };
  if (resource.legacy === true) return { classification: "ineligible", reason: "legacy-unmigrated" };
  if (resource.remote === true) return { classification: "ineligible", reason: "remote-resource" };
  if (resource.primary === true) return { classification: "ineligible", reason: "primary-resource" };
  if (resource.locked === true) return { classification: "ineligible", reason: "locked-resource" };
  if (resource.clean === false) return { classification: "ineligible", reason: "dirty-resource" };
  if (!fullCommit(resource.headCommit)) return { classification: "ineligible", reason: "head-missing" };
  if (resource.deliveryCurrent !== true) return { classification: "ineligible", reason: "delivery-evidence-stale" };
  if (!fullCommit(resource.deliveredHeadCommit) || resource.deliveredHeadCommit !== resource.headCommit) {
    return { classification: "ineligible", reason: "divergent-head" };
  }
  return { classification: "eligible", reason: "exact-owned-clean-delivered" };
}

export function partialCleanupBlocksRelease({ outcomes = [] } = {}) {
  const blocked = outcomes.filter((outcome) => outcome?.status === "blocked");
  return { complete: outcomes.length > 0 && blocked.length === 0, blocked };
}
