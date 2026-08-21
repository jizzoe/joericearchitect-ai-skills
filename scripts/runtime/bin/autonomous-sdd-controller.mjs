#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { runAsMain } from "../payload-wrapper.mjs";
import { workspaceIoFromEnvironment } from "../workspace-io.mjs";
import {
  bindControllerLifecycleDelivery,
  attachBootstrapCleanupMigration, executeBootstrapCleanupAttachment,
  executeControllerLifecycleCleanup, inspectControllerRecord, persistControllerCleanupReceipt,
  persistControllerAuthContext, persistControllerAuthContextEvidence,
  persistControllerIssueIntake, persistControllerIssueIntakeEvidence,
  registerControllerLifecycleResource, retainBootstrapCleanupResource, resolveControllerStateRoot, terminalizeV2Run
} from "../../sdd/autonomous-sdd-controller.mjs";
import { admitV2Run, inspectV2Admission } from "../../sdd/autonomous-sdd-admission.mjs";
import { reconcileLegacyBootstrapRecord, publishLegacyReconciliationReceipt } from "../../sdd/autonomous-sdd-legacy-reconciliation.mjs";

// The controller persists its state in the target repository's Git common
// directory, so the validated launcher target is the default repository path.
const repositoryPath = (payload) => payload?.repositoryPath ?? workspaceIoFromEnvironment()?.root;
const legacyDirectory = (payload) => {
  const state = resolveControllerStateRoot({ repositoryPath: repositoryPath(payload) });
  return state.valid ? state.stateRoot : null;
};

function git(repository, args, options = {}) {
  return execFileSync("git", ["-C", repository, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...options }).trim();
}

function listedWorktrees(repository) {
  const records = [];
  let current = null;
  for (const line of git(repository, ["worktree", "list", "--porcelain"]).split("\n")) {
    if (line.startsWith("worktree ")) { current = { path: line.slice("worktree ".length) }; records.push(current); }
    else if (current && line.startsWith("branch ")) current.branch = line.slice("branch ".length);
    else if (current && line === "locked") current.locked = true;
  }
  return records;
}

function localBootstrapCleanupOperations(repository) {
  return {
    inspectResource: (resource) => {
      if (resource.kind === "worktree") {
        if (!fs.existsSync(resource.id)) return { ...resource, exists: false };
        const listed = listedWorktrees(repository);
        const worktree = listed.find((item) => path.resolve(item.path) === path.resolve(resource.id));
        const registered = Boolean(worktree);
        const clean = registered && git(resource.id, ["status", "--porcelain", "--untracked-files=all"]) === "";
        return { ...resource, exists: true, primary: path.resolve(resource.id) === path.resolve(repository), registered, clean, locked: worktree?.locked === true, controllerCheckpointPresent: false };
      }
      let headCommit;
      try { headCommit = git(repository, ["rev-parse", "--verify", `refs/heads/${resource.id}`]); } catch { return { ...resource, exists: false }; }
      const branch = `refs/heads/${resource.id}`;
      const referencedElsewhere = listedWorktrees(repository).some((worktree) => worktree.branch === branch);
      let ancestryMerged = false;
      try { git(repository, ["merge-base", "--is-ancestor", headCommit, "refs/remotes/origin/main"]); ancestryMerged = true; } catch { /* The signed squash evidence may instead authorize deletion. */ }
      return { ...resource, exists: true, headCommit, referencedElsewhere, ancestryMerged };
    },
    removeWorktree: (id) => { git(repository, ["worktree", "remove", "--", id]); return { committed: true }; },
    deleteLocalBranch: (id, { force }) => { git(repository, ["branch", force ? "-D" : "-d", "--", id]); return { committed: true }; }
  };
}

runAsMain({
  helper: "autonomous-sdd-controller",
  invocation: "subcommand",
  operations: {
    "admit-v2-run": (payload) => admitV2Run({ ...payload, repositoryPath: repositoryPath(payload), legacyDirectory: legacyDirectory(payload) }),
    "reconcile-legacy-bootstrap-record": (payload) => {
      const result = reconcileLegacyBootstrapRecord(payload);
      return result.valid ? publishLegacyReconciliationReceipt({ ...payload, receipt: result.receipt }) : result;
    },
    "inspect-v2-admission": (payload) => inspectV2Admission(payload),
    "recover-v2-run": (payload) => inspectV2Admission(payload),
    "terminalize-v2-run": (payload) => terminalizeV2Run(payload),
    "attach-bootstrap-cleanup-migration": (payload) => attachBootstrapCleanupMigration({
      ...payload, readableRepositoryName: payload?.readableRepositoryName ?? path.basename(repositoryPath(payload))
    }),
    "retain-bootstrap-cleanup-resource": (payload) => retainBootstrapCleanupResource({
      ...payload, readableRepositoryName: payload?.readableRepositoryName ?? path.basename(repositoryPath(payload))
    }),
    "execute-bootstrap-cleanup-attachment": (payload) => executeBootstrapCleanupAttachment({
      ...payload, readableRepositoryName: payload?.readableRepositoryName ?? path.basename(repositoryPath(payload)),
      operations: localBootstrapCleanupOperations(repositoryPath(payload))
    }),
    "inspect-controller-record": (payload) => inspectControllerRecord(payload?.record, {
      authorization: payload?.authorization,
      repository: payload?.repository ?? repositoryPath(payload),
      ...(payload?.now ? { now: payload.now } : {})
    }),
    "register-controller-lifecycle-resource": (payload) => registerControllerLifecycleResource({
      ...payload, repositoryPath: repositoryPath(payload)
    }),
    "persist-controller-issue-intake": (payload) => persistControllerIssueIntake({
      ...payload, repositoryPath: repositoryPath(payload)
    }),
    "persist-controller-issue-intake-evidence": (payload) => persistControllerIssueIntakeEvidence({
      ...payload, repositoryPath: repositoryPath(payload)
    }),
    "persist-controller-auth-context": (payload) => persistControllerAuthContext({
      ...payload, repositoryPath: repositoryPath(payload)
    }),
    "persist-controller-auth-context-evidence": (payload) => persistControllerAuthContextEvidence({
      ...payload, repositoryPath: repositoryPath(payload)
    }),
    "bind-controller-lifecycle-delivery": (payload) => bindControllerLifecycleDelivery({
      ...payload, repositoryPath: repositoryPath(payload)
    }),
    "persist-controller-cleanup-receipt": (payload) => persistControllerCleanupReceipt({
      ...payload, repositoryPath: repositoryPath(payload)
    }),
    "execute-controller-lifecycle-cleanup": (payload) => executeControllerLifecycleCleanup({
      ...payload, repositoryPath: repositoryPath(payload)
    })
  }
});
