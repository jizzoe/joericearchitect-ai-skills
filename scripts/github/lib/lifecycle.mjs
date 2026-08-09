const EVENT_STATUS = {
  "propose-reviewed": "Ready",
  "apply-started": "In Progress"
};

export function expectedStatusForEvent(event) {
  return EVENT_STATUS[event] ?? null;
}

export function resolveProjectStatus({ config, observedProject, status }) {
  if (!observedProject) return { ok: false, error: "missing observed project" };
  const fieldName = config.statusField?.name;
  const field = observedProject.fields?.find((candidate) => candidate.name === fieldName);
  if (!field) return { ok: false, error: "missing status field", field: fieldName };
  const option = field.options?.find((candidate) => candidate.name === status);
  if (!option) return { ok: false, error: "missing status option", field: fieldName, status };
  return { ok: true, field, option };
}

export function planLifecycleTransition({ config, tracking, observedProject, currentStatus, event }) {
  const expectedStatus = expectedStatusForEvent(event);
  if (!expectedStatus) return { ok: false, error: "unknown lifecycle event", event };
  const resolved = resolveProjectStatus({ config, observedProject, status: expectedStatus });
  if (!resolved.ok) return resolved;
  const issueUrl = tracking.github.issue_url;
  if (currentStatus === expectedStatus) {
    return { ok: true, action: "noop", issueUrl, status: expectedStatus, event };
  }
  return {
    ok: true,
    action: "set-status",
    issueUrl,
    event,
    from: currentStatus ?? null,
    to: expectedStatus,
    fieldId: resolved.field.id,
    optionId: resolved.option.id
  };
}

export function auditLifecycle({ config, tracking, observedIssue, observedProject, event }) {
  const plan = planLifecycleTransition({
    config,
    tracking,
    observedProject,
    currentStatus: observedIssue?.projectStatus,
    event
  });
  if (!plan.ok) return { ok: false, issues: [plan] };
  const issues = [];
  if (observedIssue?.url !== tracking.github.issue_url) {
    issues.push({
      type: "issue-url-mismatch",
      expected: tracking.github.issue_url,
      actual: observedIssue?.url ?? null
    });
  }
  if (plan.action !== "noop") {
    issues.push({
      type: "status-drift",
      issueUrl: tracking.github.issue_url,
      currentStatus: plan.from,
      expectedStatus: plan.to,
      repair: plan
    });
  }
  return { ok: true, drift: issues.length > 0, issues, expectedStatus: plan.status ?? plan.to };
}

export function repairLifecycle({ config, tracking, observedIssue, observedProject, event, authorized = false, dryRun = true }) {
  const audit = auditLifecycle({ config, tracking, observedIssue, observedProject, event });
  if (!audit.ok) return audit;
  if (!audit.drift) return { ok: true, action: "noop", audit };
  if (!authorized) {
    return { ok: false, error: "repair authorization required", audit };
  }
  const repair = audit.issues.find((issue) => issue.type === "status-drift")?.repair;
  return {
    ok: true,
    action: dryRun ? "plan-repair" : "repair",
    dryRun,
    repair,
    audit
  };
}

export function backfillSummary(records) {
  return records.map((record) => ({
    change: record.change,
    issue: record.issue,
    issueState: record.issueState,
    projectStatus: record.projectStatus,
    compatible: record.issueState === "CLOSED" && record.projectStatus === "Done"
  }));
}
