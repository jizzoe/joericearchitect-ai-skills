import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const fullCommit = (value) => typeof value === "string" && /^[0-9a-f]{40}$/i.test(value);

// Conservative baseline detectors. Detected or uncertain sensitive content is
// surfaced as unresolved, never proven safe.
const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /(?:gh[pousr]_[A-Za-z0-9]{20,})/,
  /AKIA[A-Z0-9]{16}/,
  /(?:password|secret|token|api[_-]?key|private[_-]?key)\s*[:=]\s*\S+/i
];
const LARGE_FILE_BYTES = 512 * 1024;
const BINARY_CONTROL = /[\x00-\x08\x0B\x0C\x0E-\x1F]/;

// Conservative default set of spec-governed roots. Content under these roots is
// OpenSpec change/spec material or a governed reusable asset an OpenSpec change
// modifies; it must reach the default branch by merging from a branch/worktree,
// never by a direct commit onto the default branch. `docs/research/` is
// planning/research, not a governed workflow asset. A repository may override
// this baseline through local configuration.
const SPEC_GOVERNED_ROOTS = ["openspec", "skills", ".claude", ".agents", "scripts", "schemas", "docs", "config", "quality"];

export function isSpecGovernedPath(relativePath, governedRoots = SPEC_GOVERNED_ROOTS) {
  const normalized = (relativePath ?? "").replace(/\\/g, "/").replace(/^\.\//, "");
  if (!text(normalized)) return false;
  const first = normalized.split("/")[0];
  if (first === "docs" && normalized.startsWith("docs/research/")) return false;
  return governedRoots.includes(first);
}

function defaultGitRunner(repositoryPath) {
  return (args, options = {}) => {
    const result = spawnSync("git", ["-C", options.cwd ?? repositoryPath, ...args], { encoding: "utf8" });
    return { ok: result.status === 0, status: result.status ?? 1, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
  };
}

export function discoverRemote({ run } = {}) {
  const remotes = run(["remote"]);
  if (!remotes.ok) return null;
  const names = remotes.stdout.split("\n").map((s) => s.trim()).filter(Boolean);
  return names.includes("origin") ? "origin" : (names[0] ?? null);
}

export function discoverDefaultBranch({ run, remote, explicit } = {}) {
  if (text(explicit)) return explicit;
  const remoteName = text(remote) ? remote : discoverRemote({ run });
  if (text(remoteName)) {
    const symbolic = run(["symbolic-ref", "--quiet", `refs/remotes/${remoteName}/HEAD`]);
    if (symbolic.ok) {
      const match = symbolic.stdout.trim().match(new RegExp(`refs/remotes/${remoteName}/(.+)$`));
      if (match) return match[1];
    }
  }
  const config = run(["config", "--get", "init.defaultBranch"]);
  if (config.ok && text(config.stdout)) return config.stdout.trim();
  return null;
}

// Protected-branch rules are discovered from repository configuration
// (`branch.<name>.protected true`) or explicit input, never from a reusable
// skill constant. The default branch is not implicitly protected; a repository
// may protect it explicitly. A push to a discovered protected branch is gated.
export function discoverProtectedBranches({ run, explicit = [] } = {}) {
  const names = new Set(Array.isArray(explicit) ? explicit.filter(text) : []);
  const config = run(["config", "--get-regexp", "^branch\\..*\\.protected$"]);
  if (config.ok) {
    for (const line of config.stdout.split("\n")) {
      const match = line.trim().match(/^branch\.(.+)\.protected\s+true$/i);
      if (match) names.add(match[1]);
    }
  }
  return [...names];
}

// Validation commands are discovered from repository configuration
// (`sdd.validation`) or explicit input; absent configuration yields null rather
// than a fabricated command.
export function discoverValidationCommands({ run, explicit } = {}) {
  if (text(explicit)) return explicit;
  const config = run(["config", "--get", "sdd.validation"]);
  return config.ok && text(config.stdout) ? config.stdout.trim() : null;
}

export function currentBranch({ run } = {}) {
  const result = run(["rev-parse", "--abbrev-ref", "HEAD"]);
  return result.ok ? result.stdout.trim() : null;
}

export function listLocalBranches({ run } = {}) {
  const result = run(["for-each-ref", "--format=%(refname:short)%09%(objectname)", "refs/heads"]);
  if (!result.ok) return null;
  return result.stdout.split("\n").filter(Boolean).map((line) => {
    const [id, head] = line.split("\t");
    return { id, head };
  });
}

export function listWorktrees({ run } = {}) {
  const result = run(["worktree", "list", "--porcelain"]);
  if (!result.ok) return null;
  const records = [];
  let current = null;
  for (const line of result.stdout.split("\n")) {
    if (line.startsWith("worktree ")) { current = { id: line.slice("worktree ".length), branch: null, locked: false }; records.push(current); }
    else if (current && line.startsWith("branch ")) current.branch = line.slice("branch ".length).replace(/^refs\/heads\//, "");
    else if (current && line.startsWith("locked")) current.locked = true;
  }
  return records;
}

export function primaryWorktreePath({ run, repositoryPath } = {}) {
  const common = run(["rev-parse", "--git-common-dir"]);
  if (!common.ok) return null;
  const commonDir = path.resolve(repositoryPath ?? ".", common.stdout.trim());
  return path.dirname(commonDir);
}

export function listStatus({ run } = {}) {
  const result = run(["status", "--porcelain=v1", "--untracked-files=all"]);
  if (!result.ok) return null;
  return result.stdout.split("\n").filter(Boolean).map((line) => ({ code: line.slice(0, 2), path: line.slice(3).trim() }));
}

export function listActiveChangeNames({ repositoryPath, fileSystem = fs } = {}) {
  const root = path.join(repositoryPath, "openspec", "changes");
  try {
    return fileSystem.readdirSync(root).filter((name) => name !== "archive" && !name.startsWith("."));
  } catch (error) {
    return error?.code === "ENOENT" ? [] : null;
  }
}

export function listArchivedChangeNames({ repositoryPath, fileSystem = fs } = {}) {
  const root = path.join(repositoryPath, "openspec", "changes", "archive");
  try {
    return fileSystem.readdirSync(root).filter((name) => !name.startsWith("."));
  } catch (error) {
    return error?.code === "ENOENT" ? [] : null;
  }
}

// Authoritative active-change ownership is read from the SDD controller
// checkpoint directory. Returns { readable, claims } where claims maps a branch
// or worktree id to the owning active change name.
export function discoverActiveChangeOwnership({ repositoryPath, fileSystem = fs } = {}) {
  const claims = new Map();
  let readable = false;
  const root = path.join(repositoryPath, ".git", "sdd-delivery-runs", "runs");
  try {
    for (const dir of fileSystem.readdirSync(root, { withFileTypes: true })) {
      readable = true;
      if (!dir.isDirectory()) continue;
      try {
        const record = JSON.parse(fileSystem.readFileSync(path.join(root, dir.name, "controller.json"), "utf8"));
        for (const r of (Array.isArray(record?.resourceRecords) ? record.resourceRecords : [])) {
          if (r?.owned === true && text(r?.entry) && text(r?.id)) claims.set(r.id, r.entry);
        }
      } catch { /* skip unreadable checkpoint */ }
    }
  } catch { /* checkpoint directory absent: not readable */ }
  return { readable, claims };
}

// Fresh remote-state query (read-only) that returns the current remote branch
// and default-branch OIDs from `git ls-remote`, never from stale local
// remote-tracking refs.
export function queryRemoteState({ repositoryPath, remote, branch } = {}) {
  if (!text(repositoryPath) || !text(remote) || !text(branch)) return null;
  try {
    const head = spawnSync("git", ["-C", repositoryPath, "symbolic-ref", "--quiet", `refs/remotes/${remote}/HEAD`], { encoding: "utf8" });
    const defaultBranch = head.status === 0 ? (head.stdout.trim().match(new RegExp(`refs/remotes/${remote}/(.+)$`))?.[1] ?? null) : null;
    if (!defaultBranch) return null;
    const result = spawnSync("git", ["-C", repositoryPath, "ls-remote", remote, `refs/heads/${branch}`, `refs/heads/${defaultBranch}`], { encoding: "utf8" });
    if (result.status !== 0) return null;
    const oids = new Map();
    for (const line of (result.stdout ?? "").split("\n")) {
      const match = line.trim().match(/^([0-9a-f]{40})\s+refs\/heads\/(.+)$/);
      if (match) oids.set(match[2], match[1]);
    }
    const branchOid = oids.get(branch);
    const defaultBranchOid = oids.get(defaultBranch);
    return branchOid && defaultBranchOid ? { branchOid, defaultBranchOid } : null;
  } catch { return null; }
}

// Trusted, read-only pull-request evidence source bound to the exact branch
// head OID. Returns merged evidence only when a merged PR for this branch head
// exists; otherwise null.
export function queryPullRequestEvidence({ repositoryPath, remote, branch } = {}) {
  if (!text(repositoryPath) || !text(branch)) return null;
  try {
    const remoteName = text(remote) ? remote : "origin";
    const head = spawnSync("git", ["-C", repositoryPath, "symbolic-ref", "--quiet", `refs/remotes/${remoteName}/HEAD`], { encoding: "utf8" });
    const defaultBranch = head.status === 0 ? (head.stdout.trim().match(new RegExp(`refs/remotes/${remoteName}/(.+)$`))?.[1] ?? null) : null;
    if (!defaultBranch) return null;
    const url = spawnSync("git", ["-C", repositoryPath, "remote", "get-url", remoteName], { encoding: "utf8" }).stdout.trim();
    const slug = url.replace(/^git@github\.com:/, "").replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "");
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(slug)) return null;
    const result = spawnSync("gh", ["pr", "list", "--repo", slug, "--head", branch, "--state", "merged", "--json", "number,url,headRefOid", "--limit", "1"], { encoding: "utf8" });
    if (result.status !== 0) return null;
    const prs = JSON.parse(result.stdout || "[]");
    const pr = prs[0];
    if (!pr?.headRefOid || !pr?.url) return null;
    return { merged: true, branch, headCommit: pr.headRefOid, defaultBranch, reference: pr.url };
  } catch { return null; }
}

export function isAncestor({ run, branch, target } = {}) {
  return run(["merge-base", "--is-ancestor", branch, target]).ok;
}

export function branchReferencedByWorktree(worktrees, branch) {
  return worktrees.some((wt) => wt.branch === branch);
}

export function readFileAt({ repositoryPath, relativePath, fileSystem = fs } = {}) {
  const root = path.resolve(repositoryPath);
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(`${root}${path.sep}`)) return { present: false, reason: "path-escape" };
  try {
    const stat = fileSystem.lstatSync(resolved);
    if (stat.isSymbolicLink()) return { present: false, reason: "symlink" };
    if (!stat.isFile()) return { present: false, reason: "not-a-file" };
    const content = fileSystem.readFileSync(resolved, "utf8");
    const binary = BINARY_CONTROL.test(content.slice(0, 8192));
    return { present: true, path: relativePath, content, bytes: stat.size, hasSecretPattern: SECRET_PATTERNS.some((re) => re.test(content)), large: stat.size > LARGE_FILE_BYTES, binary };
  } catch {
    return { present: false, reason: "unreadable" };
  }
}

