import crypto from "node:crypto";

export const githubObjectKinds = Object.freeze(["issue", "pr", "project"]);

const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const text = (value) => typeof value === "string" && value.trim().length > 0;
const safeRepository = (value) => text(value) && repositoryPattern.test(value);

const ownershipScopes = Object.freeze({
  issue: Object.freeze(["title", "managedBlock", "labels"]),
  pr: Object.freeze(["title", "body", "branch", "statusMapping"]),
  project: Object.freeze(["statusField", "itemMembership"])
});

const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
};

const sha256 = (value) => crypto.createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");

export function ownershipScopeFor(objectKind) {
  return ownershipScopes[objectKind] ? [...ownershipScopes[objectKind]] : null;
}

export function assertOwnershipScope({ objectKind, fields } = {}) {
  const allowed = ownershipScopes[objectKind];
  if (!allowed) {
    return { allowed: false, classification: "invalid-object-kind", issues: [{ code: "ownership-scope-invalid-object-kind", objectKind }] };
  }
  const names = Array.isArray(fields) ? fields : [];
  const violations = names.filter((field) => !allowed.includes(field));
  if (violations.length) {
    return {
      allowed: false,
      classification: "ownership-scope-violation",
      issues: violations.map((field) => ({ code: "ownership-scope-field-not-managed", objectKind, field }))
    };
  }
  return { allowed: true, classification: "authorized", issues: [] };
}

export function transitionPreconditionDigest({ operation, repository, targets = [] } = {}) {
  return sha256({ operation, repository, targets: [...targets].sort() });
}

function rejected(error, classification = "rejected", extra = {}) {
  return { ok: false, error, classification, ...extra };
}

export function planIssueCreateOrReuse({ repository, title, existingIssues = [], labels = [] } = {}) {
  if (!safeRepository(repository)) return rejected("invalid-repository");
  if (!text(title)) return rejected("title-required");
  const existing = existingIssues.find((candidate) => candidate.title === title);
  if (existing) return { ok: true, action: "reuse", operation: "issue-create-or-reuse", repository, issue: existing };
  return { ok: true, action: "create", operation: "issue-create-or-reuse", repository, title, labels: [...labels].sort() };
}

export function planProjectSetStatus({ statusField, currentStatus, requestedStatus } = {}) {
  if (!statusField?.name || !Array.isArray(statusField?.options)) return rejected("missing-status-field");
  if (!statusField.options.includes(requestedStatus)) {
    return rejected("unknown-project-status", "rejected", { allowed: statusField.options });
  }
  if (currentStatus === requestedStatus) {
    return { ok: true, action: "noop", operation: "project-set-status", status: requestedStatus };
  }
  return { ok: true, action: "set-status", operation: "project-set-status", from: currentStatus ?? null, to: requestedStatus };
}

export function planTopicBranchCreate({ repository, branch, expectedHead, existingBranch } = {}) {
  if (!safeRepository(repository)) return rejected("invalid-repository");
  if (!text(branch)) return rejected("branch-required");
  if (existingBranch) {
    if (existingBranch.head !== expectedHead) {
      return rejected("divergent-branch-head", "rejected", { existingHead: existingBranch.head, expectedHead });
    }
    return { ok: true, action: "noop", operation: "topic-branch-create", repository, branch, head: expectedHead };
  }
  return { ok: true, action: "create", operation: "topic-branch-create", repository, branch, head: expectedHead };
}

export function planPrCreateOrUpdate({ existingPr, headBranch, baseBranch, title } = {}) {
  if (!text(headBranch) || !text(baseBranch)) return rejected("pr-branches-required");
  if (existingPr) {
    if (existingPr.headBranch !== headBranch || existingPr.baseBranch !== baseBranch) {
      return rejected("pr-branch-mismatch");
    }
    return { ok: true, action: "reuse", operation: "pr-create-or-update", pr: existingPr };
  }
  return { ok: true, action: "create", operation: "pr-create-or-update", headBranch, baseBranch, title };
}

export function planExactHeadCheck({ expectedHead, observedHead } = {}) {
  if (!text(expectedHead)) return rejected("expected-head-required");
  if (observedHead === expectedHead) return { ok: true, action: "pass", operation: "exact-head-check", head: expectedHead };
  return rejected("head-mismatch", "rejected", { expectedHead, observedHead });
}

export function planMerge({ mergeable, retentionRequired = false, autoDeleteHeadBranches = false, retentionAuthorized = true } = {}) {
  if (mergeable === false) return rejected("not-mergeable");
  if (retentionRequired && autoDeleteHeadBranches === true && !retentionAuthorized) return rejected("retention-not-authorized");
  return { ok: true, action: "merge", operation: "merge" };
}

export function planIssueClose({ observedIssueState } = {}) {
  if (observedIssueState === "CLOSED") return { ok: true, action: "noop", operation: "issue-close" };
  return { ok: true, action: "close", operation: "issue-close" };
}

export function planDeliveryStatus({ currentStatus, targetStatus, allowedOptions } = {}) {
  if (!Array.isArray(allowedOptions) || !allowedOptions.includes(targetStatus)) {
    return rejected("unknown-target-status", "rejected", { allowedOptions: allowedOptions ?? [] });
  }
  if (currentStatus === targetStatus) return { ok: true, action: "noop", operation: "delivery-status", status: targetStatus };
  return { ok: true, action: "set-status", operation: "delivery-status", from: currentStatus ?? null, to: targetStatus };
}

export function reconcileTransition({ plan, observedState } = {}) {
  if (!plan?.ok) return { action: "paused", reason: plan?.error ?? "invalid-plan" };
  const status = observedState?.status;
  if (status === "unknown") return { action: "in-doubt", reason: "unobservable-live-state" };
  if (status === "matches") return { action: "noop", reason: "already-converged", plan };
  if (status === "diverges") return { action: "conflict", reason: "live-state-diverges", plan };
  return { action: "apply", reason: "unobserved-apply", plan };
}
