import path from "node:path";

import { checkOperationAuthorization } from "./check-operation-authorization.mjs";

const slugs = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const deliveryProfiles = new Set(["prototype-rapid", "production-rapid"]);
const depths = new Set(["quick", "standard", "deep"]);
const depthSourceMinimums = Object.freeze({ quick: 5, standard: 10, deep: 25 });
const modelRoles = Object.freeze({ quick: "cheap-triage", standard: "balanced-standard", deep: "highest-quality" });
const lastKnownModels = Object.freeze({
  codex: { quick: "gpt-5.6-luna", standard: "gpt-5.6-terra", deep: "gpt-5.6-sol", sourceUrl: "https://developers.openai.com/codex/models" },
  claude: { quick: "Claude Haiku 3.5", standard: "Claude Sonnet 4", deep: "Claude Opus 4.1", sourceUrl: "https://docs.anthropic.com/en/docs/about-claude/models" }
});
const sourceClassifications = new Set(["verified-fact", "source-reported-claim", "assistant-inference", "unknown", "recommendation"]);

function safeWorkspacePath(value) {
  return typeof value === "string" && value.length > 0 && !path.isAbsolute(value) &&
    !/^[A-Za-z]:[\\/]/.test(value) && !value.split(/[\\/]/).includes("..");
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
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

function resolveArtifacts(paths, readArtifact) {
  if (typeof readArtifact !== "function") return { error: "No bounded artifact reader was supplied." };
  const artifacts = [];
  for (const artifactPath of paths) {
    if (!safeWorkspacePath(artifactPath)) return { error: `Unsafe artifact path: ${String(artifactPath)}` };
    try {
      const content = readArtifact(artifactPath);
      if (!nonEmpty(content)) return { error: `Artifact did not resolve to readable content: ${artifactPath}` };
      artifacts.push({ path: artifactPath, content });
    } catch {
      return { error: `Artifact did not resolve to readable content: ${artifactPath}` };
    }
  }
  return { artifacts };
}

function readOptionalArtifact(artifactPath, readArtifact) {
  if (typeof readArtifact !== "function") return { error: "No bounded artifact reader was supplied." };
  try {
    const content = readArtifact(artifactPath);
    return { content: nonEmpty(content) ? content : null };
  } catch (error) {
    if (error?.code === "ENOENT") return { content: null };
    return { error: `Existing artifact could not be inspected safely: ${artifactPath}` };
  }
}

function guidanceFor(input) {
  const providers = input.assistantProvider === "codex" || input.assistantProvider === "claude"
    ? [input.assistantProvider] : ["codex", "claude"];
  return Object.freeze({
    depth: input.depth,
    role: modelRoles[input.depth],
    providers: Object.freeze(providers.map((provider) => Object.freeze({
      provider,
      exactModel: lastKnownModels[provider][input.depth],
      sourceUrl: lastKnownModels[provider].sourceUrl,
      freshness: "stale-risk; verify current official provider documentation before use"
    }))),
    sessionModelChanged: false
  });
}

function displayModelGuidance(input, displayGuidance) {
  if (typeof displayGuidance !== "function") return { error: "Provide a bounded model-guidance display callback." };
  const guidance = guidanceFor(input);
  try {
    displayGuidance(guidance);
    return { guidance };
  } catch {
    return { error: "The model-guidance display callback failed." };
  }
}

function excerpt(value, limit = 280) {
  const normalized = String(value).replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, limit - 1)}…` : normalized;
}

function bullets(values, empty = "- None supplied.") {
  return Array.isArray(values) && values.length > 0 ? values.map((value) => `- ${String(value)}`).join("\n") : empty;
}

function researchContent(input, sources, existingContent) {
  const grouped = new Map([...sourceClassifications].map((classification) => [classification, []]));
  for (const source of sources) grouped.get(source.classification).push(source.claim ?? excerpt(source.content));
  const depthSections = {
    quick: ["## Core concepts", "## Top tools and products", "## Key links"],
    standard: ["## Use cases", "## SDLC fit", "## Open-source and paid options", "## Tutorials and articles", "## Project fit"],
    deep: ["## Comparative analysis", "## Tradeoffs", "## Maturity signals", "## Implementation patterns", "## Risks", "## Source quality notes"]
  };
  return [
    `# ${input.topic} research findings`,
    "",
    `Depth: ${input.depth}`,
    "",
    "## Summary",
    input.summary ?? `Synthesis of ${sources.length} supplied source${sources.length === 1 ? "" : "s"} for ${input.topic}.`,
    "",
    "## Verified facts",
    bullets(grouped.get("verified-fact")),
    "",
    "## Source-reported claims",
    bullets(grouped.get("source-reported-claim")),
    "",
    "## Assistant inferences",
    bullets(grouped.get("assistant-inference")),
    "",
    "## Unknowns",
    bullets(grouped.get("unknown")),
    "",
    "## Recommendations",
    bullets(grouped.get("recommendation")),
    "",
    ...depthSections[input.depth].flatMap((heading) => [heading, "- See the classified findings and linked sources above.", ""]),
    "## Source material used as data",
    ...sources.flatMap((source) => [`### ${source.title}`, `> ${excerpt(source.content).replace(/\n/g, "\n> ")}`, ""]),
    ...(existingContent ? ["## Preserved prior findings", "The prior document is retained verbatim for accuracy reconciliation during this update.", "", existingContent.trim(), ""] : [])
  ].join("\n").trimEnd() + "\n";
}