const entry = (kind, id, extra) => ({ kind, id, ...extra });

function unresolved(kind, id, reason, evidenceGap, recoveryAction) {
  return entry(kind, id, { classification: "unresolved", reason, evidenceGap, recoveryAction });
}

// Authoritative active-change association is supplied by the caller (e.g. from
// SDD controller resource records). The audit never infers association from
// heuristic branch-name substring matching.
export function auditGenericGitRepository({ repositoryPath, run = defaultGitRunner(repositoryPath), explicitDefaultBranch, pullRequestEvidence, activeChangeOwnership } = {}) {
  if (!text(repositoryPath)) return { ok: false, reason: "repository-path-invalid" };
  const remote = discoverRemote({ run });
  const defaultBranch = discoverDefaultBranch({ run, remote, explicit: explicitDefaultBranch });
  const current = currentBranch({ run });
  const primary = primaryWorktreePath({ run, repositoryPath });
  const branches = listLocalBranches({ run });
  const worktrees = listWorktrees({ run });
  const status = listStatus({ run });
  const activeChanges = listActiveChangeNames({ repositoryPath });
  const archivedChanges = listArchivedChangeNames({ repositoryPath });
  const protectedBranches = discoverProtectedBranches({ run });
  const validationCommands = discoverValidationCommands({ run });

  if (branches === null || worktrees === null || status === null || activeChanges === null) {
    return { ok: true, audit: { remote, defaultBranch, retireEligible: [], commitCandidates: [], unresolved: [unresolved("repository", repositoryPath, "inspection-unavailable", "a required Git or OpenSpec inspection failed to enumerate", "resolve the inspection failure before any classification")] } };
  }

  if (!text(defaultBranch)) {
    return { ok: true, audit: { remote, defaultBranch: null, retireEligible: [], commitCandidates: [], unresolved: [unresolved("repository", repositoryPath, "default-branch-unknown", "origin/HEAD and init.defaultBranch both failed to resolve", "set the default branch explicitly or configure origin/HEAD")] } };
  }

  if (text(remote) && !run(["rev-parse", "--verify", `refs/remotes/${remote}/${defaultBranch}`]).ok) {
    return { ok: true, audit: { remote, defaultBranch, retireEligible: [], commitCandidates: [], unresolved: [unresolved("repository", repositoryPath, "remote-tracking-ref-unavailable", `refs/remotes/${remote}/${defaultBranch} is not available, so ancestry cannot prove delivery`, "fetch the remote or provide exact merged-PR/default-branch evidence")] } };
  }

  // When no remote is configured, ancestry is proven against the local default
  // branch and remote state is classified as unproven rather than inferred.
  const deliveryTarget = text(remote) ? `refs/remotes/${remote}/${defaultBranch}` : `refs/heads/${defaultBranch}`;

  // Resolve authoritative active-change ownership for a branch/worktree id.
  // Returns a change name when claimed, null when authoritatively unclaimed,
  // or undefined when ownership cannot be determined (fail-closed).
  const discoveredOwnership = typeof activeChangeOwnership === "function" ? null : discoverActiveChangeOwnership({ repositoryPath });
  const owningChangeOf = (id) => {
    if (typeof activeChangeOwnership === "function") return activeChangeOwnership(id);
    if (discoveredOwnership.readable) return discoveredOwnership.claims.get(id) ?? null;
    return activeChanges.length === 0 ? null : undefined;
  };

  const retireEligible = [];
  const unresolvedList = [];
  const retireEligibleWorktrees = new Map(); // branch -> worktree path

  // Pass 1: classify worktrees first so their delivered branches can be
  // selected for retirement after the worktree is removed.
  for (const wt of worktrees) {
    const wtPrimary = primary && path.resolve(wt.id) === path.resolve(primary);
    if (wtPrimary) {
      unresolvedList.push(unresolved("worktree", wt.id, "primary-worktree", "the primary worktree is never retired", "no action; primary worktree is out of scope"));
      continue;
    }
    if (wt.locked) {
      unresolvedList.push(unresolved("worktree", wt.id, "locked-worktree", "worktree is locked", "unlock it deliberately before any removal"));
      continue;
    }
    if (!text(wt.branch)) {
      unresolvedList.push(unresolved("worktree", wt.id, "detached-worktree", "worktree is detached or has no branch", "attach or remove it manually"));
      continue;
    }
    const wtStatus = run(["status", "--porcelain=v1", "--untracked-files=all"], { cwd: wt.id });
    const clean = wtStatus.ok && wtStatus.stdout.trim() === "";
    if (!clean) {
      unresolvedList.push(unresolved("worktree", wt.id, "dirty-worktree", "worktree has uncommitted changes", "commit or discard those changes deliberately"));
      continue;
    }
    const owningChange = owningChangeOf(wt.branch);
    if (owningChange === undefined) {
      unresolvedList.push(unresolved("worktree", wt.id, "active-change-ownership-unavailable", "authoritative active-change ownership could not be determined for this worktree", "provide active-change ownership metadata before retirement"));
      continue;
    }
    if (owningChange) {
      unresolvedList.push(unresolved("worktree", wt.id, "ambiguous-active-change-association", `authoritative ownership metadata associates this worktree branch with active change ${owningChange}`, "inspect the change's tracking metadata or archive the change before retirement"));
      continue;
    }
    const branchMerged = isAncestor({ run, branch: wt.branch, target: deliveryTarget });
    if (!branchMerged) {
      unresolvedList.push(unresolved("worktree", wt.id, "delivery-unproven", "worktree branch is not proven merged to the configured default branch", "provide exact merged-PR/default-branch evidence or review manually"));
      continue;
    }
    retireEligible.push(entry("worktree", wt.id, { classification: "retire-eligible", reason: "clean-non-primary-unlocked", evidence: { branch: wt.branch, clean: true, locked: false, primary: false, branchMerged: true } }));
    retireEligibleWorktrees.set(wt.branch, wt.id);
  }

  // Pass 2: classify branches.
  for (const branch of branches) {
    if (branch.id === defaultBranch || branch.id === current) continue;
    const owningChange = owningChangeOf(branch.id);
    if (owningChange === undefined) {
      unresolvedList.push(unresolved("branch", branch.id, "active-change-ownership-unavailable", "authoritative active-change ownership could not be determined for this branch", "provide active-change ownership metadata before retirement"));
      continue;
    }
    if (owningChange) {
      unresolvedList.push(unresolved("branch", branch.id, "ambiguous-active-change-association", `authoritative ownership metadata associates this branch with active change ${owningChange}`, "inspect the change's tracking metadata or archive the change before retirement"));
      continue;
    }
    if (!fullCommit(branch.head)) {
      unresolvedList.push(unresolved("branch", branch.id, "unresolved-head", "branch head could not be resolved", "inspect the ref before any action"));
      continue;
    }
    const dependentWorktree = retireEligibleWorktrees.get(branch.id);
    if (dependentWorktree) {
      retireEligible.push(entry("branch", branch.id, { classification: "retire-eligible", reason: "delivered-after-worktree-removal", dependsOn: [`worktree:${dependentWorktree}`], evidence: { ancestryMerged: true, referencedByRetireEligibleWorktree: true, activeChangeClaim: false } }));
      continue;
    }
    if (branchReferencedByWorktree(worktrees, branch.id)) {
      unresolvedList.push(unresolved("branch", branch.id, "worktree-references-branch", "a registered worktree still uses this branch and is not itself retire-eligible", "retire the worktree first, then re-inspect this branch"));
      continue;
    }
    const merged = isAncestor({ run, branch: branch.id, target: deliveryTarget });
    if (merged) {
      const remoteRef = `refs/remotes/${remote}/${branch.id}`;
      const remoteExists = text(remote) && run(["rev-parse", "--verify", remoteRef]).ok;
      const remoteMerged = remoteExists ? isAncestor({ run, branch: remoteRef, target: deliveryTarget }) : false;
      if (remoteExists && !remoteMerged) {
        unresolvedList.push(unresolved("remote-branch", `${remote}/${branch.id}`, "remote-counterpart-unmerged", "the remote counterpart exists but is not proven merged to the remote default branch", "delete it only after confirming its changes are merged to the remote default branch"));
      }
      retireEligible.push(entry("branch", branch.id, { classification: "retire-eligible", reason: "delivered-and-inactive", evidence: { ancestryMerged: true, referencedByWorktree: false, activeChangeClaim: false, remoteCounterpart: text(remote) ? (remoteExists ? { exists: true, mergedToRemoteDefault: remoteMerged } : { exists: false }) : { exists: false, unproven: true } } }));
    } else {
      const prEvidence = typeof pullRequestEvidence === "function" ? pullRequestEvidence(branch.id) : null;
      const prBound = prEvidence?.merged === true && prEvidence?.branch === branch.id && prEvidence?.headCommit === branch.head && prEvidence?.defaultBranch === defaultBranch && text(prEvidence?.reference);
      if (prBound) {
        retireEligible.push(entry("branch", branch.id, { classification: "retire-eligible", reason: "delivered-via-pull-request", evidence: { ancestryMerged: false, pullRequestMerged: true, pullRequestReference: prEvidence.reference, referencedByWorktree: false, activeChangeClaim: false } }));
      } else if (prEvidence && prEvidence.merged === true) {
        unresolvedList.push(unresolved("branch", branch.id, "pull-request-evidence-stale", "pull-request evidence is not bound to the exact branch head, default branch, or reference", "provide fresh pull-request evidence bound to the exact branch head"));
      } else {
        unresolvedList.push(unresolved("branch", branch.id, "delivery-unproven", "not proven merged to the configured default branch (squash/rebase needs exact PR evidence)", "provide exact merged-PR/default-branch evidence or review manually"));
      }
    }
  }

  const commitCandidates = [];
  for (const s of status.filter((s) => activeChanges.some((c) => s.path.startsWith(`openspec/changes/${c}/`)))) {
    unresolvedList.push(unresolved("file", s.path, "active-change-scope", "path is inside an active OpenSpec change and is owned by that change's lifecycle", "leave it to the owning change; generic cleanup does not commit or retire it"));
  }
  const changed = status.filter((s) => !activeChanges.some((c) => s.path.startsWith(`openspec/changes/${c}/`)));
  const conflicted = changed.filter((s) => /^(DD|AU|UD|UA|DU|AA|UU)/.test(s.code));
  for (const c of conflicted) {
    unresolvedList.push(unresolved("file", c.path, "conflicted", "file has a merge conflict", "resolve the conflict manually"));
  }
  const renamed = changed.filter((s) => /^(R|C)/.test(s.code) || s.path.includes(" -> "));
  for (const r of renamed) {
    unresolvedList.push(unresolved("file", r.path, "renamed-or-copied", "rename or copy paths need manual review before commit", "review the rename/copy intent manually"));
  }
  const candidates = changed.filter((s) => !conflicted.includes(s) && !renamed.includes(s));
  const deleted = candidates.filter((s) => s.code.trim().startsWith("D"));
  const toRead = candidates.filter((s) => !deleted.includes(s));
  if (deleted.length > 0) {
    const deletions = [];
    for (const d of deleted) {
      const ls = run(["ls-files", "--stage", "--", d.path]);
      const mode = ls.ok ? (ls.stdout.split(/\s+/)[0] ?? "") : "";
      if (mode === "160000") {
        unresolvedList.push(unresolved("file", d.path, "submodule", "deleted path is a submodule", "review the submodule removal manually"));
      } else {
        deletions.push(d.path);
      }
    }
    for (const delPath of deletions) {
      const specGoverned = isSpecGovernedPath(delPath);
      const branchToken = delPath.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "working-tree";
      commitCandidates.push(entry("commit", `working-tree:${delPath}`, { classification: "commit-candidate", files: [delPath], purpose: `out-of-scope deleted file ${delPath}`, specGoverned, targetBranch: specGoverned ? `topic/${current || "working-tree"}-${branchToken}-deleted-cleanup` : defaultBranch, directToDefault: !specGoverned, push: false, message: `chore: remove out-of-scope deleted file ${delPath}` }));
    }
  }
  const fileChecks = toRead.map((s) => ({ status: s, file: readFileAt({ repositoryPath, relativePath: s.path }) }));
  const blocked = fileChecks.filter((f) => !f.file.present || f.file.hasSecretPattern || f.file.large || f.file.binary);
  for (const b of blocked) {
    if (!b.file.present) {
      unresolvedList.push(unresolved("file", b.status.path, "unreadable-or-missing", b.file.reason ?? "file could not be read as a regular text file", "inspect the path manually; it is blocked from automatic commit"));
    } else {
      unresolvedList.push(unresolved("file", b.status.path, b.file.hasSecretPattern ? "secret-like" : (b.file.binary ? "binary" : "large-or-binary"), b.file.hasSecretPattern ? "content matches a conservative secret/credential pattern" : (b.file.binary ? "content appears to be binary" : "file exceeds the large/binary baseline"), "review the content manually; it is blocked from automatic commit"));
    }
  }
  const eligible = fileChecks.filter((f) => !blocked.includes(f));
  for (const f of eligible) {
    const specGoverned = isSpecGovernedPath(f.status.path);
    const statusClass = f.status.code.trim() === "??" ? "new" : "modified";
    const branchToken = f.status.path.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "working-tree";
    commitCandidates.push(entry("commit", `working-tree:${f.status.path}`, { classification: "commit-candidate", files: [f.status.path], purpose: `out-of-scope ${statusClass} file ${f.status.path}`, specGoverned, targetBranch: specGoverned ? `topic/${current || "working-tree"}-${branchToken}-${statusClass}-cleanup` : defaultBranch, directToDefault: !specGoverned, push: false, message: `chore: capture out-of-scope ${statusClass} file ${f.status.path}` }));
  }

  return { ok: true, audit: { remote, defaultBranch, protectedBranches, validationCommands, archivedChanges, retireEligible, commitCandidates, unresolved: unresolvedList } };
}

