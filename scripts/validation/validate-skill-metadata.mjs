#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { resolveAssetRoot } from "../runtime/asset-root.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Installed runtimes resolve the packaged skills root through RUNTIME_HOME;
// the checkout-relative path remains the in-repository default.
const defaultSkillsRoot = resolveAssetRoot("skills/base", import.meta.url).resolved;
const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const plainScalarPattern = /^(?![-?:,[\]{}#&*!|>'"%@`])(?!.*:\s)(?!.*\s#)[^\t\r\n]+$/;

function parsePlainScalar(rawValue) {
  const value = rawValue.trim();
  if (!value) return { error: "empty YAML frontmatter value" };
  if (!plainScalarPattern.test(value)) {
    return { error: "value must be an unquoted YAML plain scalar without mapping or comment syntax" };
  }
  return { value };
}

function parseFrontmatter(text) {
  if (!text.startsWith("---\n") && !text.startsWith("---\r\n")) {
    return { error: "missing YAML frontmatter opening delimiter" };
  }

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const closingIndex = lines.indexOf("---", 1);
  if (closingIndex === -1) {
    return { error: "missing YAML frontmatter closing delimiter" };
  }

  const fields = new Map();
  for (const line of lines.slice(1, closingIndex)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const match = /^([A-Za-z][A-Za-z0-9_-]*):(?:\s+(.+))?$/.exec(line);
    if (!match) return { error: `invalid YAML frontmatter line: ${line}` };
    const [, key, rawValue = ""] = match;
    if (fields.has(key)) return { error: `duplicate YAML frontmatter key: ${key}` };
    const parsedValue = parsePlainScalar(rawValue);
    if (parsedValue.error) return { error: `${parsedValue.error}: ${key}` };
    fields.set(key, parsedValue.value);
  }

  return { fields };
}

export function validateSkillMetadata(skillsRoot = defaultSkillsRoot) {
  const issues = [];
  const seenNames = new Map();
  const entries = fs.existsSync(skillsRoot)
    ? fs.readdirSync(skillsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))
    : [];

  for (const entry of entries) {
    const skillPath = path.join(skillsRoot, entry.name, "SKILL.md");
    if (!fs.existsSync(skillPath)) continue;
    const parsed = parseFrontmatter(fs.readFileSync(skillPath, "utf8"));
    if (parsed.error) {
      issues.push({ ruleId: "skill-metadata.frontmatter", path: skillPath, message: parsed.error });
      continue;
    }

    const name = parsed.fields.get("name");
    const description = parsed.fields.get("description");
    if (!name) issues.push({ ruleId: "skill-metadata.name-required", path: skillPath, message: "missing required name" });
    if (!description) issues.push({ ruleId: "skill-metadata.description-required", path: skillPath, message: "missing required description" });
    if (!name) continue;
    if (!namePattern.test(name)) {
      issues.push({ ruleId: "skill-metadata.name-format", path: skillPath, message: `name must be lowercase kebab-case: ${name}` });
    }
    if (name !== entry.name) {
      issues.push({ ruleId: "skill-metadata.directory-match", path: skillPath, message: `name ${name} does not match directory ${entry.name}` });
    }
    const duplicate = seenNames.get(name);
    if (duplicate) {
      issues.push({ ruleId: "skill-metadata.duplicate-name", path: skillPath, message: `name ${name} duplicates ${duplicate}` });
    } else {
      seenNames.set(name, skillPath);
    }
  }

  return { valid: issues.length === 0, issues };
}

function main(argv) {
  const [skillsRoot = defaultSkillsRoot] = argv;
  const result = validateSkillMetadata(path.resolve(skillsRoot));
  if (result.valid) {
    console.log(`Skill metadata validation passed: ${path.resolve(skillsRoot)}`);
    return;
  }
  for (const issue of result.issues) {
    console.error(`${issue.ruleId} ${issue.path}: ${issue.message}`);
  }
  process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
