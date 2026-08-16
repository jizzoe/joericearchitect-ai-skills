const text = (value) => typeof value === "string" && value.trim().length > 0;
const fullCommit = (value) => typeof value === "string" && /^[0-9a-f]{40}$/i.test(value);
const exactEvidence = (evidence, headCommit) => evidence && evidence.current === true && text(evidence.reference) && evidence.headCommit === headCommit;

function exactResource(resource, { selectedEntry, repository }) {
  return resource && resource.entry === selectedEntry && resource.repository === repository && text(resource.role) &&
    text(resource.id) && ["worktree", "branch"].includes(resource.kind) && fullCommit(resource.headCommit) &&
    text(resource.ownershipToken) && text(resource.recoveryReference) && resource.owned === true &&
    resource.deliveryCurrent === true && exactEvidence(resource.deliveryEvidence, resource.headCommit);
}

function exactMergedPullRequest(evidence, headCommit) {
  return evidence && evidence.merged === true && text(evidence.pullRequest) && evidence.finalHeadCommit === headCommit;
}

function ineligible(resource, reason) {
  return { id: resource?.id ?? null, classification: "ineligible", reason, actions: [] };
}

export function planWorkspaceCleanup({ selectedEntry, repository, archiveVisible, issueClosed, projectDone = true, deliveryEvidence, resources = [] } = {}) {
  if (!text(selectedEntry) || !text(repository)) return { classification: "paused", reason: "cleanup-selected-entry-missing", resources: [] };
  if (!archiveVisible || !issueClosed || !projectDone || !fullCommit(deliveryEvidence?.headCommit) || !exactEvidence(deliveryEvidence, deliveryEvidence.headCommit)) return { classification: "paused", reason: "cleanup-delivery-evidence-incomplete", resources: [] };
  const planned = resources.map((resource) => {
    if (!exactResource(resource, { selectedEntry, repository })) return ineligible(resource, "cleanup-resource-record-invalid");
    if (resource.kind === "worktree") {
      if (resource.primary || resource.locked || resource.registered !== true || resource.clean !== true || !text(resource.ownershipToken)) return ineligible(resource, "cleanup-worktree-ineligible");
      return { id: resource.id, classification: "eligible", actions: [{ kind: "remove-worktree", id: resource.id, resource }] };
    }
    if (resource.referencedElsewhere === true) return ineligible(resource, "cleanup-branch-still-referenced");
    if (resource.ancestryMerged === true) return { id: resource.id, classification: "eligible", actions: [{ kind: "delete-local-branch", id: resource.id, force: false, resource }] };
    if (exactMergedPullRequest(resource.squashOrRebaseEvidence, resource.headCommit)) return { id: resource.id, classification: "eligible", actions: [{ kind: "delete-local-branch", id: resource.id, force: true, resource }] };
    return ineligible(resource, "cleanup-branch-delivery-unproven");
  });
  return { classification: "planned", reason: "cleanup-audit-complete", resources: planned };
}

export function executeWorkspaceCleanup(plan, { removeWorktree, deleteLocalBranch, inspectResource, persistOutcome } = {}) {
  if (plan?.classification !== "planned") return { classification: "paused", reason: "cleanup-plan-not-actionable", outcomes: [] };
  if (typeof persistOutcome !== "function") return { classification: "paused", reason: "cleanup-outcome-persistence-missing", outcomes: [] };
  const outcomes = [];
  const actions = plan.resources.flatMap((resource) => resource.actions ?? []).sort((left, right) =>
    Number(left.kind !== "remove-worktree") - Number(right.kind !== "remove-worktree"));
  for (const action of actions) {
    const current = inspectResource?.(action.resource) ?? { exists: true };
    if (current?.exists === false) {
      const outcome = { ...action, status: "already-completed" };
      if (persistOutcome(outcome)?.persisted !== true) outcomes.push({ ...outcome, status: "blocked", receipt: "outcome-persist-failed" });
      else outcomes.push(outcome);
      continue;
    }
    if (persistOutcome({ ...action, status: "started" })?.persisted !== true) {
      outcomes.push({ ...action, status: "blocked", receipt: "outcome-persist-failed" });
      continue;
    }
    let outcome;
    try {
      const receipt = action.kind === "remove-worktree" ? removeWorktree?.(action.id, action.resource) : deleteLocalBranch?.(action.id, { force: action.force, resource: action.resource });
      outcome = { ...action, status: receipt?.committed === true ? "completed" : "blocked", receipt: receipt?.committed === true ? "committed" : "uncommitted" };
    } catch {
      outcome = { ...action, status: "blocked", receipt: "exception" };
    }
    outcomes.push(persistOutcome(outcome)?.persisted === true ? outcome : { ...outcome, status: "blocked", receipt: "outcome-persist-failed" });
  }
  return { classification: outcomes.some((outcome) => outcome.status === "blocked") ? "partial" : "completed", reason: "cleanup-apply-complete", outcomes };
}