function sourcesContent(input, sources, existingContent) {
  return [
    `# Sources for ${input.topic}`,
    "",
    ...sources.flatMap((source) => [
      `## ${source.title}`,
      `- Publisher: ${source.publisher}`,
      `- URL or path: ${source.urlOrPath}`,
      `- Access date: ${source.accessDate}`,
      `- Source type: ${source.sourceType}`,
      `- Relevance: ${source.relevance}`,
      `- Classification: ${source.classification}`,
      ""
    ]),
    ...(existingContent ? ["## Preserved prior source record", "", existingContent.trim(), ""] : [])
  ].join("\n").trimEnd() + "\n";
}

function resolveResearchSources(sources, readArtifact) {
  if (!Array.isArray(sources) || sources.length === 0) return { error: "Provide at least one complete research source." };
  const resolved = [];
  for (const [index, source] of sources.entries()) {
    if (!source || !nonEmpty(source.id) || !nonEmpty(source.title) || !nonEmpty(source.publisher) ||
      !nonEmpty(source.urlOrPath) || !nonEmpty(source.accessDate) || !nonEmpty(source.sourceType) ||
      !nonEmpty(source.relevance) || !sourceClassifications.has(source.classification)) {
      return { error: `Source ${index + 1} is missing required provenance or classification.` };
    }
    let content = source.content;
    if (!nonEmpty(content) && safeWorkspacePath(source.path)) {
      const resolution = resolveArtifacts([source.path], readArtifact);
      if (resolution.error) return resolution;
      content = resolution.artifacts[0].content;
    }
    if (!nonEmpty(content)) return { error: `Source ${source.id} has no readable content.` };
    resolved.push({ ...source, content });
  }
  return { sources: resolved };
}

function designBriefContent(input, research, context) {
  const evidence = [...research, ...context];
  const action = input.recommendedNextAction === "openspec-propose" ? "OpenSpec Propose" : "OpenSpec Explore";
  return [
    `# ${input.briefSlug ?? "Design"} design brief`,
    "",
    "## 1. Problem and desired outcome",
    `Problem: ${input.problem}`,
    `Desired outcome: ${input.desiredOutcome}`,
    "",
    "## 2. Evidence and key findings",
    ...evidence.map(({ path: sourcePath, content }) => `- [${sourcePath}](${sourcePath}): ${excerpt(content)}`),
    "",
    "## 3. Options considered and tradeoffs",
    bullets(input.options),
    "",
    "## 4. Decisions, assumptions, and owner",
    `- Owner: ${input.decisionOwner ?? "Not yet named"}`,
    `- Confirmed decisions: ${input.ownerDecisionConfirmed === true ? (input.decisions ?? []).join("; ") || "None supplied." : "None; recommendation remains pending owner decision."}`,
    `- Assumptions: ${(input.assumptions ?? []).join("; ") || "None supplied."}`,
    "",
    "## 5. Scope, non-goals, constraints, dependencies, and risks",
    `- Scope: ${input.scope}`,
    `- Non-goals: ${input.nonGoals}`,
    `- Constraints: ${(input.constraints ?? []).join("; ") || "None supplied."}`,
    `- Dependencies: ${(input.dependencies ?? []).join("; ") || "None supplied."}`,
    `- Risks: ${(input.risks ?? []).join("; ") || "None supplied."}`,
    "",
    "## 6. Open questions and blocking decisions",
    bullets(input.unresolvedQuestions),
    "",
    "## 7. Recommended next step",
    `Recommendation pending owner confirmation: ${input.recommendation}`,
    `Recommended workflow action: ${action}. No OpenSpec artifacts were created.`
  ].join("\n") + "\n";
}

