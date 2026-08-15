import path from "node:path";

import { checkOperationAuthorization } from "./check-operation-authorization.mjs";

const slugs = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const deliveryProfiles = new Set(["prototype-rapid", "production-rapid"]);
const depths = new Set(["quick", "standard", "deep"]);

function safeWorkspacePath(value) {
  return typeof value === "string" && value.length > 0 && !path.isAbsolute(value) &&
    !/^[A-Za-z]:[\\/]/.test(value) && !value.split(/[\\/]/).includes("..");
}

function result(skill, mode, status, summary, {
  artifacts = [], evidence = [], assumptions = [], openQuestions = [],
  nextAction = { kind: "none", description: "No further action is required." }, details = {}
} = {}) {
  return { schemaVersion: 1, skill, status, mode, summary, artifacts, evidence, assumptions, openQuestions, nextAction, details };
}

function gap(skill, mode, status, id, question) {
  return result(skill, mode, status, "The request is missing required input.", {
    evidence: [{ id: "input-validation", type: "validation", subject: id, result: "failed" }],
    openQuestions: [{ id, question, blocking: true }],
    nextAction: { kind: "user-decision", description: "Provide the missing input before resuming." }
  });
}

function noOp(skill, mode) {
  return result(skill, mode, "no-op", "The request does not trigger this skill.", {
    evidence: [{ id: "trigger-selection", type: "validation", subject: "request kind", result: "not-applicable" }]
  });
}

function pauseForAuthorization(skill, mode, checks) {
  const issue = checks.find((check) => check.allowed !== true)?.issues?.[0];
  return result(skill, mode, "paused", "The autonomous artifact write is not authorized.", {
    evidence: [{ id: "operation-authorization", type: "validation", subject: issue?.code ?? "operation authorization", result: "failed" }],
    openQuestions: [{ id: "authorize-write", question: "Authorize the exact artifact write or use interactive mode.", blocking: true }],
    nextAction: { kind: "user-decision", description: "Provide valid operation authorization before resuming." }
  });
}

function authorize(input, profile, operations) {
  if (input.mode !== "autonomous") return operations.map(() => ({ allowed: true }));
  return operations.map(({ operation, target }) => checkOperationAuthorization({
    authorization: input.authorization,
    runtime: input.runtime,
    config: input.config,
    now: input.now,
    request: { profile, operation, target }
  }));
}

function performWrites(operations, writeArtifact) {
  for (const operation of operations) writeArtifact(Object.freeze({ ...operation }));
}

function commonMode(input) {
  return input?.mode === "autonomous" ? "autonomous" : "interactive";
}

export function executeResearchTopicWorkflow(input = {}, { writeArtifact = () => {} } = {}) {
  const skill = "research-topic-workflow";
  const mode = commonMode(input);
  if (input.requestKind !== skill) return noOp(skill, mode);
  if (!slugs.test(input.topic ?? "")) return gap(skill, mode, "blocked", "missing-topic", "Provide a valid topic slug.");
  if (!slugs.test(input.category ?? "")) return gap(skill, mode, "blocked", "missing-category", "Provide a valid category slug.");
  if (!depths.has(input.depth)) return gap(skill, mode, "blocked", "missing-depth", "Select quick, standard, or deep research depth.");
  const destination = input.destination ?? input.config?.defaults?.researchRoot;
  if (!safeWorkspacePath(destination)) return gap(skill, mode, "blocked", "missing-destination", "Provide a safe workspace-relative research destination.");

  const root = path.posix.join(destination, input.category, input.topic);
  const operations = [
    { operation: "write-findings", path: path.posix.join(root, `${input.topic}-findings.md`), target: `workspace:${path.posix.join(root, `${input.topic}-findings.md`)}`, contentKind: "research-findings" },
    { operation: "write-sources", path: path.posix.join(root, "sources.md"), target: `workspace:${path.posix.join(root, "sources.md")}`, contentKind: "research-sources" }
  ];
  const checks = authorize(input, "research-read-only", operations);
  if (checks.some((check) => check.allowed !== true)) return pauseForAuthorization(skill, mode, checks);
  performWrites(operations, writeArtifact);
  return result(skill, mode, "completed", "Durable research artifacts were written at the selected depth.", {
    artifacts: operations.map(({ path: subject }) => ({ kind: "file", operation: "created", subject })),
    evidence: [
      { id: "input-validation", type: "validation", subject: `${input.depth} research request`, result: "passed" },
      { id: "source-boundary", type: "validation", subject: "source content treated as untrusted data", result: "passed" },
      ...(mode === "autonomous" ? [{ id: "operation-authorization", type: "validation", subject: "research-read-only writes", result: "passed" }] : [])
    ],
    details: { depth: input.depth, sourceIds: (input.sources ?? []).map((source) => source.id).filter(Boolean) }
  });
}