// Confirmation-gated planning only. Never mutates Git.
export function planGenericCleanupApply({ audit, selection } = {}) {
  if (!audit || typeof audit !== "object") return { ok: false, reason: "audit-required" };
  const retire = Array.isArray(selection?.retire) ? selection.retire : [];
  const commit = Array.isArray(selection?.commitCandidates) ? selection.commitCandidates : [];
  if (commit.length > 1) return { ok: false, reason: "multiple-commit-candidates-not-supported" };
  const push = selection?.push === true;
  const plan = [];
  const confirmation = { retire: [], commit: [], push };

  const knownRetire = new Set(audit.retireEligible.map((e) => `${e.kind}:${e.id}`));
  const retireSteps = [];
  const remoteSelections = [];
  for (const rawId of retire) {
    const key = typeof rawId === "string" && rawId.includes(":") ? rawId : `branch:${rawId}`;
    if (key.startsWith("remote:")) { remoteSelections.push(key); continue; }
    if (!knownRetire.has(key)) return { ok: false, reason: `selection-not-retire-eligible:${rawId}` };
    const sep = key.indexOf(":");
    const kind = key.slice(0, sep);
    const id = key.slice(sep + 1);
    const retireEntry = audit.retireEligible.find((e) => e.kind === kind && e.id === id);
    const squashDelivered = retireEntry?.reason === "delivered-via-pull-request" || retireEntry?.evidence?.pullRequestMerged === true;
    retireSteps.push({ kind, id, command: kind === "worktree" ? ["git", "worktree", "remove", "--", id] : ["git", "branch", squashDelivered ? "-D" : "-d", "--", id], forceDelete: kind === "branch" && squashDelivered, stepKind: kind === "worktree" ? "worktree-remove" : "branch-delete" });
    confirmation.retire.push(key);
  }
  // Dependency ordering: retire clean non-primary worktrees before their local
  // branches, independent of caller-supplied selection order.
  retireSteps.sort((a, b) => (a.kind === b.kind ? 0 : (a.kind === "worktree" ? -1 : 1)));
  for (const s of retireSteps) {
    plan.push({ order: plan.length, command: s.command, target: s.id, kind: s.stepKind });
  }
  // Remote-branch deletion is a separate, explicitly confirmed target. It is
  // never auto-appended when a local branch is selected.
  for (const remoteKey of remoteSelections) {
    const branchId = remoteKey.slice("remote:".length);
    const branchEntry = audit.retireEligible.find((e) => e.kind === "branch" && e.id === branchId);
    if (!branchEntry) return { ok: false, reason: `selection-not-retire-eligible:${remoteKey}` };
    if (!branchEntry.evidence?.remoteCounterpart?.mergedToRemoteDefault) return { ok: false, reason: `remote-counterpart-not-merged:${branchId}` };
    if (!text(audit.remote)) return { ok: false, reason: "remote-delete-requires-remote" };
    plan.push({ order: plan.length, command: ["git", "push", audit.remote, "--delete", "--", branchId], target: branchId, kind: "remote-branch-delete" });
    confirmation.retire.push(remoteKey);
  }

  const knownCommit = audit.commitCandidates.filter((c) => c.kind === "commit");
  for (const c of commit) {
    const candidate = knownCommit.find((k) => k.id === c.id && k.files.join("\n") === c.files.join("\n"));
    if (!candidate) return { ok: false, reason: `selection-not-commit-candidate:${c.id ?? "unknown"}` };
    const targetBranch = candidate.targetBranch;
    const message = candidate.message;
    const directToDefault = candidate.directToDefault === true;
    if (!directToDefault) {
      plan.push({ order: plan.length, command: ["git", "switch", "-c", targetBranch], target: targetBranch, kind: "create-topic-branch" });
    }
    plan.push({ order: plan.length, command: ["git", "add", "--", ...candidate.files], target: candidate.files.join(", "), files: candidate.files, id: candidate.id, kind: "stage-paths" });
    plan.push({ order: plan.length, command: ["git", "commit", "-m", message], target: candidate.files.join(", "), files: candidate.files, id: candidate.id, message, directToDefault, targetBranch, kind: "commit-paths" });
    if (push) {
      plan.push(directToDefault
        ? { order: plan.length, command: ["git", "push", audit.remote ?? "origin", "--", targetBranch], target: targetBranch, committedFiles: candidate.files, kind: "push-default-branch" }
        : { order: plan.length, command: ["git", "push", audit.remote ?? "origin", "--", targetBranch], target: targetBranch, committedFiles: candidate.files, kind: "push-topic-branch" });
    }
    confirmation.commit.push({ id: candidate.id, files: candidate.files, message, targetBranch, directToDefault, push });
  }

  const recoveryNotes = [
    "Reinspect branch, worktree, index, remote, and protection state immediately before each mutation.",
    "A commit failure reports the exact recovery state and never retries or rewrites without a new user instruction.",
    "Push only after a successful local commit and a separate current push-target check.",
    "A remote branch is deleted only after its changes are proven merged to the remote default branch; otherwise it is left intact.",
    "Spec-governed content is never committed or pushed directly to the default branch; non-spec files may commit directly to the default branch."
  ];

  const validationCommands = audit.validationCommands ?? null;
  return { ok: true, plan, confirmation: { ...confirmation, validationCommands }, validationCommands, recoveryNotes };
}

