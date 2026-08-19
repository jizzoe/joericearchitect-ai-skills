#!/usr/bin/env node
import { runAsMain } from "../payload-wrapper.mjs";
import { workspaceIoFromEnvironment } from "../workspace-io.mjs";
import {
  advanceControllerRecord, bindControllerLifecycleDelivery, createControllerRecord,
  executeControllerLifecycleCleanup, inspectControllerRecord, persistControllerCleanupReceipt,
  persistControllerAuthContext, persistControllerAuthContextEvidence,
  persistControllerIssueIntake, persistControllerIssueIntakeEvidence,
  registerControllerLifecycleResource
} from "../../sdd/autonomous-sdd-controller.mjs";

// The controller persists its state in the target repository's Git common
// directory, so the validated launcher target is the default repository path.
const repositoryPath = (payload) => payload?.repositoryPath ?? workspaceIoFromEnvironment()?.root;

runAsMain({
  helper: "autonomous-sdd-controller",
  invocation: "subcommand",
  operations: {
    "create-controller-record": (payload) => createControllerRecord({
      ...payload, repository: payload?.repository ?? repositoryPath(payload)
    }),
    "inspect-controller-record": (payload) => inspectControllerRecord(payload?.record, {
      authorization: payload?.authorization,
      repository: payload?.repository ?? repositoryPath(payload),
      ...(payload?.now ? { now: payload.now } : {})
    }),
    "advance-controller-record": (payload) => advanceControllerRecord(payload?.record, payload?.phase, payload?.evidence),
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