function missingDesignField(input) {
  for (const field of ["problem", "desiredOutcome", "scope", "nonGoals", "recommendation"]) if (!nonEmpty(input[field])) return field;
  if (!Array.isArray(input.options) || input.options.length === 0) return "options";
  return null;
}

function missingCandidateField(candidate) {
  if (!candidate || typeof candidate !== "object") return "candidate";
  for (const field of ["name", "outcome", "scope", "nonGoals", "firstAction", "profileRationale"]) if (!nonEmpty(candidate[field])) return field;
  for (const field of ["acceptanceEvidence", "dependencies", "sharedResourceHazards", "parallelWork", "evalNeeds", "guardrailNeeds"]) {
    if (!Array.isArray(candidate[field]) || candidate[field].length === 0) return field;
  }
  return null;
}

function preapprovalIssue(input) {
  const preapproval = input.candidate?.preapproval;
  if (preapproval === undefined) return null;
  if (!preapproval || typeof preapproval !== "object") return "Provide a structured proposed preapproval.";
  if (input.deliveryProfile !== "prototype-rapid") return "A one-change preapproval may be proposed only for prototype-rapid.";
  for (const field of ["target", "action", "evidence", "recovery", "expiresAt"]) {
    if (!nonEmpty(preapproval[field])) return `Provide the proposed preapproval field: ${field}.`;
  }
  const expiration = Date.parse(preapproval.expiresAt);
  const now = Date.parse(input.now ?? new Date().toISOString());
  if (Number.isNaN(expiration) || expiration <= now) return "Provide a valid future proposed preapproval expiration.";
  return null;
}

function deliveryPlanContent(input, requirements, designBrief) {
  const candidate = input.candidate;
  const nextAction = input.nextOpenSpecAction === "openspec-propose" ? "OpenSpec Propose" : "OpenSpec Explore";
  const approval = candidate.preapproval
    ? `Proposed one-change preapproval — target: ${candidate.preapproval.target}; action: ${candidate.preapproval.action}; evidence: ${candidate.preapproval.evidence}; recovery: ${candidate.preapproval.recovery}; expires: ${candidate.preapproval.expiresAt}. This is proposed, not granted.`
    : "Normal interactive just-in-time approval applies before merge, merged-topic-branch deletion, and OpenSpec Archive.";
  return [
    `# ${input.planSlug ?? "Delivery"} plan`,
    "",
    "## Outcome-oriented milestone",
    candidate.outcome,
    "",
    "## Proposed candidate change",
    `Proposed change name: ${candidate.name}`,
    `Delivery profile: ${input.deliveryProfile} — ${candidate.profileRationale}`,
    "",
    "## Scope and non-goals",
    `- Scope: ${candidate.scope}`,
    `- Non-goals: ${candidate.nonGoals}`,
    "",
    "## Dependencies, shared-resource hazards, and parallel work",
    `Dependencies:\n${bullets(candidate.dependencies)}`,
    `Shared-resource hazards:\n${bullets(candidate.sharedResourceHazards)}`,
    `Candidate parallel work:\n${bullets(candidate.parallelWork)}`,
    "Live in-flight/actionable/blocked/next-work classification is delegated to dependency-aware-work-selection.",
    "",
    "## Acceptance evidence, evaluations, and guardrails",
    `Acceptance evidence:\n${bullets(candidate.acceptanceEvidence)}`,
    `Evaluation needs:\n${bullets(candidate.evalNeeds)}`,
    `Guardrail needs:\n${bullets(candidate.guardrailNeeds)}`,
    "",
    "## Recommended first change",
    candidate.firstAction,
    "",
    "## Delivery authority",
    approval,
    "",
    "## Source inputs reviewed",
    `- [${input.requirementsPath}](${input.requirementsPath}): ${excerpt(requirements)}`,
    `- [${input.designBriefPath}](${input.designBriefPath}): ${excerpt(designBrief)}`,
    "",
    "## Next OpenSpec action",
    `${nextAction}. It must read ${input.requirementsPath} and ${input.designBriefPath}. No OpenSpec artifacts or governance records were created.`
  ].join("\n") + "\n";
}

