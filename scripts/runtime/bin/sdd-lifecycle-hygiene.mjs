#!/usr/bin/env node
import { runAsMain } from "../payload-wrapper.mjs";
import { workspaceIoFromEnvironment } from "../workspace-io.mjs";
import {
  buildLifecycleReconciliationReport, captureDesignBrief, classifyLifecycleResource,
  discoverDesignBriefCandidates, rankDesignBriefCandidates, validateDesignBriefSource
} from "../../sdd/sdd-lifecycle-hygiene.mjs";

// These helpers take a workspace path directly, so the validated target from the
// launcher is used as the default when the request does not name one.
const workspace = (payload) => payload?.workspacePath ?? workspaceIoFromEnvironment()?.root;

runAsMain({
  helper: "sdd-lifecycle-hygiene",
  invocation: "payload",
  operations: {
    "validate-design-brief-source": (payload) => validateDesignBriefSource({ ...payload, workspacePath: workspace(payload) }),
    "capture-design-brief": (payload) => captureDesignBrief({ ...payload, workspacePath: workspace(payload) }),
    "discover-design-brief-candidates": (payload) => discoverDesignBriefCandidates({ ...payload, workspacePath: workspace(payload) }),
    "rank-design-brief-candidates": (payload) => rankDesignBriefCandidates(payload?.candidates, {
      changeName: payload?.changeName, issueNumber: payload?.issueNumber
    }),
    "classify-lifecycle-resource": (payload) => classifyLifecycleResource(payload?.resource ?? payload),
    "build-lifecycle-reconciliation-report": (payload) => buildLifecycleReconciliationReport(payload ?? {})
  }
});
