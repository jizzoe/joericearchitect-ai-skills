#!/usr/bin/env node
import { runAsMain } from "../payload-wrapper.mjs";
import { workspaceIoFromEnvironment } from "../workspace-io.mjs";
import {
  executeDesignBriefFromResearch, executeResearchTopicWorkflow, executeSddRequirementsToPlan
} from "../../sdd/research-planning-skill-runtime.mjs";
import { validateRequirementsOutcomesV1 } from "../../sdd/requirements-outcomes-v1.mjs";

// The launcher supplies the validated target repository, so workspace reads and
// writes stay inside it. Guidance display and existing-artifact reconciliation
// need the calling assistant's judgement, so they are supplied by the request
// rather than invented here: guidance is returned in the result, and a
// reconciliation is used only when the request declares one for that path.
function injections(payload) {
  const io = workspaceIoFromEnvironment();
  const displayed = [];
  const reconciliations = payload?.reconciliations ?? {};
  return {
    displayed,
    io: {
      readArtifact: io ? io.readArtifact : undefined,
      writeArtifact: io ? io.writeArtifact : undefined,
      writeArtifactsAtomically: io ? io.writeArtifactsAtomically : undefined,
      validateRequirementsOutcomes: validateRequirementsOutcomesV1,
      displayGuidance: (guidance) => { displayed.push(guidance); },
      reconcileExistingArtifact: Object.keys(reconciliations).length > 0
        ? ({ artifactPath }) => reconciliations[artifactPath]
        : undefined
    }
  };
}

function run(execute) {
  return (payload) => {
    const { io, displayed } = injections(payload);
    const result = execute(payload?.input ?? payload ?? {}, io);
    return displayed.length > 0 ? { ...result, modelGuidance: displayed } : result;
  };
}

runAsMain({
  helper: "research-planning-skill-runtime",
  invocation: "payload",
  operations: {
    "execute-research-topic-workflow": run(executeResearchTopicWorkflow),
    "execute-design-brief-from-research": run(executeDesignBriefFromResearch),
    "execute-sdd-requirements-to-plan": run(executeSddRequirementsToPlan)
  }
});
