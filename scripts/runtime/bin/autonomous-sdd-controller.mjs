#!/usr/bin/env node
import { runAsMain } from "../payload-wrapper.mjs";
import { workspaceIoFromEnvironment } from "../workspace-io.mjs";
import {
  bindControllerLifecycleDelivery,
  executeControllerLifecycleCleanup, inspectControllerRecord, persistControllerCleanupReceipt,
  persistControllerAuthContext, persistControllerAuthContextEvidence,
  persistControllerIssueIntake, persistControllerIssueIntakeEvidence,
  registerControllerLifecycleResource, resolveControllerStateRoot, terminalizeV2Run
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

runAsMain({
  helper: "autonomous-sdd-controller",
  invocation: "subcommand",
  operations: {
    "admit-v2-run": (payload) => admitV2Run({ ...payload, legacyDirectory: legacyDirectory(payload) }),
    "reconcile-legacy-bootstrap-record": (payload) => {
      const result = reconcileLegacyBootstrapRecord(payload);
      return result.valid ? publishLegacyReconciliationReceipt({ ...payload, receipt: result.receipt }) : result;
    },
    "inspect-v2-admission": (payload) => inspectV2Admission(payload),
    "recover-v2-run": (payload) => inspectV2Admission(payload),
    "terminalize-v2-run": (payload) => terminalizeV2Run(payload),
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
