import crypto from "node:crypto";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const fullCommit = (value) => typeof value === "string" && /^[0-9a-f]{40}$/i.test(value);
const timestamp = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
const exactEvidence = (evidence, headCommit) => evidence && evidence.current === true && text(evidence.reference) && evidence.headCommit === headCommit;
const canonical = (value) => Array.isArray(value)
  ? value.map(canonical)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]))
    : value;

export function legacyMigrationAuthorizationPayload(authorization) {
  return canonical({
    approved: authorization.approved,
    owner: authorization.owner,
    entry: authorization.entry,
    repository: authorization.repository,
    kind: authorization.kind,
    id: authorization.id,
    reviewedAt: authorization.reviewedAt,
    reference: authorization.reference,
    signatureAlgorithm: authorization.signatureAlgorithm,
    resourceBinding: authorization.resourceBinding
  });
}

function migrationResourceBinding(resource) {
  if (!resource || typeof resource !== "object") return null;
  const { entry, repository, registeredAt, migration, ...binding } = resource;
  return canonical(binding);
}

function validSignedOwnerAuthorization(authorization, { trustedOwner, trustedOwnerPublicKey } = {}) {
  if (authorization?.approved !== true || !text(trustedOwner) || authorization.owner !== trustedOwner || !text(authorization.reference) ||
      authorization.signatureAlgorithm !== "ed25519" || !text(authorization.signature) || !trustedOwnerPublicKey) return false;
  try {
    return crypto.verify(null, Buffer.from(JSON.stringify(legacyMigrationAuthorizationPayload(authorization))), trustedOwnerPublicKey,
      Buffer.from(authorization.signature, "base64"));
  } catch {
    return false;
  }
}

function exactResource(resource, { selectedEntry, repository }) {
  return resource && resource.entry === selectedEntry && resource.repository === repository && text(resource.role) &&
    text(resource.id) && ["worktree", "branch"].includes(resource.kind) && fullCommit(resource.headCommit) &&
    text(resource.ownershipToken) && text(resource.recoveryReference) && timestamp(resource.registeredAt) && resource.owned === true &&
    resource.deliveryCurrent === true && resource.deliveryEvidence?.current === true && text(resource.deliveryEvidence.reference) &&
    resource.deliveryEvidence.headCommit === resource.headCommit && fullCommit(resource.deliveryEvidence.deliveredHeadCommit) &&
    exactMergedPullRequest(resource.deliveryEvidence.mergedPullRequest, resource.headCommit, resource.deliveryEvidence.deliveredHeadCommit);
}

function exactMergedPullRequest(evidence, headCommit, deliveredHeadCommit) {
  return evidence && evidence.merged === true && text(evidence.pullRequest) && evidence.topicHeadCommit === headCommit && evidence.finalHeadCommit === deliveredHeadCommit;
}

function resourceEligible(resource, { selectedEntry, repository }) {
  if (!exactResource(resource, { selectedEntry, repository })) return false;
  if (resource.kind === "worktree") return !resource.primary && !resource.locked && resource.registered === true && resource.clean === true;
  return resource.referencedElsewhere !== true && (resource.ancestryMerged === true || exactMergedPullRequest(resource.squashOrRebaseEvidence, resource.headCommit, resource.deliveryEvidence.deliveredHeadCommit));
}

