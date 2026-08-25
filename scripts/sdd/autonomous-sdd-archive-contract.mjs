const changeNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const archiveRequiredFiles = Object.freeze(["proposal.md", "design.md", "tasks.md", ".openspec.yaml"]);

export function archiveDestinationName({ changeName, date } = {}) {
  return `${date}-${changeName}`;
}

export function planArchiveDestination({ changeName, date, existingEntries = [] } = {}) {
  if (!changeNamePattern.test(changeName ?? "") || !datePattern.test(date ?? "")) {
    return { ok: false, error: "archive-destination-input-invalid", classification: "rejected" };
  }
  const destination = archiveDestinationName({ changeName, date });
  const existing = existingEntries.find((entry) => entry.name === destination);
  if (existing) {
    if (existing.change === changeName) {
      return { ok: true, action: "already-archived", destination };
    }
    return { ok: false, error: "archive-destination-conflict", classification: "conflict", destination };
  }
  return { ok: true, action: "archive", destination };
}

export function validateArchiveContentPreservation({ requiredFiles = archiveRequiredFiles, archivedFiles = [] } = {}) {
  const present = new Set(archivedFiles);
  const missing = requiredFiles.filter((file) => !present.has(file));
  return { valid: missing.length === 0, missing };
}

export function isArchiveIdempotent({ destination, changeName, existingEntries = [] } = {}) {
  const existing = existingEntries.find((entry) => entry.name === destination);
  return Boolean(existing && existing.change === changeName);
}

export function validateArchivePreconditions({ implementationDelivered, syncDelivered, issueClosed, projectDone } = {}) {
  const missing = [];
  if (implementationDelivered !== true) missing.push("implementation-delivered");
  if (syncDelivered !== true) missing.push("sync-delivered");
  if (issueClosed !== true) missing.push("issue-closed");
  if (projectDone !== true) missing.push("project-done");
  return { ready: missing.length === 0, missing };
}
