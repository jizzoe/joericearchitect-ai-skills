import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const changeNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const selectionModes = new Set(["explicit", "user-selected-candidate"]);
const classifications = new Set([
  "delivered-and-safe-to-retire",
  "delivered-but-dirty",
  "duplicate-ref-alias",
  "genuinely-divergent",
  "ambiguous"
]);

function isRelative(value) {
  return typeof value === "string" && value.length > 0 && !path.isAbsolute(value) &&
    !value.split(/[\\/]/).includes("..");
}

function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function yamlQuote(value) {
  return JSON.stringify(String(value));
}

function provenanceYaml({ sourcePath, sourceDigest, copiedAt, selectionMode, changeName }) {
  return [
    "schema_version: 1",
    `source_path: ${yamlQuote(sourcePath)}`,
    `source_sha256: ${yamlQuote(sourceDigest)}`,
    `copied_at: ${yamlQuote(copiedAt)}`,
    `selection_mode: ${yamlQuote(selectionMode)}`,
    `change: ${yamlQuote(changeName)}`,
    ""
  ].join("\n");
}

function existingProvenanceMatches(content, { sourcePath, sourceDigest, selectionMode, changeName }) {
  return content.includes(`source_path: ${yamlQuote(sourcePath)}\n`) &&
    content.includes(`source_sha256: ${yamlQuote(sourceDigest)}\n`) &&
    content.includes(`selection_mode: ${yamlQuote(selectionMode)}\n`) &&
    content.includes(`change: ${yamlQuote(changeName)}\n`);
}

function fail(reason) {
  return { ok: false, reason };
}

export function validateDesignBriefSource({ workspacePath, sourcePath } = {}) {
  if (typeof workspacePath !== "string" || !isRelative(sourcePath) || !sourcePath.endsWith(".md")) return fail("design-brief-source-path-invalid");
  try {
    const workspace = fs.realpathSync(workspacePath);
    const candidate = path.resolve(workspace, sourcePath);
    if (!isWithin(workspace, candidate)) return fail("design-brief-source-path-invalid");
    const resolved = fs.realpathSync(candidate);
    if (!isWithin(workspace, resolved) || !fs.statSync(resolved).isFile()) return fail("design-brief-source-path-invalid");
    const content = fs.readFileSync(resolved, "utf8");
    if (content.trim().length === 0) return fail("design-brief-source-empty");
    return { ok: true, workspace, absolutePath: resolved, relativePath: path.relative(workspace, resolved).split(path.sep).join("/"), content, digest: sha256(content) };
  } catch {
    return fail("design-brief-source-unavailable");
  }
}

export function captureDesignBrief({ workspacePath, changePath, sourcePath, changeName, selectionMode = "explicit", copiedAt = new Date().toISOString() } = {}) {
  if (!changeNamePattern.test(changeName ?? "") || !selectionModes.has(selectionMode) || !isRelative(changePath) || Number.isNaN(Date.parse(copiedAt))) {
    return fail("design-brief-capture-input-invalid");
  }
  const source = validateDesignBriefSource({ workspacePath, sourcePath });
  if (!source.ok) return source;
  const changeRoot = path.resolve(source.workspace, changePath);
  if (!isWithin(source.workspace, changeRoot)) return fail("design-brief-change-path-invalid");
  const context = path.join(changeRoot, "context");
  const copy = path.join(context, "design-brief.md");
  const provenance = path.join(context, "design-brief-provenance.yaml");
  const metadata = provenanceYaml({ sourcePath: source.relativePath, sourceDigest: source.digest, copiedAt, selectionMode, changeName });
  if (fs.existsSync(context)) {
    try {
      if (fs.readFileSync(copy, "utf8") === source.content && existingProvenanceMatches(fs.readFileSync(provenance, "utf8"), {
        sourcePath: source.relativePath, sourceDigest: source.digest, selectionMode, changeName
      })) {
        return { ok: true, action: "already-captured", copyPath: path.relative(source.workspace, copy).split(path.sep).join("/"), provenancePath: path.relative(source.workspace, provenance).split(path.sep).join("/"), digest: source.digest };
      }
    } catch {}
    return fail("design-brief-provenance-conflict");
  }
  const temporary = `${context}.tmp-${crypto.randomUUID()}`;
  try {
    fs.mkdirSync(temporary, { recursive: false, mode: 0o700 });
    fs.writeFileSync(path.join(temporary, "design-brief.md"), source.content, { encoding: "utf8", mode: 0o600 });
    fs.writeFileSync(path.join(temporary, "design-brief-provenance.yaml"), metadata, { encoding: "utf8", mode: 0o600 });
    fs.renameSync(temporary, context);
    return { ok: true, action: "captured", copyPath: path.relative(source.workspace, copy).split(path.sep).join("/"), provenancePath: path.relative(source.workspace, provenance).split(path.sep).join("/"), digest: source.digest };
  } catch {
    try { fs.rmSync(temporary, { recursive: true, force: true }); } catch {}
    return fail("design-brief-capture-failed");
  }
}

