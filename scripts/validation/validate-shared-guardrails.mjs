#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sharedRelativePath = "../_shared/guardrails.md";
const allowedLine = /^See \[[^\]]+\]\(\.\.\/_shared\/guardrails\.md\)\.$/;

function issue(code, skillPath, detail) {
  return { code, path: skillPath, ...(detail ? { detail } : {}) };
}

function canonicalSkillPaths(skillsRoot) {
  if (!fs.existsSync(skillsRoot)) return [];
  return fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(skillsRoot, entry.name, "SKILL.md"))
    .filter((skillPath) => fs.existsSync(skillPath))
    .sort();
}

function guardrailsBody(markdown) {
  const match = /(?:^|\n)## Guardrails\s*\n([\s\S]*?)(?=\n## |$)/.exec(markdown);
  return match?.[1] ?? null;
}

export function validateSharedGuardrails(skillsRoot) {
  const issues = [];
  const sharedPath = path.join(skillsRoot, "_shared", "guardrails.md");
  const sharedSkillPath = path.join(skillsRoot, "_shared", "SKILL.md");
  if (!fs.existsSync(sharedPath)) issues.push(issue("missing-shared-guardrails", sharedPath));
  if (fs.existsSync(sharedSkillPath)) issues.push(issue("shared-directory-is-skill", sharedSkillPath));

  for (const skillPath of canonicalSkillPaths(skillsRoot)) {
    const body = guardrailsBody(fs.readFileSync(skillPath, "utf8"));
    if (body === null) {
      issues.push(issue("missing-guardrails-section", skillPath));
      continue;
    }
    const lines = body.trim().split("\n").map((line) => line.trim()).filter(Boolean);
    const links = [...body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
    if (links.length === 0) issues.push(issue("missing-guardrail-link", skillPath));
    if (links.length > 1) issues.push(issue("duplicate-guardrail-link", skillPath));
    if (links.length === 1 && links[0] !== sharedRelativePath) issues.push(issue("malformed-guardrail-link", skillPath, links[0]));
    if (links.length === 1 && links[0] === sharedRelativePath && !fs.existsSync(path.resolve(path.dirname(skillPath), links[0]))) issues.push(issue("broken-guardrail-link", skillPath));
    if (lines.length !== 1 || !allowedLine.test(lines[0] ?? "")) {
      issues.push(issue("copied-guardrail-policy", skillPath));
    }
  }
  return { valid: issues.length === 0, issues, skillPaths: canonicalSkillPaths(skillsRoot) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(process.argv[2] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../skills/base"));
  const result = validateSharedGuardrails(root);
  if (result.valid) console.log(`Shared guardrail validation passed: ${root}`);
  else for (const item of result.issues) console.error(`${item.code} ${item.path}${item.detail ? `: ${item.detail}` : ""}`);
  process.exit(result.valid ? 0 : 1);
}