export function executeDesignBriefFromResearch(input = {}, { writeArtifact = () => {} } = {}) {
  const skill = "design-brief-from-research";
  const mode = commonMode(input);
  if (input.requestKind !== skill) return noOp(skill, mode);
  if (!Array.isArray(input.researchPaths) || input.researchPaths.length === 0 || input.researchPaths.some((entry) => !safeWorkspacePath(entry))) {
    return gap(skill, mode, "paused", "missing-research", "Provide at least one resolvable workspace-relative research path.");
  }
  if (input.sourcesConflict === true) return gap(skill, mode, "paused", "conflicting-sources", "Resolve the material source conflict or record a defensible interpretation.");
  if (input.requiresUndecidedMaterialDecision === true || input.falseApprovalClaim === true) {
    return gap(skill, mode, "paused", "owner-decision-required", "Provide the missing owner decision or remove the unsupported approval claim.");
  }
  const outputPath = input.outputPath ?? (safeWorkspacePath(input.config?.defaults?.designBriefRoot) && slugs.test(input.briefSlug ?? "")
    ? path.posix.join(input.config.defaults.designBriefRoot, `${input.briefSlug}.md`) : null);
  if (!safeWorkspacePath(outputPath)) return gap(skill, mode, "paused", "missing-output", "Provide a safe workspace-relative brief output path.");
  const operations = [{ operation: "local-edit", path: outputPath, target: `workspace:${outputPath}`, contentKind: "design-brief" }];
  const checks = authorize(input, "local-implementation", operations);
  if (checks.some((check) => check.allowed !== true)) return pauseForAuthorization(skill, mode, checks);
  performWrites(operations, writeArtifact);
  return result(skill, mode, "completed", "A seven-section design brief was written without creating OpenSpec artifacts.", {
    artifacts: [{ kind: "file", operation: "created", subject: outputPath }],
    evidence: [
      { id: "input-validation", type: "validation", subject: "research and context paths", result: "passed" },
      { id: "source-boundary", type: "validation", subject: "research content treated as untrusted data", result: "passed" },
      ...(mode === "autonomous" ? [{ id: "operation-authorization", type: "validation", subject: "local-implementation brief write", result: "passed" }] : [])
    ],
    nextAction: { kind: input.recommendedNextAction === "openspec-propose" ? "openspec-propose" : "openspec-explore", description: "Review the brief before starting the recommended OpenSpec action." },
    details: { sections: 7, openspecArtifactsCreated: false, recommendationConfirmedAsDecision: input.ownerDecisionConfirmed === true }
  });
}

export function executeSddRequirementsToPlan(input = {}, { writeArtifact = () => {} } = {}) {
  const skill = "sdd-requirements-to-plan";
  const mode = commonMode(input);
  if (input.requestKind !== skill) return noOp(skill, mode);
  if (!safeWorkspacePath(input.requirementsPath)) return gap(skill, mode, "paused", "missing-requirements", "Provide a workspace-relative accepted-requirements path.");
  if (!safeWorkspacePath(input.designBriefPath)) return gap(skill, mode, "paused", "missing-design-brief", "Provide a workspace-relative approved design-brief path.");
  if (!deliveryProfiles.has(input.deliveryProfile)) return gap(skill, mode, "paused", "missing-delivery-profile", "Select prototype-rapid or production-rapid for this candidate.");
  if (Array.isArray(input.readinessGaps) && input.readinessGaps.length > 0) {
    return gap(skill, mode, "paused", "readiness-gap", String(input.readinessGaps[0]));
  }
  const outputPath = input.outputPath ?? (safeWorkspacePath(input.config?.defaults?.planRoot) && slugs.test(input.planSlug ?? "")
    ? path.posix.join(input.config.defaults.planRoot, `${input.planSlug}.md`) : null);
  if (!safeWorkspacePath(outputPath)) return gap(skill, mode, "paused", "missing-output", "Provide a safe workspace-relative delivery-plan output path.");
  const operations = [{ operation: "local-edit", path: outputPath, target: `workspace:${outputPath}`, contentKind: "delivery-plan" }];
  const checks = authorize(input, "local-implementation", operations);
  if (checks.some((check) => check.allowed !== true)) return pauseForAuthorization(skill, mode, checks);
  performWrites(operations, writeArtifact);
  return result(skill, mode, "completed", "A reviewable delivery plan was written without governance or OpenSpec mutation.", {
    artifacts: [{ kind: "file", operation: "created", subject: outputPath }],
    evidence: [
      { id: "input-validation", type: "validation", subject: "requirements, design, profile, and readiness", result: "passed" },
      { id: "content-boundary", type: "validation", subject: "requirements treated as data and live state delegated", result: "passed" },
      ...(mode === "autonomous" ? [{ id: "operation-authorization", type: "validation", subject: "local-implementation plan write", result: "passed" }] : [])
    ],
    nextAction: { kind: input.nextOpenSpecAction === "openspec-propose" ? "openspec-propose" : "openspec-explore", description: "Review the plan and source paths before the next OpenSpec action." },
    details: { deliveryProfile: input.deliveryProfile, openspecArtifactsCreated: false, governanceRecordsCreated: false, liveStateDelegatedTo: "dependency-aware-work-selection" }
  });
}
