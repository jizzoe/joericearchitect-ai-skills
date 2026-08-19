#!/usr/bin/env node
// Deterministic check that skill and adapter text targets the distributed
// runtime contract rather than a path in whatever workspace happens to be open.
//
// Rejects an unresolved legacy helper path, an undeclared helper name, an
// unregistered subcommand verb, a relative packaged-asset default that no
// longer resolves once installed, and a thin platform adapter that has grown
// its own copy of runtime policy.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { LEGACY_HELPER_REFERENCE, loadManifest, verbDeclared } from "../runtime/registry.mjs";

const CANONICAL_ROOT = "skills/base";
const ADAPTER_ROOTS = [".claude/skills", ".agents/skills"];
const LAUNCHER_INVOCATION = /ai-skills-runtime run ([a-z0-9-]+)(?:\s+([a-z0-9-]+))?/g;
const CONTRACT_DECLARATION = /Required runtime contract version:\s*(\d+)/;

// Policy that belongs to the canonical skill only. A thin adapter repeating it
// is duplication, not exposure.
const DUPLICATED_POLICY = [
  /## Shared runtime/,
  /Required runtime contract version/,
  /makes no authorization decision/
];

function markdownFiles(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const next = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...markdownFiles(next));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(next);
  }
  return files;
}

function issue(ruleId, filePath, message) {
  return { ruleId, path: filePath, message };
}

export function validateRuntimeReferences(repositoryRoot = process.cwd()) {
  const declaration = loadManifest(repositoryRoot);
  if (!declaration.valid) {
    return { valid: false, issues: [issue("runtime-references.manifest", declaration.manifestPath, declaration.issues.join(", "))] };
  }
  const manifest = declaration.manifest;
  const declared = new Map(manifest.entrypoints.map((entry) => [entry.name, entry]));
  const issues = [];

  const canonicalRoot = path.join(repositoryRoot, CANONICAL_ROOT);
  const canonicalFiles = markdownFiles(canonicalRoot);
  const adapterFiles = ADAPTER_ROOTS.flatMap((root) => markdownFiles(path.join(repositoryRoot, root)));

  for (const filePath of [...canonicalFiles, ...adapterFiles]) {
    const relative = path.relative(repositoryRoot, filePath);
    const contents = fs.readFileSync(filePath, "utf8");

    for (const match of contents.matchAll(LEGACY_HELPER_REFERENCE)) {
      issues.push(issue("runtime-references.legacy-path", relative,
        `unresolved workspace-relative helper reference: ${match[0]}`));
    }

    for (const match of contents.matchAll(LAUNCHER_INVOCATION)) {
      const [, helper, verb] = match;
      const entry = declared.get(helper);
      if (!entry) {
        issues.push(issue("runtime-references.helper-not-declared", relative, `helper not in the runtime manifest: ${helper}`));
        continue;
      }
      if (entry.invocation === "subcommand" && verb && !verbDeclared(entry, verb)) {
        issues.push(issue("runtime-references.verb-not-declared", relative, `verb not declared for ${helper}: ${verb}`));
      }
      if (entry.invocation !== "subcommand" && verb && declared.has(verb) === false && /^[a-z0-9-]+$/.test(verb) && contents.includes(`run ${helper} ${verb}`)) {
        // A cli-shaped helper takes no verb; a stray word here would be passed
        // through as an argument and silently ignored.
        issues.push(issue("runtime-references.verb-not-supported", relative, `${helper} takes no subcommand verb: ${verb}`));
      }
    }
  }

  // Every canonical skill that names a runtime helper declares its contract.
  for (const filePath of canonicalFiles) {
    const relative = path.relative(repositoryRoot, filePath);
    const contents = fs.readFileSync(filePath, "utf8");
    if (!contents.includes("ai-skills-runtime run ")) continue;
    if (path.basename(filePath) !== "SKILL.md") continue;
    const declaredContract = contents.match(CONTRACT_DECLARATION);
    if (!declaredContract) {
      issues.push(issue("runtime-references.contract-version-missing", relative,
        "a runtime-dependent skill must declare its required runtime contract version"));
    } else if (Number.parseInt(declaredContract[1], 10) !== manifest.contractVersion) {
      issues.push(issue("runtime-references.contract-version-mismatch", relative,
        `declares contract version ${declaredContract[1]}, manifest provides ${manifest.contractVersion}`));
    }
  }

  // Thin adapters point at canonical policy; they never restate it.
  for (const filePath of adapterFiles) {
    const relative = path.relative(repositoryRoot, filePath);
    const contents = fs.readFileSync(filePath, "utf8");
    for (const pattern of DUPLICATED_POLICY) {
      if (pattern.test(contents)) {
        issues.push(issue("runtime-references.adapter-duplicates-policy", relative,
          `platform adapter restates canonical runtime policy: ${pattern.source}`));
      }
    }
  }

  // A packaged asset default must resolve through RUNTIME_HOME once installed.
  const assetReaders = manifest.entrypoints
    .flatMap((entry) => (entry.readsAssetRoots ?? []).map((root) => ({ entry, root })));
  for (const { entry, root } of assetReaders) {
    const modulePath = path.join(repositoryRoot, entry.module);
    if (!fs.existsSync(modulePath)) {
      issues.push(issue("runtime-references.entrypoint-missing", entry.module, `declared entrypoint is absent: ${entry.name}`));
      continue;
    }
    const contents = fs.readFileSync(modulePath, "utf8");
    if (!contents.includes("asset-root.mjs")) {
      issues.push(issue("runtime-references.relative-asset-default", entry.module,
        `reads packaged ${root} without RUNTIME_HOME-aware resolution`));
    }
  }

  return { valid: issues.length === 0, issues };
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const repositoryRoot = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const result = validateRuntimeReferences(repositoryRoot);
  if (result.valid) {
    console.log(`Runtime reference validation passed: ${repositoryRoot}`);
  } else {
    for (const item of result.issues) console.error(`${item.ruleId} ${item.path}: ${item.message}`);
  }
  process.exit(result.valid ? 0 : 1);
}