// Fresh re-inspection immediately before apply. Each step's precondition is
// re-checked against fresh state and its canonical command is reconstructed
// from that state (never trusted from the caller's plan).
export function verifyPlanFreshness({ repositoryPath, plan, stepIndex, run = defaultGitRunner(repositoryPath), explicitDefaultBranch, pullRequestEvidence, remoteState, observedAt = new Date().toISOString() } = {}) {
  if (!Array.isArray(plan) || plan.length === 0) return { ok: false, reason: "plan-required" };
  const steps = stepIndex === undefined ? plan : (Number.isInteger(stepIndex) && stepIndex >= 0 && stepIndex < plan.length ? [plan[stepIndex]] : null);
  if (steps === null) return { ok: false, reason: "step-index-invalid" };
  const auditResult = auditGenericGitRepository({ repositoryPath, run, explicitDefaultBranch, pullRequestEvidence });
  if (!auditResult.ok) return auditResult;
  const audit = auditResult.audit;
  const eligible = new Map(audit.retireEligible.map((e) => [`${e.kind}:${e.id}`, e]));
  const worktreesNow = listWorktrees({ run });
  const currentWorktrees = new Set((worktreesNow ?? []).map((wt) => wt.id));
  const verifiedPlan = [];
  const drifted = [];
  const knownKinds = new Set(["worktree-remove", "branch-delete", "remote-branch-delete", "create-topic-branch", "stage-paths", "commit-paths", "push-topic-branch", "push-default-branch"]);

  for (let stepPosition = 0; stepPosition < steps.length; stepPosition++) {
    const step = steps[stepPosition];
    const planIndex = stepIndex === undefined ? stepPosition : stepIndex;
    if (!knownKinds.has(step.kind)) { drifted.push({ step, reason: "unknown-step-kind" }); continue; }
    if (step.kind === "worktree-remove") {
      if (!eligible.has(`worktree:${step.target}`)) { drifted.push({ step, reason: "target-no-longer-retire-eligible" }); continue; }
      verifiedPlan.push({ kind: "worktree-remove", target: step.target, command: ["git", "worktree", "remove", "--", step.target] });
    } else if (step.kind === "branch-delete") {
      const entry = eligible.get(`branch:${step.target}`);
      if (!entry) { drifted.push({ step, reason: "target-no-longer-retire-eligible" }); continue; }
      const pending = (entry.dependsOn ?? []).filter((d) => d.startsWith("worktree:") && currentWorktrees.has(d.slice("worktree:".length)));
      if (pending.length > 0) { drifted.push({ step, reason: "dependency-worktree-still-present", detail: pending }); continue; }
      const squashDelivered = entry.reason === "delivered-via-pull-request" || entry.evidence?.pullRequestMerged === true;
      verifiedPlan.push({ kind: "branch-delete", target: step.target, forceDelete: squashDelivered, command: ["git", "branch", squashDelivered ? "-D" : "-d", "--", step.target] });
    } else if (step.kind === "remote-branch-delete") {
      if (!text(audit.remote)) { drifted.push({ step, reason: "push-remote-unavailable" }); continue; }
      if (step.target === audit.defaultBranch) { drifted.push({ step, reason: "remote-delete-target-is-default-branch" }); continue; }
      const freshRemote = typeof remoteState === "function" ? remoteState(audit.remote, step.target) : null;
      if (!freshRemote || !fullCommit(freshRemote.branchOid) || !fullCommit(freshRemote.defaultBranchOid)) { drifted.push({ step, reason: "remote-state-unavailable" }); continue; }
      if (!isAncestor({ run, branch: freshRemote.branchOid, target: freshRemote.defaultBranchOid })) { drifted.push({ step, reason: "remote-counterpart-not-merged" }); continue; }
      verifiedPlan.push({ kind: "remote-branch-delete", target: step.target, branchOid: freshRemote.branchOid, command: ["git", "push", audit.remote, "--delete", "--", step.target] });
    } else if (step.kind === "create-topic-branch") {
      if (!run(["check-ref-format", "--branch", step.target]).ok) { drifted.push({ step, reason: "invalid-branch-name" }); continue; }
      const candidate = audit.commitCandidates.find((c) => c.kind === "commit" && c.targetBranch === step.target && c.directToDefault !== true);
      if (!candidate) { drifted.push({ step, reason: "topic-branch-not-derived-from-candidate" }); continue; }
      const exists = run(["rev-parse", "--verify", `refs/heads/${step.target}`]);
      if (exists.ok) { drifted.push({ step, reason: "topic-branch-already-exists" }); continue; }
      verifiedPlan.push({ kind: "create-topic-branch", target: step.target, command: ["git", "switch", "-c", step.target] });
    } else if (step.kind === "stage-paths" || step.kind === "commit-paths") {
      const files = Array.isArray(step.files) ? step.files : (step.target ?? "").split(", ").filter(Boolean);
      const candidate = audit.commitCandidates.find((c) => c.kind === "commit" && c.id === step.id && c.files.join("\n") === files.join("\n"));
      if (!candidate) { drifted.push({ step, reason: "commit-candidate-no-longer-matches" }); continue; }
      if (step.kind === "stage-paths") {
        verifiedPlan.push({ kind: "stage-paths", target: files.join(", "), command: ["git", "add", "--", ...files] });
      } else {
        const directToDefault = candidate.directToDefault === true;
        const message = text(candidate.message) ? candidate.message : "chore: capture out-of-scope changes";
        const targetBranch = text(candidate.targetBranch) ? candidate.targetBranch : null;
        const staged = run(["diff", "--cached", "--name-only"]);
        const stagedFiles = staged.ok ? staged.stdout.split("\n").map((s) => s.trim()).filter(Boolean) : [];
        const unrelated = stagedFiles.filter((f) => !files.includes(f));
        const missing = files.filter((f) => !stagedFiles.includes(f));
        if (unrelated.length > 0 || missing.length > 0) { drifted.push({ step, reason: "staged-set-mismatch", detail: { unrelated, missing } }); continue; }
        const head = run(["rev-parse", "--abbrev-ref", "HEAD"]);
        const headName = head.ok ? head.stdout.trim() : null;
        if (directToDefault) {
          if (headName !== audit.defaultBranch) { drifted.push({ step, reason: "commit-target-not-default-branch" }); continue; }
        } else {
          if (!targetBranch) { drifted.push({ step, reason: "commit-target-branch-unavailable" }); continue; }
          if (headName !== targetBranch) { drifted.push({ step, reason: "commit-target-branch-mismatch", detail: { expected: targetBranch, actual: headName } }); continue; }
        }
        verifiedPlan.push({ kind: "commit-paths", target: files.join(", "), message, directToDefault, targetBranch, command: ["git", "commit", "-m", message] });
      }
    } else if (step.kind === "push-topic-branch") {
      if (!text(audit.remote)) { drifted.push({ step, reason: "push-remote-unavailable" }); continue; }
      if (!run(["check-ref-format", "--branch", step.target]).ok) { drifted.push({ step, reason: "invalid-branch-name" }); continue; }
      if (step.target === audit.defaultBranch) { drifted.push({ step, reason: "push-target-is-default-branch" }); continue; }
      if (discoverProtectedBranches({ run }).includes(step.target)) { drifted.push({ step, reason: "push-target-protected" }); continue; }
      const committedFiles = Array.isArray(step.committedFiles) ? step.committedFiles : [];
      if (committedFiles.length === 0) { drifted.push({ step, reason: "push-without-preceding-commit" }); continue; }
      const commitIndex = plan.findIndex((p) => p.kind === "commit-paths" && p.targetBranch === step.target && (p.files ?? []).join("\n") === committedFiles.join("\n"));
      if (commitIndex === -1 || commitIndex >= planIndex) { drifted.push({ step, reason: "push-without-ordered-preceding-commit" }); continue; }
      const committedOid = plan[commitIndex]?.outcome;
      if (!fullCommit(committedOid)) { drifted.push({ step, reason: "push-without-commit-outcome" }); continue; }
      const headOid = run(["rev-parse", "HEAD"]);
      if (!headOid.ok || headOid.stdout.trim() !== committedOid) { drifted.push({ step, reason: "push-head-not-committed-oid" }); continue; }
      const remaining = run(["status", "--porcelain=v1", "--untracked-files=all", "--", ...committedFiles]);
      if (!remaining.ok || remaining.stdout.trim() !== "") { drifted.push({ step, reason: "push-without-clean-commit" }); continue; }
      const head = run(["rev-parse", "--abbrev-ref", "HEAD"]);
      if (!head.ok || head.stdout.trim() !== step.target) { drifted.push({ step, reason: "head-not-on-topic-branch" }); continue; }
      verifiedPlan.push({ kind: "push-topic-branch", target: step.target, commit: committedOid, command: ["git", "push", audit.remote, `${committedOid}:refs/heads/${step.target}`] });
    } else if (step.kind === "push-default-branch") {
      if (!text(audit.remote)) { drifted.push({ step, reason: "push-remote-unavailable" }); continue; }
      if (step.target !== audit.defaultBranch) { drifted.push({ step, reason: "push-target-is-not-default-branch" }); continue; }
      if (discoverProtectedBranches({ run }).includes(step.target)) { drifted.push({ step, reason: "push-target-protected" }); continue; }
      const committedFiles = Array.isArray(step.committedFiles) ? step.committedFiles : [];
      if (committedFiles.length === 0) { drifted.push({ step, reason: "push-without-preceding-commit" }); continue; }
      const commitIndex = plan.findIndex((p) => p.kind === "commit-paths" && p.directToDefault === true && (p.files ?? []).join("\n") === committedFiles.join("\n"));
      if (commitIndex === -1 || commitIndex >= planIndex) { drifted.push({ step, reason: "push-without-ordered-preceding-commit" }); continue; }
      const committedOid = plan[commitIndex]?.outcome;
      if (!fullCommit(committedOid)) { drifted.push({ step, reason: "push-without-commit-outcome" }); continue; }
      const headOid = run(["rev-parse", "HEAD"]);
      if (!headOid.ok || headOid.stdout.trim() !== committedOid) { drifted.push({ step, reason: "push-head-not-committed-oid" }); continue; }
      const remaining = run(["status", "--porcelain=v1", "--untracked-files=all", "--", ...committedFiles]);
      if (!remaining.ok || remaining.stdout.trim() !== "") { drifted.push({ step, reason: "push-without-clean-commit" }); continue; }
      const head = run(["rev-parse", "--abbrev-ref", "HEAD"]);
      if (!head.ok || head.stdout.trim() !== audit.defaultBranch) { drifted.push({ step, reason: "head-not-on-default-branch" }); continue; }
      verifiedPlan.push({ kind: "push-default-branch", target: step.target, commit: committedOid, command: ["git", "push", audit.remote, `${committedOid}:refs/heads/${step.target}`] });
    }
  }

  const selectedEntries = verifiedPlan.map((s) => ({ kind: s.kind, target: s.target }));
  const plannedEntryKeys = new Set();
  for (const s of verifiedPlan) {
    if (s.kind === "branch-delete") plannedEntryKeys.add(`branch:${s.target}`);
    else if (s.kind === "worktree-remove") plannedEntryKeys.add(`worktree:${s.target}`);
    else if (s.kind === "remote-branch-delete") plannedEntryKeys.add(`remote:${s.target}`);
  }
  const skippedEntries = [...eligible.keys()].filter((key) => !plannedEntryKeys.has(key)).map((key) => {
    const sep = key.indexOf(":");
    return { kind: key.slice(0, sep), target: key.slice(sep + 1) };
  });
  const receipt = buildCleanupReceipt({ plan: verifiedPlan, outcomes: drifted.map((d) => ({ kind: d.step.kind, target: d.step.target, status: "blocked", detail: d.reason })), selected: selectedEntries, skipped: skippedEntries, observedAt });
  if (drifted.length > 0) return { ok: false, reason: "fresh-inspection-drift", drifted, receipt, verifiedPlan };
  return { ok: true, receipt, verifiedPlan };
}