export function executeResearchTopicWorkflow(input = {}, { readArtifact, writeArtifact, displayGuidance } = {}) {
  const skill = "research-topic-workflow";
  const mode = commonMode(input);
  if (input.requestKind !== skill) return noOp(skill, mode);
  if (!slugs.test(input.topic ?? "")) return gap(skill, mode, "blocked", "missing-topic", "Provide a valid topic slug.");
  if (!slugs.test(input.category ?? "")) return gap(skill, mode, "blocked", "missing-category", "Provide a valid category slug.");
  if (!depths.has(input.depth)) return gap(skill, mode, "blocked", "missing-depth", "Select quick, standard, or deep research depth.");
  const destination = input.destination ?? input.config?.defaults?.researchRoot;
  if (!safeWorkspacePath(destination)) return gap(skill, mode, "blocked", "missing-destination", "Provide a safe workspace-relative research destination.");
  const pauseCondition = [
    [input.requiresNewCredentials, "new-credentials-required", "A source requires new credentials."],
    [input.requiresUnapprovedConnector, "unapproved-connector-required", "A source requires an unapproved connector."],
    [input.requiresSensitiveData, "sensitive-data-required", "The request requires access to sensitive data."],
    [input.sourcesConflict, "conflicting-sources", "Sources conflict on a point material to the recommendation."],
    [input.requiresUndecidedMaterialDecision, "unauthorized-decision", "The request expands into a decision the user has not authorized."]
  ].find(([active]) => active === true);
  if (pauseCondition) return gap(skill, mode, "blocked", pauseCondition[1], pauseCondition[2]);
  const guidanceDisplay = displayModelGuidance(input, displayGuidance);
  if (guidanceDisplay.error) return gap(skill, mode, "blocked", "model-guidance-unavailable", guidanceDisplay.error);
  const sourceResolution = resolveResearchSources(input.sources, readArtifact);
  if (sourceResolution.error) return gap(skill, mode, "blocked", "missing-source-material", sourceResolution.error);
  if (sourceResolution.sources.length < depthSourceMinimums[input.depth]) {
    return gap(skill, mode, "blocked", "insufficient-source-depth", `${input.depth} research requires at least ${depthSourceMinimums[input.depth]} sources.`);
  }
  if (typeof writeArtifact !== "function") return gap(skill, mode, "blocked", "missing-writer", "Provide a bounded artifact writer.");

  const root = path.posix.join(destination, input.category, input.topic);
  const findingsPath = path.posix.join(root, `${input.topic}-findings.md`);
  const sourcesPath = path.posix.join(root, "sources.md");
  const existingFindingsResolution = readOptionalArtifact(findingsPath, readArtifact);
  const existingSourcesResolution = readOptionalArtifact(sourcesPath, readArtifact);
  if (existingFindingsResolution.error || existingSourcesResolution.error) {
    return gap(skill, mode, "blocked", "existing-artifact-unreadable", existingFindingsResolution.error ?? existingSourcesResolution.error);
  }
  const existingFindings = existingFindingsResolution.content;
  const existingSources = existingSourcesResolution.content;
  const operations = [
    { operation: "write-findings", path: findingsPath, target: `workspace:${findingsPath}`, contentKind: "research-findings", content: researchContent(input, sourceResolution.sources, existingFindings), artifactOperation: existingFindings ? "updated" : "created" },
    { operation: "write-sources", path: sourcesPath, target: `workspace:${sourcesPath}`, contentKind: "research-sources", content: sourcesContent(input, sourceResolution.sources, existingSources), artifactOperation: existingSources ? "updated" : "created" }
  ];
  const checks = authorize(input, "research-read-only", operations);
  if (checks.some((check) => check.allowed !== true)) return pauseForAuthorization(skill, mode, checks);
  performWrites(operations, writeArtifact);
  return result(skill, mode, "completed", "Durable research artifacts were written at the selected depth.", {
    artifacts: operations.map(({ path: subject, artifactOperation: operation }) => ({ kind: "file", operation, subject })),
    evidence: [
      { id: "input-validation", type: "validation", subject: `${input.depth} research request and source content`, result: "passed" },
      { id: "source-boundary", type: "validation", subject: "source content treated as untrusted data", result: "passed" },
      ...(mode === "autonomous" ? [{ id: "operation-authorization", type: "validation", subject: "research-read-only writes", result: "passed" }] : [])
    ],
    details: { depth: input.depth, sourceIds: sourceResolution.sources.map((source) => source.id), modelGuidanceDisplayed: true, modelRole: guidanceDisplay.guidance.role }
  });
}