function tokens(value) {
  return String(value ?? "").toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

export function rankDesignBriefCandidates(candidates, { changeName, issueNumber } = {}) {
  if (!Array.isArray(candidates) || !changeNamePattern.test(changeName ?? "")) return [];
  const terms = new Set(tokens(changeName).filter((term) => term.length > 2));
  const exactReferences = [changeName.toLowerCase(), issueNumber ? `#${issueNumber}` : null].filter(Boolean);
  return candidates
    .filter((candidate) => isRelative(candidate?.path) && typeof candidate.content === "string" && Number.isFinite(candidate.mtimeMs))
    .map((candidate) => {
      const haystack = `${candidate.path}\n${candidate.content}`.toLowerCase();
      const exact = exactReferences.some((reference) => haystack.includes(reference)) ? 1 : 0;
      const shared = [...terms].filter((term) => haystack.includes(term)).length;
      return { ...candidate, exact, shared };
    })
    .sort((left, right) => right.exact - left.exact || right.shared - left.shared || right.mtimeMs - left.mtimeMs || left.path.localeCompare(right.path))
    .slice(0, 3)
    .map(({ path: candidatePath, exact, shared }) => ({ path: candidatePath, exactMatch: exact === 1, sharedTerms: shared }));
}

export function discoverDesignBriefCandidates({ workspacePath, changeName, issueNumber, briefRoot = "ai-planning/design-briefs" } = {}) {
  if (typeof workspacePath !== "string" || !isRelative(briefRoot) || !changeNamePattern.test(changeName ?? "")) return [];
  try {
    const workspace = fs.realpathSync(workspacePath);
    const root = fs.realpathSync(path.resolve(workspace, briefRoot));
    if (!isWithin(workspace, root) || !fs.statSync(root).isDirectory()) return [];
    const candidates = [];
    const visit = (directory) => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const candidate = path.join(directory, entry.name);
        if (entry.isDirectory()) visit(candidate);
        else if (entry.isFile() && entry.name.endsWith(".md")) {
          const resolved = fs.realpathSync(candidate);
          if (isWithin(root, resolved) && isWithin(workspace, resolved)) {
            candidates.push({ path: path.relative(workspace, resolved).split(path.sep).join("/"), content: fs.readFileSync(resolved, "utf8"), mtimeMs: fs.statSync(resolved).mtimeMs });
          }
        }
      }
    };
    visit(root);
    return rankDesignBriefCandidates(candidates, { changeName, issueNumber });
  } catch {
    return [];
  }
}

export function classifyLifecycleResource(resource = {}) {
  if (resource.aliasOf) return { classification: "duplicate-ref-alias", recovery: "retain the alias until a separate exact ownership decision" };
  const delivered = resource.deliveryEvidence === true && resource.archiveEvidence === true && resource.specEvidence === true;
  if (delivered && resource.clean === false) return { classification: "delivered-but-dirty", recovery: "preserve dirty resource; no cleanup recommendation" };
  if (delivered && resource.clean === true && resource.primary !== true && resource.locked !== true && resource.registered === true) {
    return { classification: "delivered-and-safe-to-retire", recovery: "separate exact-owned cleanup authorization is still required" };
  }
  if (resource.divergent === true && !delivered) return { classification: "genuinely-divergent", recovery: "inspect divergent work before any lifecycle action" };
  return { classification: "ambiguous", recovery: "collect current delivery, archive, specification, and pull-request evidence" };
}

export function buildLifecycleReconciliationReport({ resources = [], github = { available: false } } = {}) {
  const githubAvailable = github?.available === true;
  const entries = resources.map((resource) => ({ id: resource.id, kind: resource.kind, ...classifyLifecycleResource(resource) }));
  return {
    schemaVersion: 1,
    evidenceMode: githubAvailable ? "github-and-local" : "local-only",
    evidenceGap: githubAvailable ? null : "GitHub pull-request lookup unavailable; classifications use local evidence only.",
    resources: entries,
    recommendations: entries.filter((entry) => entry.classification === "delivered-and-safe-to-retire").map(({ id, kind }) => ({ id, kind, action: "recommend-retirement", requires: "separate exact-owned cleanup authorization" }))
  };
}

export function isLifecycleClassification(value) {
  return classifications.has(value);
}