// A durable, non-sensitive receipt of the plan and its outcomes. It is stored
// outside the worktree so it never becomes an uncommitted cleanup candidate.
export function buildCleanupReceipt({ plan, outcomes = [], selected = [], skipped = [], observedAt = new Date().toISOString() } = {}) {
  const redact = (target) => (typeof target === "string" && target.startsWith("/") ? path.basename(target) : target);
  const planEntries = (plan ?? []).map((s) => ({ kind: s.kind, target: redact(s.target) }));
  const outcomeEntries = (outcomes ?? []).map((o) => ({ kind: o.kind, target: redact(o.target), status: o.status, detail: o.detail ?? null }));
  const selectedEntries = (selected ?? []).map((s) => (typeof s === "string" ? { target: redact(s) } : { kind: s.kind, target: redact(s.target) }));
  const skippedEntries = (skipped ?? []).map((s) => (typeof s === "string" ? { target: redact(s) } : { kind: s.kind, target: redact(s.target) }));
  const body = { plan: planEntries, outcomes: outcomeEntries, selected: selectedEntries, skipped: skippedEntries, observedAt };
  const nonSensitive = !SECRET_PATTERNS.some((re) => re.test(JSON.stringify(body)));
  const digest = crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
  return { schemaVersion: 1, nonSensitive, observedAt, plan: planEntries, outcomes: outcomeEntries, selected: selectedEntries, skipped: skippedEntries, digest };
}