export function executeDesignBriefFromResearch(input = {}, { readArtifact, writeArtifact } = {}) {
  const skill = "design-brief-from-research";
  const mode = commonMode(input);
  if (input.requestKind !== skill) return noOp(skill, mode);
  if (!Array.isArray(input.researchPaths) || input.researchPaths.length === 0 || input.researchPaths.some((entry) => !safeWorkspacePath(entry))) {
    return gap(skill, mode, "paused", "missing-research", "Provide at least one resolvable workspace-relative research path.");
  }
  const contextPaths = Array.isArray(input.contextPaths) ? input.contextPaths : [];
  if (contextPaths.some((entry) => !safeWorkspacePath(entry))) return gap(skill, mode, "paused", "missing-context", "Provide only resolvable workspace-relative context paths.");
  const resolvedResearch = resolveArtifacts(input.researchPaths, readArtifact);
  if (resolvedResearch.error) return gap(skill, mode, "paused", "missing-research", resolvedResearch.error);
  const resolvedContext = resolveArtifacts(contextPaths, readArtifact);
  if (resolvedContext.error) return gap(skill, mode, "paused", "missing-context", resolvedContext.error);
  if (input.sourcesConflict === true) return gap(skill, mode, "paused", "conflicting-sources", "Resolve the material source conflict or record a defensible interpretation.");
  if (input.requiresUndecidedMaterialDecision === true || input.falseApprovalClaim === true) {
    return gap(skill, mode, "paused", "owner-decision-required", "Provide the missing owner decision or remove the unsupported approval claim.");
  }
  const missingField = missingDesignField(input);
  if (missingField) return gap(skill, mode, "paused", "missing-brief-input", `Provide the material brief field: ${missingField}.`);
  const outputPath = input.outputPath ?? (safeWorkspacePath(input.config?.defaults?.designBriefRoot) && slugs.test(input.briefSlug ?? "")
    ? path.posix.join(input.config.defaults.designBriefRoot, `${input.briefSlug}.md`) : null);
  if (!safeWorkspacePath(outputPath)) return gap(skill, mode, "paused", "missing-output", "Provide a safe workspace-relative brief output path.");
  if (typeof writeArtifact !== "function") return gap(skill, mode, "paused", "missing-writer", "Provide a bounded artifact writer.");
  const operations = [{ operation: "local-edit", path: outputPath, target: `workspace:${outputPath}`, contentKind: "design-brief", content: designBriefContent(input, resolvedResearch.artifacts, resolvedContext.artifacts) }];
  const checks = authorize(input, "local-implementation", operations);
  if (checks.some((check) => check.allowed !== true)) return pauseForAuthorization(skill, mode, checks);
  performWrites(operations, writeArtifact);
  return result(skill, mode, "completed", "A seven-section design brief was written without creating OpenSpec artifacts.", {
    artifacts: [{ kind: "file", operation: "created", subject: outputPath }],
    evidence: [
      { id: "input-validation", type: "validation", subject: "resolved research and context content", result: "passed" },
      { id: "source-boundary", type: "validation", subject: "research content treated as untrusted data", result: "passed" },
      ...(mode === "autonomous" ? [{ id: "operation-authorization", type: "validation", subject: "local-implementation brief write", result: "passed" }] : [])
    ],
    nextAction: { kind: input.recommendedNextAction === "openspec-propose" ? "openspec-propose" : "openspec-explore", description: "Review the brief before starting the recommended OpenSpec action." },
    details: { sections: 7, openspecArtifactsCreated: false, recommendationConfirmedAsDecision: input.ownerDecisionConfirmed === true }
  });
}

