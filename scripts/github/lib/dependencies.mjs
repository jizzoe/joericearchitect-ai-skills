const PRIORITY_RANK = { P0: 0, P1: 1, P2: 2, P3: 3 };

export function findDependencyCycles(items) {
  const byChange = new Map(items.map((item) => [item.change, item]));
  const cycles = [];
  const visiting = new Set();
  const visited = new Set();

  function visit(change, path) {
    if (visiting.has(change)) {
      cycles.push(path.slice(path.indexOf(change)));
      return;
    }
    if (visited.has(change)) return;
    visiting.add(change);
    const item = byChange.get(change);
    for (const dependency of item?.blockedBy ?? []) {
      if (byChange.has(dependency)) visit(dependency, [...path, dependency]);
    }
    visiting.delete(change);
    visited.add(change);
  }

  for (const item of items) visit(item.change, [item.change]);
  return cycles;
}

export function hasDependencyPath(items, from, to) {
  const byChange = new Map(items.map((item) => [item.change, item]));
  const seen = new Set();
  function walk(change) {
    if (change === to) return true;
    if (seen.has(change)) return false;
    seen.add(change);
    return (byChange.get(change)?.blockedBy ?? []).some(walk);
  }
  return walk(from);
}

export function sharedResourceConflict(left, right) {
  const files = new Set(left.sharedFiles ?? []);
  const states = new Set(left.sharedState ?? []);
  const sharedFiles = (right.sharedFiles ?? []).filter((file) => files.has(file));
  const sharedState = (right.sharedState ?? []).filter((state) => states.has(state));
  if (sharedFiles.length === 0 && sharedState.length === 0) return null;
  return { left: left.change, right: right.change, sharedFiles, sharedState };
}

export function classifyWorkItems(items) {
  const byChange = new Map(items.map((item) => [item.change, item]));
  const cycles = findDependencyCycles(items);
  const cycleChanges = new Set(cycles.flat());
  const completed = new Set(items.filter((item) => item.status === "Done" || item.closed === true).map((item) => item.change));

  const enriched = items.map((item) => {
    const unresolved = (item.blockedBy ?? []).filter((dependency) => !completed.has(dependency));
    const missing = (item.blockedBy ?? []).filter((dependency) => !byChange.has(dependency));
    const cycleBlocked = cycleChanges.has(item.change);
    const blockedReasons = [
      ...unresolved.map((dependency) => ({ type: "unresolved-dependency", dependency })),
      ...missing.map((dependency) => ({ type: "missing-change-reference", dependency })),
      ...(cycleBlocked ? [{ type: "dependency-cycle" }] : []),
      ...(item.conflicts ?? []).map((conflict) => ({ type: "explicit-conflict", conflict }))
    ];
    const inFlight = ["In Progress", "In Review"].includes(item.status);
    const candidateStatus = ["Ready", "In Progress", "In Review"].includes(item.status);
    return {
      ...item,
      inFlight,
      blocked: blockedReasons.length > 0,
      blockedReasons,
      actionable: candidateStatus && blockedReasons.length === 0
    };
  });

  const actionable = enriched.filter((item) => item.actionable);
  const parallelCandidates = [];
  for (let leftIndex = 0; leftIndex < actionable.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < actionable.length; rightIndex += 1) {
      const left = actionable[leftIndex];
      const right = actionable[rightIndex];
      const dependencyRelated = hasDependencyPath(enriched, left.change, right.change) || hasDependencyPath(enriched, right.change, left.change);
      const conflict = sharedResourceConflict(left, right);
      if (!dependencyRelated && !conflict) parallelCandidates.push([left.change, right.change]);
    }
  }

  return {
    items: enriched,
    inFlight: enriched.filter((item) => item.inFlight).map((item) => item.change),
    actionable: actionable.map((item) => item.change),
    blocked: enriched.filter((item) => item.blocked).map((item) => ({ change: item.change, reasons: item.blockedReasons })),
    cycles,
    parallelCandidates
  };
}

export function selectNextWork(items, explicitChange = null) {
  const classified = classifyWorkItems(items);
  const byChange = new Map(classified.items.map((item) => [item.change, item]));
  if (explicitChange) {
    const item = byChange.get(explicitChange);
    return { ok: Boolean(item), selected: item?.change ?? null, reason: item ? "explicit-selection" : "unknown-explicit-change", classified };
  }

  const actionable = classified.items.filter((item) => item.actionable);
  const inProgress = actionable.filter((item) => item.status === "In Progress");
  const review = actionable.filter((item) => item.status === "In Review");
  const ready = actionable.filter((item) => item.status === "Ready");
  const backlog = classified.items.filter((item) => item.status === "Backlog" && !item.blocked);
  const pool = inProgress.length ? inProgress : review.length ? review : ready.length ? ready : backlog;
  const reason = inProgress.length ? "actionable-in-progress"
    : review.length ? "review-work"
      : ready.length ? "ready-priority-sequence"
        : backlog.length ? "backlog-specification"
          : "no-actionable-work";
  if (!pool.length) return { ok: false, selected: null, reason, classified };
  const sorted = [...pool].sort((left, right) => {
    const priority = (PRIORITY_RANK[left.priority ?? "P3"] ?? 3) - (PRIORITY_RANK[right.priority ?? "P3"] ?? 3);
    if (priority !== 0) return priority;
    return (left.sequence ?? Number.MAX_SAFE_INTEGER) - (right.sequence ?? Number.MAX_SAFE_INTEGER);
  });
  return { ok: true, selected: sorted[0].change, reason, classified };
}

export function nextIncompleteTask(tasksText) {
  const match = tasksText.match(/^- \[ \] ([0-9]+(?:\.[0-9]+)?) (.+)$/m);
  return match ? { id: match[1], title: match[2].trim() } : null;
}
