import path from "node:path";
import { createHash } from "node:crypto";

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
const sourceTypes = new Set(["primary", "secondary", "tertiary"]);
const claimDomains = new Set(["general", "technical", "pricing", "policy", "api", "current-product"]);
const primaryPreferredDomains = new Set(["technical", "pricing", "policy", "api", "current-product"]);
const preapprovalTargetPrefixes = Object.freeze({ "merge-pr": "pr:", "archive-change": "change:", "delete-merged-topic-branch": "branch:" });

function safeWorkspacePath(value) {
  return typeof value === "string" && value.length > 0 && !path.isAbsolute(value) &&
    !/^[A-Za-z]:[\\/]/.test(value) && !value.split(/[\\/]/).includes("..");
}

function resolveWorkspacePath(targetWorkspace, artifactPath) {
  if (!safeWorkspacePath(targetWorkspace) || !safeWorkspacePath(artifactPath)) return null;
  const workspace = path.posix.normalize(targetWorkspace.replaceAll("\\", "/"));
  const relative = path.posix.normalize(artifactPath.replaceAll("\\", "/"));
  const resolved = workspace === "." ? relative : path.posix.join(workspace, relative);
  return safeWorkspacePath(resolved) ? resolved : null;
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validBranchName(value) {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim() || value === "@" ||
    !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value) || value.endsWith("/") || value.endsWith(".") ||
    value.includes("//") || value.includes("..") || value.includes("@{")) return false;
  return value.split("/").every((segment) => segment.length > 0 && !segment.startsWith(".") && !segment.endsWith(".lock"));
}

function validPreapprovalTarget(action, target) {
  if (typeof target !== "string") return false;
  if (action === "merge-pr") return /^pr:[1-9]\d*$/.test(target);
  if (action === "archive-change") return target.startsWith("change:") && slugs.test(target.slice("change:".length));
  if (action === "delete-merged-topic-branch") return target.startsWith("branch:") && validBranchName(target.slice("branch:".length));
  return false;
}

function validIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
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
  if (operations.length !== 1) return { error: "The single-artifact writer received a multi-artifact operation." };
  try {
    const receipt = writeArtifact(Object.freeze({ ...operations[0] }));
    if (receipt?.committed !== true) return { error: "The bounded artifact writer did not commit." };
    return { committed: true };
  } catch {
    return { error: "The bounded artifact writer failed." };
  }
}

