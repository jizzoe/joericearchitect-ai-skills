#!/usr/bin/env node
import path from "node:path";
import { runAsMain } from "../payload-wrapper.mjs";
import { workspaceIoFromEnvironment } from "../workspace-io.mjs";
import { auditGenericGitRepository, planGenericCleanupApply, verifyPlanFreshness, buildCleanupReceipt, writeCleanupReceipt, queryPullRequestEvidence, queryRemoteState } from "../../sdd/generic-git-repository-cleanup.mjs";

// The audit defaults its read-only Git inspection to the validated launcher
// target. Destructive apply is intentionally not a declared operation here; the
// plan is presented for confirmation, verified by `verify-plan`, and the
// assistant executes the confirmed steps and records the receipt.
const workspace = (payload) => {
  const root = workspaceIoFromEnvironment()?.root;
  if (payload?.repositoryPath && root && path.resolve(payload.repositoryPath) !== path.resolve(root)) {
    throw new Error("repository-path-mismatch");
  }
  return root;
};

runAsMain({
  helper: "generic-git-repository-cleanup",
  invocation: "payload",
  operations: {
    "audit": (payload) => auditGenericGitRepository({
      repositoryPath: workspace(payload),
      pullRequestEvidence: (branch, remote) => queryPullRequestEvidence({ repositoryPath: workspace(payload), remote, branch }),
      ...(payload?.explicitDefaultBranch ? { explicitDefaultBranch: payload.explicitDefaultBranch } : {})
    }),
    "plan-apply": (payload) => planGenericCleanupApply(payload ?? {}),
    "verify-plan": (payload) => verifyPlanFreshness({
      repositoryPath: workspace(payload),
      plan: payload?.plan,
      stepIndex: payload?.stepIndex,
      ...(payload?.explicitDefaultBranch ? { explicitDefaultBranch: payload.explicitDefaultBranch } : {}),
      pullRequestEvidence: (branch, remote) => queryPullRequestEvidence({ repositoryPath: workspace(payload), remote, branch }),
      remoteState: (remote, branch, defaultBranch) => queryRemoteState({ repositoryPath: workspace(payload), remote, branch, defaultBranch })
    }),
    "build-receipt": (payload) => buildCleanupReceipt(payload ?? {}),
    "write-receipt": (payload) => writeCleanupReceipt({ ...(payload ?? {}), repositoryPath: workspace(payload) })
  }
});
