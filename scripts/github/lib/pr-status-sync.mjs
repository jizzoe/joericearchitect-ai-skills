const PR_EVENT_STATUS = {
  opened: "In Progress",
  reopened: "In Progress",
  ready_for_review: "In Review",
  converted_to_draft: "In Progress",
  synchronize: null
};

export function expectedStatusForPullRequestEvent({ action, pullRequest, defaultBranch }) {
  if (action === "closed") {
    if (pullRequest?.merged === true && pullRequest?.base?.ref === defaultBranch) {
      return null;
    }
    return "In Progress";
  }
  return Object.hasOwn(PR_EVENT_STATUS, action) ? PR_EVENT_STATUS[action] : null;
}

export function classifyPullRequestTrust({ eventName, pullRequest, repository }) {
  const sameRepository = pullRequest?.head?.repo?.full_name === repository?.full_name;
  const trustedEvent = eventName === "pull_request";
  return {
    trusted: trustedEvent && sameRepository,
    reason: trustedEvent && sameRepository ? "same-repository-pull-request" : "untrusted-pull-request"
  };
}

export function planPullRequestProjectStatus({
  config,
  eventName = "pull_request",
  action,
  pullRequest,
  issue,
  observedProject,
  currentStatus
}) {
  const trust = classifyPullRequestTrust({
    eventName,
    pullRequest,
    repository: {
      full_name: `${config.repository.owner}/${config.repository.name}`
    }
  });
  if (!trust.trusted) {
    return {
      ok: true,
      action: "audit-only",
      status: null,
      trust,
      reason: "Project mutation is skipped for untrusted pull request context."
    };
  }

  const expectedStatus = expectedStatusForPullRequestEvent({
    action,
    pullRequest,
    defaultBranch: config.repository.defaultBranch
  });
  if (!expectedStatus) {
    return {
      ok: true,
      action: "noop",
      status: null,
      trust,
      reason: action === "closed" && pullRequest?.merged === true
        ? "Merged default-branch pull requests rely on closing keywords and built-in Project completion."
        : "Pull request action does not require Project status reconciliation."
    };
  }

  const field = observedProject?.fields?.find((candidate) => candidate.name === config.statusField.name);
  if (!field) return { ok: false, error: "missing status field", field: config.statusField.name };
  const option = field.options?.find((candidate) => candidate.name === expectedStatus);
  if (!option) return { ok: false, error: "missing status option", status: expectedStatus };

  if (currentStatus === expectedStatus) {
    return {
      ok: true,
      action: "noop",
      status: expectedStatus,
      issueUrl: issue?.url ?? null,
      trust
    };
  }

  return {
    ok: true,
    action: "set-status",
    issueUrl: issue?.url ?? null,
    from: currentStatus ?? null,
    to: expectedStatus,
    fieldId: field.id,
    optionId: option.id,
    trust
  };
}