function performAtomicWrites(operations, writeArtifactsAtomically) {
  if (typeof writeArtifactsAtomically !== "function") return { error: "Provide a bounded atomic artifact writer." };
  try {
    const frozenOperations = Object.freeze(operations.map((operation) => Object.freeze({ ...operation })));
    const receipt = writeArtifactsAtomically(frozenOperations);
    if (receipt?.committed !== true) return { error: "The atomic artifact transaction did not commit." };
    return { committed: true };
  } catch {
    return { error: "The atomic artifact transaction failed without committing." };
  }
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
    lookupDate: input.modelGuidanceLookupDate,
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
  if (!validIsoDate(input.modelGuidanceLookupDate)) {
    return { error: "Provide the model-guidance lookup date in YYYY-MM-DD form." };
  }
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

function markdownText(value) {
  return String(value).replace(/\s+/g, " ").trim().replace(/[\\`*_[\]<>#()]/g, "\\$&");
}

function workspaceLink(value) {
  const target = String(value).split("/").map((segment) => encodeURIComponent(segment)).join("/");
  return `[${markdownText(value)}](${target})`;
}

function canonicalSourceId(value) {
  return String(value).normalize("NFKC").trim().toLowerCase();
}

function canonicalSourceLocation(value) {
  const raw = String(value).trim();
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(?:utm_.+|fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    url.pathname = url.pathname.split("/").map((segment) => encodeURIComponent(decodeURIComponent(segment))).join("/");
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.href;
  } catch {
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return null;
    if (!safeWorkspacePath(raw)) return null;
    return path.posix.normalize(raw.replaceAll("\\", "/")).replace(/\/+$/, "");
  }
}

function bullets(values, empty = "- None supplied.") {
  return Array.isArray(values) && values.length > 0 ? values.map((value) => `- ${markdownText(value)}`).join("\n") : empty;
}

function researchContent(input, sources, guidance) {
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
    `Summary: ${markdownText(input.summary ?? `Synthesis of ${sources.length} supplied source${sources.length === 1 ? "" : "s"} for ${input.topic}.`)}`,
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
    "## Model guidance provenance",
    `- Role: ${markdownText(guidance.role)}`,
    `- Lookup date: ${markdownText(guidance.lookupDate)}`,
    ...guidance.providers.map(({ provider, exactModel, sourceUrl, freshness }) =>
      `- ${markdownText(provider)}: ${markdownText(exactModel)}; source: ${markdownText(sourceUrl)}; ${markdownText(freshness)}`),
    "",
    ...depthSections[input.depth].flatMap((heading) => [heading, "- See the classified findings and linked sources above.", ""]),
    "## Source material used as data",
    ...sources.flatMap((source) => [`### ${markdownText(source.title)}`, `> ${markdownText(excerpt(source.content))}`, ""])
  ].join("\n").trimEnd() + "\n";
}

function sourcesContent(input, sources) {
  return [
    `# Sources for ${input.topic}`,
    "",
    ...sources.flatMap((source) => [
      `## ${markdownText(source.title)}`,
      `- Publisher: ${markdownText(source.publisher)}`,
      `- URL or path: ${markdownText(source.urlOrPath)}`,
      `- Access date: ${markdownText(source.accessDate)}`,
      `- Source type: ${markdownText(source.sourceType)}`,
      `- Relevance: ${markdownText(source.relevance)}`,
      `- Classification: ${markdownText(source.classification)}`,
      `- Claim domain: ${markdownText(source.claimDomain)}`,
      ""
    ])
  ].join("\n").trimEnd() + "\n";
}

function reconcileArtifact(artifactPath, generatedContent, existingContent, reconcileExistingArtifact) {
  if (!existingContent) return { content: generatedContent, artifactOperation: "created", retained: [], stale: [] };
  if (typeof reconcileExistingArtifact !== "function") return { error: `Existing artifact requires bounded accuracy reconciliation: ${artifactPath}` };
  let reconciliation;
  try {
    reconciliation = reconcileExistingArtifact(Object.freeze({ artifactPath, generatedContent, existingContent }));
  } catch {
    return { error: `Existing artifact reconciliation failed: ${artifactPath}` };
  }
  if (!reconciliation || !nonEmpty(reconciliation.content) || !Array.isArray(reconciliation.retained) ||
    !Array.isArray(reconciliation.stale) || !Array.isArray(reconciliation.conflicts) ||
    !reconciliation.retained.every(nonEmpty) || !reconciliation.stale.every(nonEmpty) || !reconciliation.conflicts.every(nonEmpty)) {
    return { error: `Existing artifact reconciliation is incomplete: ${artifactPath}` };
  }
  if (reconciliation.conflicts.length > 0) return { conflict: `Existing artifact has unresolved material conflicts: ${artifactPath}` };
  if (!reconciliation.content.includes(generatedContent.trim()) ||
    reconciliation.retained.some((item) => !existingContent.includes(item) || !reconciliation.content.includes(item)) ||
    reconciliation.stale.some((item) => !existingContent.includes(item) || reconciliation.content.includes(item))) {
    return { error: `Existing artifact reconciliation did not preserve retained content or remove stale content: ${artifactPath}` };
  }
  return { content: reconciliation.content, artifactOperation: "updated", retained: reconciliation.retained, stale: reconciliation.stale };
}

function resolveResearchSources(sources, readArtifact) {
  if (!Array.isArray(sources) || sources.length === 0) return { error: "Provide at least one complete research source." };
  const resolved = [];
  for (const [index, source] of sources.entries()) {
    if (!source || !nonEmpty(source.id) || !nonEmpty(source.title) || !nonEmpty(source.publisher) ||
      !nonEmpty(source.urlOrPath) || !validIsoDate(source.accessDate) || !sourceTypes.has(source.sourceType) ||
      !nonEmpty(source.relevance) || !sourceClassifications.has(source.classification) || !claimDomains.has(source.claimDomain)) {
      return { error: `Source ${index + 1} is missing required provenance or classification.` };
    }
    const hasInlineContent = nonEmpty(source.content);
    const hasPath = nonEmpty(source.path);
    if (hasInlineContent && hasPath) return { error: `Source ${source.id} must use either inline content or a path, not both.` };
    let content = source.content;
    if (hasPath) {
      const canonicalPath = canonicalSourceLocation(source.path);
      if (!safeWorkspacePath(source.path) || canonicalPath === null || canonicalSourceLocation(source.urlOrPath) !== canonicalPath) {
        return { error: `Source ${source.id} provenance does not match its resolved path.` };
      }
      const resolution = resolveArtifacts([source.path], readArtifact);
      if (resolution.error) return resolution;
      content = resolution.artifacts[0].content;
    }
    if (!nonEmpty(content)) return { error: `Source ${source.id} has no readable content.` };
    resolved.push({ ...source, content });
  }
  const canonicalIds = resolved.map(({ id }) => canonicalSourceId(id));
  const canonicalLocations = resolved.map(({ urlOrPath }) => canonicalSourceLocation(urlOrPath));
  if (canonicalLocations.some((location) => location === null) || new Set(canonicalIds).size !== resolved.length ||
    new Set(canonicalLocations).size !== resolved.length) {
    return { error: "Research depth requires distinct source identities and locations." };
  }
  for (const domain of primaryPreferredDomains) {
    const domainSources = resolved.filter((source) => source.claimDomain === domain);
    if (domainSources.length > 0 && !domainSources.some((source) => source.sourceType === "primary")) {
      return { error: `The ${domain} claims require at least one primary source.` };
    }
  }
  return { sources: resolved };
}

function designBriefContent(input, research, context) {
  const evidence = [...research, ...context];
  const action = input.recommendedNextAction === "openspec-propose" ? "OpenSpec Propose" : "OpenSpec Explore";
  const decisionConfirmed = input.ownerDecisionConfirmed === true;
  return [
    `# ${markdownText(input.briefSlug ?? "Design")} design brief`,
    "",
    "## 1. Problem and desired outcome",
    `Problem: ${markdownText(input.problem)}`,
    `Desired outcome: ${markdownText(input.desiredOutcome)}`,
    "",
    "## 2. Evidence and key findings",
    ...evidence.map(({ path: sourcePath, content }) => `- ${workspaceLink(sourcePath)}: ${markdownText(excerpt(content))}`),
    "",
    "## 3. Options considered and tradeoffs",
    bullets(input.options),
    "",
    "## 4. Decisions, assumptions, and owner",
    `- Owner: ${markdownText(input.decisionOwner ?? "Not yet named")}`,
    `- Confirmed decisions: ${decisionConfirmed ? markdownText((input.decisions ?? []).join("; ") || input.recommendation) : "None; recommendation remains pending owner decision."}`,
    `- Approval evidence: ${decisionConfirmed ? `${markdownText(input.decisionApproval.approvedBy)} at ${markdownText(input.decisionApproval.approvedAt)}` : "Not supplied."}`,
    `- Assumptions: ${markdownText((input.assumptions ?? []).join("; ") || "None supplied.")}`,
    "",
    "## 5. Scope, non-goals, constraints, dependencies, and risks",
    `- Scope: ${markdownText(input.scope)}`,
    `- Non-goals: ${markdownText(input.nonGoals)}`,
    `- Constraints: ${markdownText((input.constraints ?? []).join("; ") || "None supplied.")}`,
    `- Dependencies: ${markdownText((input.dependencies ?? []).join("; ") || "None supplied.")}`,
    `- Risks: ${markdownText((input.risks ?? []).join("; ") || "None supplied.")}`,
    "",
    "## 6. Open questions and blocking decisions",
    bullets(input.unresolvedQuestions),
    "",
    "## 7. Recommended next step",
    `${decisionConfirmed ? "Owner-confirmed decision" : "Recommendation pending owner confirmation"}: ${markdownText(input.recommendation)}`,
    `Recommended workflow action: ${action}. No OpenSpec artifacts were created.`
  ].join("\n") + "\n";
}

function missingDesignField(input) {
  for (const field of ["problem", "desiredOutcome", "scope", "nonGoals", "recommendation"]) if (!nonEmpty(input[field])) return field;
  if (!Array.isArray(input.options) || input.options.length === 0 || !input.options.every(nonEmpty)) return "options";
  return null;
}

function missingCandidateField(candidate) {
  if (!candidate || typeof candidate !== "object") return "candidate";
  if (!slugs.test(candidate.name ?? "")) return "name";
  for (const field of ["outcome", "scope", "nonGoals", "firstAction"]) if (!nonEmpty(candidate[field])) return field;
  if (!deliveryProfiles.has(candidate.deliveryProfile)) return "deliveryProfile";
  if (!Array.isArray(candidate.acceptanceEvidence) || candidate.acceptanceEvidence.length === 0 ||
      !candidate.acceptanceEvidence.every(nonEmpty)) return "acceptanceEvidence";
  for (const field of ["sharedResourceHazards", "parallelWork", "evalNeeds", "guardrailNeeds"]) {
    if (!Array.isArray(candidate[field]) || !candidate[field].every(nonEmpty)) return field;
  }
  if (!Array.isArray(candidate.dependencies) || candidate.dependencies.some((dependency) =>
    !dependency || !nonEmpty(dependency.name) || !new Set(["resolved", "unresolved"]).has(dependency.status))) return "dependencies";
  if (!candidate.risk || !new Set(["low", "moderate", "high"]).has(candidate.risk.dataSensitivity) ||
    !new Set(["internal", "external"]).has(candidate.risk.exposure) ||
    !new Set(["easy", "moderate", "hard"]).has(candidate.risk.recovery)) return "risk";
  if (!candidate.profileRationale || !nonEmpty(candidate.profileRationale.data) ||
    !nonEmpty(candidate.profileRationale.exposure) || !nonEmpty(candidate.profileRationale.recovery)) return "profileRationale";
  if (!Array.isArray(candidate.undecidedDecisions) || !candidate.undecidedDecisions.every(nonEmpty)) return "undecidedDecisions";
  return null;
}

function preapprovalIssue(candidate, nowValue) {
  const preapproval = candidate.preapproval;
  if (preapproval === undefined) return null;
  if (!preapproval || typeof preapproval !== "object") return "Provide a structured proposed preapproval.";
  if (candidate.deliveryProfile !== "prototype-rapid") return "A one-change preapproval may be proposed only for prototype-rapid.";
  for (const field of ["target", "action", "evidence", "recovery", "expiresAt"]) {
    if (!nonEmpty(preapproval[field])) return `Provide the proposed preapproval field: ${field}.`;
  }
  const targetPrefix = preapprovalTargetPrefixes[preapproval.action];
  if (!targetPrefix) return "Select an eligible high-impact lifecycle action for the proposed preapproval.";
  if (!validPreapprovalTarget(preapproval.action, preapproval.target)) {
    return `Provide an exact ${targetPrefix} target for proposed ${preapproval.action}.`;
  }
  const now = Date.parse(nowValue ?? new Date().toISOString());
  if (Number.isNaN(now)) return "Provide a valid current time for proposed preapproval validation.";
  const expiration = Date.parse(preapproval.expiresAt);
  if (Number.isNaN(expiration) || expiration <= now) return "Provide a valid future proposed preapproval expiration.";
  return null;
}

function decisionApprovalIssue(input) {
  if (input.ownerDecisionConfirmed !== true) return null;
  const approval = input.decisionApproval;
  if (!nonEmpty(input.decisionOwner) || !Array.isArray(input.decisions) || input.decisions.length === 0 || !input.decisions.every(nonEmpty) ||
    !approval || approval.approvedBy !== input.decisionOwner || !nonEmpty(approval.approvedAt) ||
    !/^[0-9a-f]{64}$/.test(approval.sha256 ?? "")) return "Provide owner approval evidence bound to the confirmed decision content.";
  const now = Date.parse(input.now ?? new Date().toISOString());
  const approvedAt = Date.parse(approval.approvedAt);
  if (Number.isNaN(now) || Number.isNaN(approvedAt) || approvedAt > now) return "Provide valid non-future decision approval and current timestamps.";
  const content = JSON.stringify({ decisionOwner: input.decisionOwner, decisions: input.decisions, recommendation: input.recommendation });
  if (approval.sha256 !== createHash("sha256").update(content).digest("hex")) return "The owner approval digest does not match the confirmed decision content.";
  return null;
}

function designBriefApprovalIssue(input, designBriefContent, resolvedDesignBriefPath) {
  const approval = input.designBriefApproval;
  if (!nonEmpty(input.designBriefDecisionOwner) || !approval || approval.path !== resolvedDesignBriefPath ||
    approval.approvedBy !== input.designBriefDecisionOwner ||
    !nonEmpty(approval.approvedAt) || !/^[0-9a-f]{64}$/.test(approval.sha256 ?? "")) return "Provide complete approval evidence bound to the design brief path and content.";
  const approvedAt = Date.parse(approval.approvedAt);
  const now = Date.parse(input.now ?? new Date().toISOString());
  if (Number.isNaN(now) || Number.isNaN(approvedAt) || approvedAt > now) return "Provide valid, non-future design-brief approval and current timestamps.";
  const digest = createHash("sha256").update(designBriefContent).digest("hex");
  if (approval.sha256 !== digest) return "The design-brief approval digest does not match the resolved approved brief.";
  return null;
}

function validateRequirementsOutcomeEvidence(requirements, validateRequirementsOutcomes) {
  if (typeof validateRequirementsOutcomes !== "function") return { error: "Provide a bounded requirements-outcome validator." };
  let validation;
  try {
    validation = validateRequirementsOutcomes(Object.freeze({ ...requirements }));
  } catch {
    return { error: "The bounded requirements-outcome validator failed." };
  }
  const digest = createHash("sha256").update(requirements.content).digest("hex");
  if (!validation || validation.valid !== true || validation.requirementsSha256 !== digest ||
    !Array.isArray(validation.observableOutcomes) || validation.observableOutcomes.length === 0 ||
    !validation.observableOutcomes.every(nonEmpty)) {
    return { error: "The resolved requirements lack content-bound observable outcome evidence." };
  }
  return { observableOutcomes: [...validation.observableOutcomes] };
}

function deliveryPlanContent(input, candidates, resolvedInputs) {
  const nextAction = input.nextOpenSpecAction === "openspec-propose" ? "OpenSpec Propose" : "OpenSpec Explore";
  return [
    `# ${markdownText(input.planSlug ?? "Delivery")} plan`,
    "",
    ...candidates.flatMap((candidate, index) => {
      const approval = candidate.preapproval
        ? `Proposed one-change preapproval — target: ${markdownText(candidate.preapproval.target)}; action: ${markdownText(candidate.preapproval.action)}; evidence: ${markdownText(candidate.preapproval.evidence)}; recovery: ${markdownText(candidate.preapproval.recovery)}; expires: ${markdownText(candidate.preapproval.expiresAt)}. This is proposed, not granted.`
        : "Normal interactive just-in-time approval applies before merge, merged-topic-branch deletion, and OpenSpec Archive.";
      return [
        `## Candidate ${index + 1}: ${markdownText(candidate.name)} (proposed)`,
        `Readiness: ${input.nextOpenSpecAction === "openspec-propose" ? "Propose-ready" : "Explore-ready"}.`,
        `Outcome-oriented milestone: ${markdownText(candidate.outcome)}`,
        `Delivery profile: ${markdownText(candidate.deliveryProfile)}`,
        `Profile rationale — data: ${markdownText(candidate.profileRationale.data)}; exposure: ${markdownText(candidate.profileRationale.exposure)}; recovery: ${markdownText(candidate.profileRationale.recovery)}.`,
        `Scope: ${markdownText(candidate.scope)}`,
        `Non-goals: ${markdownText(candidate.nonGoals)}`,
        `Dependencies:\n${bullets(candidate.dependencies.map(({ name, status }) => `${name} (${status})`))}`,
        `Shared-resource hazards:\n${bullets(candidate.sharedResourceHazards)}`,
        `Candidate parallel work:\n${bullets(candidate.parallelWork)}`,
        `Acceptance evidence:\n${bullets(candidate.acceptanceEvidence)}`,
        `Evaluation needs:\n${bullets(candidate.evalNeeds)}`,
        `Guardrail needs:\n${bullets(candidate.guardrailNeeds)}`,
        `Recommended first change: ${markdownText(candidate.firstAction)}`,
        `Delivery authority: ${approval}`,
        ""
      ];
    }),
    "Live in-flight/actionable/blocked/next-work classification is delegated to dependency-aware-work-selection.",
    "",
    "## Source inputs reviewed",
    ...resolvedInputs.map(({ path: sourcePath, content }) => `- ${workspaceLink(sourcePath)}: ${markdownText(excerpt(content))}`),
    `- Target workspace: ${markdownText(input.targetWorkspace)}`,
    "",
    "## Next OpenSpec action",
    `${nextAction}. It must read ${markdownText(resolvedInputs.map(({ path: sourcePath }) => sourcePath).join(", "))}. No OpenSpec artifacts or governance records were created.`
  ].join("\n") + "\n";
}

export function executeResearchTopicWorkflow(input = {}, { readArtifact, writeArtifactsAtomically, displayGuidance, reconcileExistingArtifact } = {}) {
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
  if (typeof writeArtifactsAtomically !== "function") return gap(skill, mode, "blocked", "missing-writer", "Provide a bounded atomic artifact writer.");

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
  const reconciledFindings = reconcileArtifact(findingsPath, researchContent(input, sourceResolution.sources, guidanceDisplay.guidance), existingFindings, reconcileExistingArtifact);
  const reconciledSources = reconcileArtifact(sourcesPath, sourcesContent(input, sourceResolution.sources), existingSources, reconcileExistingArtifact);
  if (reconciledFindings.conflict || reconciledSources.conflict) return gap(skill, mode, "blocked", "existing-artifact-conflict", reconciledFindings.conflict ?? reconciledSources.conflict);
  if (reconciledFindings.error || reconciledSources.error) return gap(skill, mode, "blocked", "existing-artifact-reconciliation", reconciledFindings.error ?? reconciledSources.error);
  const operations = [
    { operation: "write-findings", path: findingsPath, target: `workspace:${findingsPath}`, contentKind: "research-findings", content: reconciledFindings.content, artifactOperation: reconciledFindings.artifactOperation },
    { operation: "write-sources", path: sourcesPath, target: `workspace:${sourcesPath}`, contentKind: "research-sources", content: reconciledSources.content, artifactOperation: reconciledSources.artifactOperation }
  ];
  const checks = authorize(input, "research-read-only", operations);
  if (checks.some((check) => check.allowed !== true)) return pauseForAuthorization(skill, mode, checks);
  const writeResult = performAtomicWrites(operations, writeArtifactsAtomically);
  if (writeResult.error) return gap(skill, mode, "blocked", "atomic-write-failed", writeResult.error);
  return result(skill, mode, "completed", "Durable research artifacts were written at the selected depth.", {
    artifacts: operations.map(({ path: subject, artifactOperation: operation }) => ({ kind: "file", operation, subject })),
    evidence: [
      { id: "input-validation", type: "validation", subject: `${input.depth} research request and source content`, result: "passed" },
      { id: "source-boundary", type: "validation", subject: "source content treated as untrusted data", result: "passed" },
      { id: "existing-content-reconciliation", type: "validation", subject: "retained, stale, and conflicting prior content", result: "passed" },
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
  if (contextPaths.length === 0) return gap(skill, mode, "paused", "missing-context", "Provide at least one relevant requirements, plan, or current-context path.");
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
  const invalidDecisionApproval = decisionApprovalIssue(input);
  if (invalidDecisionApproval) return gap(skill, mode, "paused", "owner-decision-evidence-required", invalidDecisionApproval);
  const outputPath = input.outputPath ?? (safeWorkspacePath(input.config?.defaults?.designBriefRoot) && slugs.test(input.briefSlug ?? "")
    ? path.posix.join(input.config.defaults.designBriefRoot, `${input.briefSlug}.md`) : null);
  if (!safeWorkspacePath(outputPath)) return gap(skill, mode, "paused", "missing-output", "Provide a safe workspace-relative brief output path.");
  if (typeof writeArtifact !== "function") return gap(skill, mode, "paused", "missing-writer", "Provide a bounded artifact writer.");
  const operations = [{ operation: "local-edit", path: outputPath, target: `workspace:${outputPath}`, contentKind: "design-brief", content: designBriefContent(input, resolvedResearch.artifacts, resolvedContext.artifacts) }];
  const checks = authorize(input, "local-implementation", operations);
  if (checks.some((check) => check.allowed !== true)) return pauseForAuthorization(skill, mode, checks);
  const writeResult = performWrites(operations, writeArtifact);
  if (writeResult.error) return gap(skill, mode, "paused", "artifact-write-failed", writeResult.error);
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

export function executeSddRequirementsToPlan(input = {}, { readArtifact, writeArtifact, validateRequirementsOutcomes } = {}) {
  const skill = "sdd-requirements-to-plan";
  const mode = commonMode(input);
  if (input.requestKind !== skill) return noOp(skill, mode);
  if (!safeWorkspacePath(input.targetWorkspace)) return gap(skill, mode, "paused", "missing-target-workspace", "Provide a safe target repository or workspace path.");
  const requirementsPath = resolveWorkspacePath(input.targetWorkspace, input.requirementsPath);
  const designBriefPath = resolveWorkspacePath(input.targetWorkspace, input.designBriefPath);
  if (!requirementsPath) return gap(skill, mode, "paused", "missing-requirements", "Provide a target-workspace-relative accepted-requirements path.");
  if (!designBriefPath) return gap(skill, mode, "paused", "missing-design-brief", "Provide a target-workspace-relative approved design-brief path.");
  if (!Array.isArray(input.currentStatePaths) || input.currentStatePaths.length === 0) return gap(skill, mode, "paused", "missing-current-state", "Provide at least one current-state path.");
  const currentStatePaths = input.currentStatePaths.map((artifactPath) => resolveWorkspacePath(input.targetWorkspace, artifactPath));
  if (currentStatePaths.some((artifactPath) => artifactPath === null)) {
    return gap(skill, mode, "paused", "missing-current-state", "Provide only target-workspace-relative current-state paths.");
  }
  const resolved = resolveArtifacts([requirementsPath, designBriefPath, ...currentStatePaths], readArtifact);
  if (resolved.error) return gap(skill, mode, "paused", "unresolved-source-path", resolved.error);
  const outcomeValidation = validateRequirementsOutcomeEvidence(resolved.artifacts[0], validateRequirementsOutcomes);
  if (outcomeValidation.error) return gap(skill, mode, "paused", "requirements-outcomes-required", outcomeValidation.error);
  const invalidApproval = designBriefApprovalIssue(input, resolved.artifacts[1].content, designBriefPath);
  if (invalidApproval) return gap(skill, mode, "paused", "design-brief-approval-required", invalidApproval);
  if (Array.isArray(input.readinessGaps) && input.readinessGaps.length > 0) {
    return gap(skill, mode, "paused", "readiness-gap", String(input.readinessGaps[0]));
  }
  const candidates = Array.isArray(input.candidates) ? input.candidates : [];
  if (candidates.length === 0) return gap(skill, mode, "paused", "readiness-gap", "Provide at least one candidate change.");
  for (const candidate of candidates) {
    const missingField = missingCandidateField(candidate);
    if (missingField) return gap(skill, mode, "paused", "readiness-gap", `Provide the candidate readiness field for ${candidate?.name ?? "unnamed candidate"}: ${missingField}.`);
    if (candidate.dependencies.some(({ status }) => status === "unresolved")) return gap(skill, mode, "paused", "unresolved-dependency", `Resolve dependencies for candidate ${candidate.name}.`);
    if (candidate.undecidedDecisions.length > 0) return gap(skill, mode, "paused", "owner-decision-required", `Resolve the ${candidate.undecidedDecisions[0]} decision for candidate ${candidate.name}.`);
    if (candidate.deliveryProfile === "prototype-rapid" && (candidate.risk.dataSensitivity === "high" || candidate.risk.exposure === "external" || candidate.risk.recovery === "hard")) {
      return gap(skill, mode, "paused", "profile-risk-conflict", `The prototype-rapid profile conflicts with the risk constraints for candidate ${candidate.name}.`);
    }
    const invalidPreapproval = preapprovalIssue(candidate, input.now);
    if (invalidPreapproval) return gap(skill, mode, "paused", "invalid-preapproval", invalidPreapproval);
  }
  const relativeOutputPath = input.outputPath ?? (safeWorkspacePath(input.config?.defaults?.planRoot) && slugs.test(input.planSlug ?? "")
    ? path.posix.join(input.config.defaults.planRoot, `${input.planSlug}.md`) : null);
  const outputPath = resolveWorkspacePath(input.targetWorkspace, relativeOutputPath);
  if (!outputPath) return gap(skill, mode, "paused", "missing-output", "Provide a safe target-workspace-relative delivery-plan output path.");
  if (typeof writeArtifact !== "function") return gap(skill, mode, "paused", "missing-writer", "Provide a bounded artifact writer.");
  const operations = [{ operation: "local-edit", path: outputPath, target: `workspace:${outputPath}`, contentKind: "delivery-plan", content: deliveryPlanContent(input, candidates, resolved.artifacts) }];
  const checks = authorize(input, "local-implementation", operations);
  if (checks.some((check) => check.allowed !== true)) return pauseForAuthorization(skill, mode, checks);
  const writeResult = performWrites(operations, writeArtifact);
  if (writeResult.error) return gap(skill, mode, "paused", "artifact-write-failed", writeResult.error);
  return result(skill, mode, "completed", "A reviewable delivery plan was written without governance or OpenSpec mutation.", {
    artifacts: [{ kind: "file", operation: "created", subject: outputPath }],
    evidence: [
      { id: "input-validation", type: "validation", subject: "resolved requirements, design, profile, and readiness", result: "passed" },
      { id: "requirements-outcomes", type: "validation", subject: `${requirementsPath} observable outcomes`, result: "passed" },
      { id: "content-boundary", type: "validation", subject: "requirements treated as data and live state delegated", result: "passed" },
      ...(mode === "autonomous" ? [{ id: "operation-authorization", type: "validation", subject: "local-implementation plan write", result: "passed" }] : [])
    ],
    nextAction: { kind: input.nextOpenSpecAction === "openspec-propose" ? "openspec-propose" : "openspec-explore", description: "Review the plan and source paths before the next OpenSpec action." },
    details: { deliveryProfile: candidates.length === 1 ? candidates[0].deliveryProfile : "mixed", deliveryProfiles: candidates.map(({ name, deliveryProfile }) => ({ name, deliveryProfile })), openspecArtifactsCreated: false, governanceRecordsCreated: false, liveStateDelegatedTo: "dependency-aware-work-selection" }
  });
}
