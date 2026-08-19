#!/usr/bin/env node
import { runAsMain } from "../payload-wrapper.mjs";
import {
  legacyMigrationAuthorizationPayload, migrateLegacyWorkspaceResource, planWorkspaceCleanup
} from "../../sdd/sdd-workspace-cleanup.mjs";

// `executeWorkspaceCleanup` requires injected removal, deletion, inspection, and
// persistence effects that only an owning controller can supply, so it is not a
// declared operation here. The effectful path stays behind
// `autonomous-sdd-controller execute-controller-lifecycle-cleanup`, which owns
// those operations and their receipts.
runAsMain({
  helper: "sdd-workspace-cleanup",
  invocation: "payload",
  operations: {
    "plan-workspace-cleanup": (payload) => planWorkspaceCleanup(payload ?? {}),
    "migrate-legacy-workspace-resource": (payload) => migrateLegacyWorkspaceResource(payload ?? {}),
    "legacy-migration-authorization-payload": (payload) => legacyMigrationAuthorizationPayload(payload?.authorization ?? payload)
  }
});