// Persists a non-sensitive receipt to a configurable location outside the
// worktree (e.g. a state or evidence directory) via an atomic write.
export function writeCleanupReceipt({ receipt, outputPath, repositoryPath, fileSystem = fs } = {}) {
  if (!receipt || receipt.nonSensitive !== true || !text(outputPath)) return { ok: false, reason: "receipt-input-invalid" };
  if (text(repositoryPath)) {
    const resolvedRoot = path.resolve(repositoryPath);
    const resolvedOutput = path.resolve(outputPath);
    let realRoot;
    let realOutput;
    try {
      realRoot = fileSystem.realpathSync(resolvedRoot);
      const parent = path.dirname(resolvedOutput);
      realOutput = fileSystem.existsSync(parent)
        ? path.join(fileSystem.realpathSync(parent), path.basename(resolvedOutput))
        : resolvedOutput;
    } catch {
      realRoot = resolvedRoot;
      realOutput = resolvedOutput;
    }
    if (realOutput === realRoot || realOutput.startsWith(`${realRoot}${path.sep}`)) {
      return { ok: false, reason: "receipt-path-inside-worktree" };
    }
  }
  try {
    fileSystem.mkdirSync(path.dirname(outputPath), { recursive: true, mode: 0o700 });
    const temporary = `${outputPath}.${crypto.randomUUID()}.tmp`;
    fileSystem.writeFileSync(temporary, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
    fileSystem.renameSync(temporary, outputPath);
    return { ok: true, path: outputPath };
  } catch {
    return { ok: false, reason: "receipt-write-failed" };
  }
}