export function executeSddRequirementsToPlan(input = {}, { readArtifact, writeArtifact } = {}) {
  const skill = "sdd-requirements-to-plan";
  const mode = commonMode(input);
  if (input.requestKind !== skill) return noOp(skill, mode);
  if (!safeWorkspacePath(input.requirementsPath)) return gap(skill, mode, "paused", "missing-requirements", "Provide a workspace-relative accepted-requirements path.");
  if (!safeWorkspacePath(input.designBriefPath)) return gap(skill, mode, "paused", "missing-design-brief", "Provide a workspace-relative approved design-brief path.");
  const resolved = resolveArtifacts([input.requirementsPath, input.designBriefPath], readArtifact);
  if (resolved.error) return gap(skill, mode, "paused", "unresolved-source-path", resolved.error);
  if (!deliveryProfiles.has(input.deliveryProfile)) return gap(skill, mode, "paused", "missing-delivery-profile", "Select prototype-rapid or production-rapid for this candidate.");
  if (Array.isArray(input.readinessGaps) && input.readinessGaps.length > 0) {
    return gap(skill, mode, "paused", "readiness-gap", String(input.readinessGaps[0]));
  }
  const missingField = missingCandidateField(input.candidate);
  if (missingField) return gap(skill, mode, "paused", "readiness-gap", `Provide the candidate readiness field: ${missingField}.`);
  const invalidPreapproval = preapprovalIssue(input);
  if (invalidPreapproval) return gap(skill, mode, "paused", "invalid-preapproval", invalidPreapproval);
  const outputPath = input.outputPath ?? (safeWorkspacePath(input.config?.defaults?.planRoot) && slugs.test(input.planSlug ?? "")
    ? path.posix.join(input.config.defaults.planRoot, `${input.planSlug}.md`) : null);
  if (!safeWorkspacePath(outputPath)) return gap(skill, mode, "paused", "missing-output", "Provide a safe workspace-relative delivery-plan output path.");
  if (typeof writeArtifact !== "function") return gap(skill, mode, "paused", "missing-writer", "Provide a bounded artifact writer.");
  const operations = [{ operation: "local-edit", path: outputPath, target: `workspace:${outputPath}`, contentKind: "delivery-plan", content: deliveryPlanContent(input, resolved.artifacts[0].content, resolved.artifacts[1].content) }];
  const checks = authorize(input, "local-implementation", operations);
  if (checks.some((check) => check.allowed !== true)) return pauseForAuthorization(skill, mode, checks);
  performWrites(operations, writeArtifact);
  return result(skill, mode, "completed", "A reviewable delivery plan was written without governance or OpenSpec mutation.", {
    artifacts: [{ kind: "file", operation: "created", subject: outputPath }],
    evidence: [
      { id: "input-validation", type: "validation", subject: "resolved requirements, design, profile, and readiness", result: "passed" },
      { id: "content-boundary", type: "validation", subject: "requirements treated as data and live state delegated", result: "passed" },
      ...(mode === "autonomous" ? [{ id: "operation-authorization", type: "validation", subject: "local-implementation plan write", result: "passed" }] : [])
    ],
    nextAction: { kind: input.nextOpenSpecAction === "openspec-propose" ? "openspec-propose" : "openspec-explore", description: "Review the plan and source paths before the next OpenSpec action." },
    details: { deliveryProfile: input.deliveryProfile, openspecArtifactsCreated: false, governanceRecordsCreated: false, liveStateDelegatedTo: "dependency-aware-work-selection" }
  });
}
