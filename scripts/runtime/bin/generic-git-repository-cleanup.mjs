#!/usr/bin/env node
import { runAsMain } from "../payload-wrapper.mjs";
import { workspaceIoFromEnvironment } from "../workspace-io.mjs";
import { auditGenericGitRepository, planGenericCleanupApply, verifyPlanFreshness, buildCleanupReceipt, writeCleanupReceipt } from "../../sdd/generic-git-repository-cleanup.mjs";

// The audit defaults its read-only Git inspection to the validated launcher
// target. Destructive apply is intentionally not a declared operation here; the
// plan is presented for confirmation, verified by `verify-plan`, and the
// assistant executes the confirmed steps and records the receipt.
const workspace = (payload) => payload?.repositoryPath ?? workspaceIoFromEnvironment()?.root;

runAsMain({
  helper: "generic-git-repository-cleanup",
  invocation: "payload",
  operations: {
    "audit": (payload) => auditGenericGitRepository({
      repositoryPath: workspace(payload),
      ...(payload?.explicitDefaultBranch ? { explicitDefaultBranch: payload.explicitDefaultBranch } : {})
    }),
    "plan-apply": (payload) => planGenericCleanupApply(payload ?? {}),
    "verify-plan": (payload) => verifyPlanFreshness({ repositoryPath: workspace(payload), plan: payload?.plan, stepIndex: payload?.stepIndex }),
    "build-receipt": (payload) => buildCleanupReceipt(payload ?? {}),
    "write-receipt": (payload) => writeCleanupReceipt({ ...(payload ?? {}), repositoryPath: payload?.repositoryPath ?? workspace(payload) })
  }
});