function freshResourceMatches(action, current) {
  if (current?.exists !== true || !resourceEligible(current, { selectedEntry: action.resource.entry, repository: action.resource.repository })) return false;
  const { exists, ...withoutExistence } = current;
  return JSON.stringify(canonical(withoutExistence)) === JSON.stringify(canonical(action.resource));
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
      if (resource.controllerCheckpointPresent === true && resource.terminalReceiptReady !== true) return ineligible(resource, "cleanup-controller-checkpoint-retention-incomplete");
      if (resource.primary || resource.locked || resource.registered !== true || resource.clean !== true || !text(resource.ownershipToken)) return ineligible(resource, "cleanup-worktree-ineligible");
      return { id: resource.id, classification: "eligible", actions: [{ kind: "remove-worktree", id: resource.id, resource, deliveryEvidence: resource.deliveryEvidence, finalizationEvidence: deliveryEvidence }] };
    }
    if (resource.referencedElsewhere === true) return ineligible(resource, "cleanup-branch-still-referenced");
    if (resource.ancestryMerged === true) return { id: resource.id, classification: "eligible", actions: [{ kind: "delete-local-branch", id: resource.id, force: false, resource, deliveryEvidence: resource.deliveryEvidence, finalizationEvidence: deliveryEvidence }] };
    if (exactMergedPullRequest(resource.squashOrRebaseEvidence, resource.headCommit, resource.deliveryEvidence.deliveredHeadCommit)) return { id: resource.id, classification: "eligible", actions: [{ kind: "delete-local-branch", id: resource.id, force: true, resource, deliveryEvidence: resource.deliveryEvidence, finalizationEvidence: deliveryEvidence }] };
    return ineligible(resource, "cleanup-branch-delivery-unproven");
  });
  return { classification: "planned", reason: "cleanup-audit-complete", resources: planned };
}

export function migrateLegacyWorkspaceResource({ selectedEntry, repository, legacyResource, ownerAuthorization, trustedOwner, trustedOwnerPublicKey, inspectedResource, now = new Date().toISOString() } = {}) {
  if (!text(selectedEntry) || !text(repository) || !legacyResource || !inspectedResource || !timestamp(now) ||
      ownerAuthorization?.approved !== true || ownerAuthorization.entry !== selectedEntry || ownerAuthorization.repository !== repository ||
      ownerAuthorization.kind !== legacyResource.kind || ownerAuthorization.id !== legacyResource.id ||
      !text(ownerAuthorization.owner) || !timestamp(ownerAuthorization.reviewedAt) || Date.parse(ownerAuthorization.reviewedAt) > Date.parse(now) ||
      !validSignedOwnerAuthorization(ownerAuthorization, { trustedOwner, trustedOwnerPublicKey })) {
    return { valid: false, reason: "cleanup-legacy-migration-authorization-invalid" };
  }
  if (!fullCommit(legacyResource.headCommit) ||
      JSON.stringify(migrationResourceBinding(legacyResource)) !== JSON.stringify(migrationResourceBinding(inspectedResource))) {
    return { valid: false, reason: "cleanup-legacy-migration-inspection-mismatch" };
  }
  if (JSON.stringify(canonical(ownerAuthorization.resourceBinding)) !== JSON.stringify(canonical(migrationResourceBinding(inspectedResource)))) {
    return { valid: false, reason: "cleanup-legacy-migration-authorization-invalid" };
  }
  const migrated = {
    ...structuredClone(inspectedResource), entry: selectedEntry, repository, owned: true,
    registeredAt: now,
    migration: { reviewedAt: ownerAuthorization.reviewedAt, authorizationReference: ownerAuthorization.reference ?? "owner-authorized" }
  };
  return exactResource(migrated, { selectedEntry, repository })
    ? { valid: true, resource: migrated }
    : { valid: false, reason: "cleanup-legacy-migration-resource-invalid" };
}

export function executeWorkspaceCleanup(plan, { removeWorktree, deleteLocalBranch, inspectResource, persistOutcome } = {}) {
  if (plan?.classification !== "planned") return { classification: "paused", reason: "cleanup-plan-not-actionable", outcomes: [] };
  if (typeof persistOutcome !== "function" || typeof inspectResource !== "function") return { classification: "paused", reason: "cleanup-fresh-inspection-or-persistence-missing", outcomes: [] };
  const outcomes = [];
  const actions = plan.resources.flatMap((resource) => resource.actions ?? []).sort((left, right) =>
    Number(left.kind !== "remove-worktree") - Number(right.kind !== "remove-worktree"));
  for (const action of actions) {
    const current = inspectResource(action.resource);
    if (current?.exists === false) {
      const outcome = { ...action, status: "already-completed" };
      if (persistOutcome(outcome)?.persisted !== true) outcomes.push({ ...outcome, status: "blocked", receipt: "outcome-persist-failed" });
      else outcomes.push(outcome);
      continue;
    }
    if (!freshResourceMatches(action, current)) {
      outcomes.push({ ...action, status: "blocked", receipt: "fresh-resource-mismatch" });
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
