const text = (value) => typeof value === "string" && value.trim().length > 0;

function ineligible(resource, reason) {
  return { id: resource?.id ?? null, classification: "ineligible", reason, actions: [] };
}

export function planWorkspaceCleanup({ selectedEntry, archiveVisible, issueClosed, projectDone = true, resources = [] } = {}) {
  if (!text(selectedEntry)) return { classification: "paused", reason: "cleanup-selected-entry-missing", resources: [] };
  if (!archiveVisible || !issueClosed || !projectDone) return { classification: "paused", reason: "cleanup-delivery-evidence-incomplete", resources: [] };
  const planned = resources.map((resource) => {
    if (!resource || resource.entry !== selectedEntry || !text(resource.id) || !["worktree", "branch"].includes(resource.kind)) return ineligible(resource, "cleanup-resource-record-invalid");
    if (resource.owned !== true || resource.deliveryCurrent !== true) return ineligible(resource, "cleanup-resource-evidence-incomplete");
    if (resource.kind === "worktree") {
      if (resource.primary || resource.locked || resource.registered !== true || resource.clean !== true || !text(resource.ownershipToken)) return ineligible(resource, "cleanup-worktree-ineligible");
      return { id: resource.id, classification: "eligible", actions: [{ kind: "remove-worktree", id: resource.id }] };
    }
    if (resource.referencedElsewhere === true) return ineligible(resource, "cleanup-branch-still-referenced");
    if (resource.ancestryMerged === true) return { id: resource.id, classification: "eligible", actions: [{ kind: "delete-local-branch", id: resource.id, force: false }] };
    if (resource.squashOrRebaseEvidence === true) return { id: resource.id, classification: "eligible", actions: [{ kind: "delete-local-branch", id: resource.id, force: true }] };
    return ineligible(resource, "cleanup-branch-delivery-unproven");
  });
  return { classification: "planned", reason: "cleanup-audit-complete", resources: planned };
}

export function executeWorkspaceCleanup(plan, { removeWorktree, deleteLocalBranch } = {}) {
  if (plan?.classification !== "planned") return { classification: "paused", reason: "cleanup-plan-not-actionable", outcomes: [] };
  const outcomes = [];
  for (const resource of plan.resources) {
    for (const action of resource.actions) {
      try {
        const receipt = action.kind === "remove-worktree" ? removeWorktree?.(action.id) : deleteLocalBranch?.(action.id, { force: action.force });
        outcomes.push({ ...action, status: receipt?.committed === true ? "completed" : "blocked" });
      } catch {
        outcomes.push({ ...action, status: "blocked" });
      }
    }
  }
  return { classification: outcomes.some((outcome) => outcome.status === "blocked") ? "partial" : "completed", reason: "cleanup-apply-complete", outcomes };
}
