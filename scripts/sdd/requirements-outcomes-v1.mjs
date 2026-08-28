import { createHash } from "node:crypto";

// Canonical v1 accepted-outcomes contract for `sdd-requirements-to-plan`.
// This module is assistant-neutral and repository-owned: it accepts only
// requirements content and returns a deterministic, content-bound result. It
// performs no filesystem, network, OpenSpec, GitHub, or external mutation.

export const REQUIREMENTS_OUTCOMES_V1_MARKER = "<!-- ai-skills-requirements-outcomes: v1 -->";
export const REQUIREMENTS_OUTCOMES_V1_HEADING = "## Accepted outcomes";

const PLACEHOLDERS = Object.freeze(new Set(["tbd", "todo", "n/a", "unknown"]));

// An intentionally small, deterministic denylist for instruction-like control
// text inside an outcome or acceptance field. It targets three documented
// categories: overriding prior/system instructions, adopting an injected role,
// and invoking a tool or external mutation. It is not a semantic safety model.
const INSTRUCTION_LIKE_PATTERNS = Object.freeze([
  /^\s*(?:(?:please|kindly|now|then|just)\s+)?(?:override|ignore|disregard|bypass|supersede)\b/i,
  /\b(?:override|ignore|disregard|bypass|supersede)\b[^\n]{0,80}\b(?:instruction|prompt|system|rule)s?\b/i,
  /\b(?:instruction|prompt|system|rule)s?\b[^\n]{0,80}\b(?:override|ignore|disregard|bypass|supersede)/i,
  /\b(?:you\s+are|act\s+as|pretend\s+to\s+be|roleplay|forget\s+(?:all|prior|previous|earlier))\b/i,
  /\b(?:run|execute|invoke|call|spawn|launch|trigger)\b[^\n]{0,60}\b(?:shell|bash|zsh|command|tool|function|process|curl|wget|python|node|npm|gh|git|codex|claude)\b/i,
  /^\s*(?:(?:please|kindly|now|then|just)\s+)?(?:create|delete|close|merge|open|post|push|modify|edit|write|update)\b[^\n]{0,60}\b(?:issues?|pull\s+requests?|prs?|branches?|files?|credentials?|secrets?|tokens?|keys?|passwords?)\b/i
]);

function hasAlphanumeric(value) {
  return /[\p{L}\p{N}]/u.test(value);
}

function isPlaceholder(value) {
  return PLACEHOLDERS.has(value.toLowerCase().trim());
}

function isInstructionLike(value) {
  return INSTRUCTION_LIKE_PATTERNS.some((pattern) => pattern.test(value));
}

function validField(value) {
  if (!value) return false;
  if (!hasAlphanumeric(value)) return false; // whitespace- or punctuation-only
  if (isPlaceholder(value)) return false;
  if (isInstructionLike(value)) return false;
  return true;
}

function normalizeLines(content) {
  return content.replace(/\r\n?/g, "\n").split("\n");
}

/**
 * Parse the canonical v1 accepted-outcomes section from raw requirements
 * content. Returns `{ valid, outcomes, reason? }`. Never throws for string
 * input; caller owns digest binding to the exact input bytes.
 */
export function parseRequirementsOutcomesV1(content) {
  const lines = normalizeLines(content);
  let index = 0;

  // The marker must be the first non-empty line.
  while (index < lines.length && lines[index].trim() === "") index += 1;
  if (index >= lines.length || lines[index] !== REQUIREMENTS_OUTCOMES_V1_MARKER) {
    return { valid: false, reason: "missing-or-misplaced-marker", outcomes: [] };
  }
  index += 1;

  // Optional blank lines, then the exact heading.
  while (index < lines.length && lines[index].trim() === "") index += 1;
  if (index >= lines.length || lines[index] !== REQUIREMENTS_OUTCOMES_V1_HEADING) {
    return { valid: false, reason: "missing-heading", outcomes: [] };
  }
  index += 1;

  // Collect the accepted-outcomes section up to the next level-two heading.
  const section = [];
  while (index < lines.length) {
    const line = lines[index];
    if (/^##\s/.test(line)) break;
    section.push(line);
    index += 1;
  }

  // Reject a duplicate accepted-outcomes section: content after the first
  // section would otherwise bypass validation.
  for (let rest = index; rest < lines.length; rest += 1) {
    if (lines[rest] === REQUIREMENTS_OUTCOMES_V1_HEADING) {
      return { valid: false, reason: "duplicate-outcomes-section", outcomes: [] };
    }
  }

  // Trim surrounding blank lines; blank lines inside the pair sequence are
  // rejected because the contract requires consecutive pairs.
  while (section.length > 0 && section[0].trim() === "") section.shift();
  while (section.length > 0 && section[section.length - 1].trim() === "") section.pop();
  if (section.length === 0) return { valid: false, reason: "empty-outcomes", outcomes: [] };

  const outcomes = [];
  let cursor = 0;
  while (cursor < section.length) {
    const outcomeLine = section[cursor];
    if (outcomeLine.trim() === "") return { valid: false, reason: "non-consecutive-outcomes", outcomes: [] };
    const outcomeMatch = outcomeLine.match(/^- Outcome:\s*(.*)$/);
    if (!outcomeMatch) return { valid: false, reason: "malformed-outcome", outcomes: [] };
    const outcome = outcomeMatch[1].trim();
    if (cursor + 1 >= section.length) return { valid: false, reason: "missing-acceptance", outcomes: [] };
    const acceptanceMatch = section[cursor + 1].match(/^  Acceptance:\s*(.*)$/);
    if (!acceptanceMatch) return { valid: false, reason: "malformed-acceptance", outcomes: [] };
    const acceptance = acceptanceMatch[1].trim();
    if (!validField(outcome) || !validField(acceptance)) {
      return { valid: false, reason: "invalid-outcome-or-acceptance", outcomes: [] };
    }
    outcomes.push(`${outcome} — Acceptance: ${acceptance}`);
    cursor += 2;
  }

  return { valid: true, outcomes };
}

/**
 * Validate requirements content against the canonical v1 contract and bind the
 * result to the SHA-256 of the exact input bytes. Accepts either the raw
 * content string or a requirements artifact object carrying `content`.
 */
export function validateRequirementsOutcomesV1(requirements) {
  const content = typeof requirements === "string" ? requirements : requirements?.content;
  if (typeof content !== "string") {
    return { valid: false, requirementsSha256: null, observableOutcomes: [] };
  }
  const requirementsSha256 = createHash("sha256").update(content).digest("hex");
  const parsed = parseRequirementsOutcomesV1(content);
  return {
    valid: parsed.valid,
    requirementsSha256,
    observableOutcomes: parsed.valid ? parsed.outcomes : [],
    ...(parsed.reason ? { reason: parsed.reason } : {})
  };
}
