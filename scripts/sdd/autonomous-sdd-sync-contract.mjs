export const deltaOperations = Object.freeze(["ADDED", "MODIFIED", "REMOVED"]);

const reqLinePattern = /^###\s+Requirement:\s*(.+?)\s*$/;

const splitLines = (markdown) => (markdown ?? "").split(/\r?\n/);

function normalizeRequirementText(value) {
  return (value ?? "").replace(/\r\n/g, "\n").trim();
}

export function exactRequirementText(a, b) {
  return normalizeRequirementText(a) === normalizeRequirementText(b);
}

export function scenarioTitles(requirementText) {
  const out = [];
  for (const line of splitLines(requirementText)) {
    const match = line.match(/^####\s+Scenario:\s*(.+?)\s*$/);
    if (match) out.push(match[1]);
  }
  return out;
}

export function parseDeltaRequirements(markdown) {
  const operationBySection = {
    "ADDED Requirements": "ADDED",
    "MODIFIED Requirements": "MODIFIED",
    "REMOVED Requirements": "REMOVED"
  };
  const requirements = [];
  let section = null;
  let current = null;
  for (const line of splitLines(markdown)) {
    const sectionMatch = line.match(/^##\s+(.+Requirements)\s*$/);
    if (sectionMatch) {
      section = operationBySection[sectionMatch[1]] ?? null;
      current = null;
      continue;
    }
    if (/^##\s+/.test(line)) {
      current = null;
      continue;
    }
    const reqMatch = line.match(reqLinePattern);
    if (reqMatch) {
      current = { id: reqMatch[1], operation: section, lines: [line] };
      if (section) requirements.push(current);
      continue;
    }
    if (current) current.lines.push(line);
  }
  return requirements.map((r) => ({ id: r.id, operation: r.operation, text: normalizeRequirementText(r.lines.join("\n")) }));
}

export function parseLivingRequirements(markdown) {
  const requirements = {};
  let inRequirements = false;
  let current = null;
  for (const line of splitLines(markdown)) {
    if (/^##\s+Requirements\s*$/.test(line)) {
      inRequirements = true;
      current = null;
      continue;
    }
    if (/^##\s+/.test(line)) {
      inRequirements = false;
      current = null;
      continue;
    }
    if (!inRequirements) continue;
    const reqMatch = line.match(reqLinePattern);
    if (reqMatch) {
      current = reqMatch[1];
      requirements[current] = [line];
      continue;
    }
    if (current) requirements[current].push(line);
  }
  const out = {};
  for (const [id, lines] of Object.entries(requirements)) out[id] = normalizeRequirementText(lines.join("\n"));
  return out;
}

export function applyDeltaToLiving({ delta, living } = {}) {
  const requirements = { ...(living?.requirements ?? {}) };
  const conflicts = [];
  let changed = false;
  for (const req of delta?.requirements ?? []) {
    const existing = requirements[req.id];
    if (req.operation === "ADDED") {
      if (existing === undefined) {
        requirements[req.id] = req.text;
        changed = true;
      } else if (!exactRequirementText(existing, req.text)) {
        conflicts.push({ id: req.id, reason: "added-requirement-conflicts-with-living" });
      }
    } else if (req.operation === "MODIFIED") {
      if (existing === undefined) {
        conflicts.push({ id: req.id, reason: "modified-requirement-missing-in-living" });
      } else {
        const dropped = scenarioTitles(existing).filter((title) => !scenarioTitles(req.text).includes(title));
        if (dropped.length) conflicts.push({ id: req.id, reason: "modified-requirement-drops-scenario", dropped });
        if (!exactRequirementText(existing, req.text)) {
          requirements[req.id] = req.text;
          changed = true;
        }
      }
    } else if (req.operation === "REMOVED") {
      if (existing !== undefined) {
        delete requirements[req.id];
        changed = true;
      }
    }
  }
  return { ok: conflicts.length === 0, changed, conflicts, livingAfter: { capability: delta?.capability, requirements } };
}

export function detectRequirementConflict({ left, right } = {}) {
  if (!left?.id || !right?.id || left.id !== right.id) return { conflict: false };
  return { conflict: true, reason: "shared-requirement-overlap", id: left.id };
}

export function buildOverlapGraph({ activeChanges = [] } = {}) {
  const capabilities = {};
  const conflicts = [];
  for (const { change, deltas = [] } of activeChanges) {
    for (const delta of deltas) {
      const cap = capabilities[delta.capability] ?? (capabilities[delta.capability] = { changes: new Set(), requirements: {} });
      cap.changes.add(change);
      for (const req of delta.requirements ?? []) {
        const ops = cap.requirements[req.id] ?? (cap.requirements[req.id] = []);
        ops.push({ change, operation: req.operation });
      }
    }
  }
  for (const [capability, data] of Object.entries(capabilities)) {
    for (const [requirement, ops] of Object.entries(data.requirements)) {
      if (ops.length > 1) conflicts.push({ capability, requirement, operations: ops });
    }
  }
  return {
    capabilities: Object.fromEntries(Object.entries(capabilities).map(([k, v]) => [k, { changes: [...v.changes], requirementOperations: v.requirements }])),
    conflicts,
    hasConflicts: conflicts.length > 0
  };
}

export function proveRepeatSyncNoOp({ delta, living } = {}) {
  const first = applyDeltaToLiving({ delta, living });
  if (!first.ok) return false;
  const second = applyDeltaToLiving({ delta, living: first.livingAfter });
  return second.ok && second.changed === false;
}
