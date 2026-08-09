export function planAddToProject({ project, issueUrl, dryRun = true }) {
  return {
    ok: true,
    dryRun,
    operation: "project.itemAdd",
    owner: project.owner,
    number: project.number,
    issueUrl
  };
}

export function planSetProjectStatus({ project, issueUrl, status, dryRun = true }) {
  if (!project.statusField?.options?.includes(status)) {
    return {
      ok: false,
      error: "unknown project status",
      status,
      allowed: project.statusField?.options ?? []
    };
  }
  return {
    ok: true,
    dryRun,
    operation: "project.setStatus",
    owner: project.owner,
    number: project.number,
    field: project.statusField.name,
    status,
    issueUrl
  };
}
