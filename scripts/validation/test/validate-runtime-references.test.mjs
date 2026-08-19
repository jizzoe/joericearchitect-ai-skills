import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateRuntimeReferences } from "../validate-runtime-references.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const temporaryDirectory = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

/**
 * A miniature repository with one canonical skill and its two thin adapters.
 */
function fixture({ skill, claudeAdapter, codexAdapter, manifest, entrypointSource }) {
  const root = temporaryDirectory("runtime-references-");
  const write = (relative, contents) => {
    const destination = path.join(root, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, contents);
  };
  write("scripts/runtime/manifest.json", JSON.stringify(manifest ?? defaultManifest, null, 2));
  write("skills/base/example/SKILL.md", skill ?? compliantSkill);
  write(".claude/skills/example/SKILL.md", claudeAdapter ?? thinAdapter);
  write(".agents/skills/example/SKILL.md", codexAdapter ?? thinAdapter);
  if (entrypointSource !== null) write("scripts/validation/reads-assets.mjs", entrypointSource ?? 'import { requireAssetRoot } from "../runtime/asset-root.mjs";\n');
  return root;
}

const defaultManifest = {
  schemaVersion: 1,
  contractVersion: 3,
  sourceRoots: ["scripts/runtime"],
  assetRoots: ["quality"],
  entrypoints: [
    { name: "example-helper", module: "scripts/runtime/example.mjs", invocation: "cli" },
    { name: "example-subcommand", module: "scripts/runtime/sub.mjs", invocation: "subcommand", verbs: ["allowed-verb"] },
    { name: "reads-assets", module: "scripts/validation/reads-assets.mjs", invocation: "cli", readsAssetRoots: ["quality"] }
  ]
};

const compliantSkill = [
  "---", "name: example", "description: Example.", "---", "",
  "# Example", "",
  "Use `ai-skills-runtime run example-helper` and",
  "`ai-skills-runtime run example-subcommand allowed-verb`.", "",
  "Required runtime contract version: 3.", ""
].join("\n");

const thinAdapter = "# Example\n\nCanonical skill: `skills/base/example/SKILL.md`\n";

const codesOf = (result) => result.issues.map((item) => item.ruleId);

test("the repository's own skills and adapters satisfy the runtime reference contract", () => {
  const result = validateRuntimeReferences(repositoryRoot);
  assert.equal(result.valid, true, JSON.stringify(result.issues, null, 2));
});

test("a compliant fixture passes", () => {
  const result = validateRuntimeReferences(fixture({}));
  assert.equal(result.valid, true, JSON.stringify(result.issues, null, 2));
});

test("an unresolved workspace-relative helper path is rejected", () => {
  const skill = compliantSkill.replace(
    "Use `ai-skills-runtime run example-helper` and",
    "Use `scripts/sdd/example-helper.mjs` and"
  );
  const result = validateRuntimeReferences(fixture({ skill }));
  assert.equal(result.valid, false);
  assert.ok(codesOf(result).includes("runtime-references.legacy-path"));
});

test("an undeclared helper name is rejected", () => {
  const skill = compliantSkill.replace("run example-helper", "run not-in-the-manifest");
  const result = validateRuntimeReferences(fixture({ skill }));
  assert.ok(codesOf(result).includes("runtime-references.helper-not-declared"));
});

test("an unregistered subcommand verb is rejected", () => {
  const skill = compliantSkill.replace("example-subcommand allowed-verb", "example-subcommand forbidden-verb");
  const result = validateRuntimeReferences(fixture({ skill }));
  assert.ok(codesOf(result).includes("runtime-references.verb-not-declared"));
});

test("a missing or mismatched contract version is rejected", () => {
  const missing = validateRuntimeReferences(fixture({ skill: compliantSkill.replace("Required runtime contract version: 3.", "") }));
  assert.ok(codesOf(missing).includes("runtime-references.contract-version-missing"));

  const mismatched = validateRuntimeReferences(fixture({ skill: compliantSkill.replace("version: 3.", "version: 2.") }));
  assert.ok(codesOf(mismatched).includes("runtime-references.contract-version-mismatch"));
});

test("a platform adapter that restates canonical runtime policy is rejected", () => {
  const fat = `${thinAdapter}\n## Shared runtime\n\nRequired runtime contract version: 3.\n`;
  const claude = validateRuntimeReferences(fixture({ claudeAdapter: fat }));
  assert.ok(codesOf(claude).includes("runtime-references.adapter-duplicates-policy"));

  const codex = validateRuntimeReferences(fixture({ codexAdapter: fat }));
  assert.ok(codesOf(codex).includes("runtime-references.adapter-duplicates-policy"));
});

test("a packaged asset reader without RUNTIME_HOME-aware resolution is rejected", () => {
  const relativeDefault = 'const root = path.resolve(__dirname, "../../skills/base");\n';
  const result = validateRuntimeReferences(fixture({ entrypointSource: relativeDefault }));
  assert.ok(codesOf(result).includes("runtime-references.relative-asset-default"));
});

test("a declared entrypoint that is absent from the tree is reported", () => {
  const result = validateRuntimeReferences(fixture({ entrypointSource: null }));
  assert.ok(codesOf(result).includes("runtime-references.entrypoint-missing"));
});

test("prose after a helper name is not mistaken for a subcommand verb", () => {
  // Only code spans and fenced blocks are scanned; an ordinary sentence that
  // continues after an invocation must not be read as a verb.
  const skill = compliantSkill.replace(
    "Use `ai-skills-runtime run example-helper` and",
    "Use `ai-skills-runtime run example-helper` and then review the result, or run\n`ai-skills-runtime run example-subcommand allowed-verb`, and"
  );
  const result = validateRuntimeReferences(fixture({ skill }));
  assert.equal(result.valid, true, JSON.stringify(result.issues, null, 2));
});

test("a verb written for a cli-shaped helper inside a code span is rejected", () => {
  const skill = compliantSkill.replace("run example-helper`", "run example-helper stray-token`");
  const result = validateRuntimeReferences(fixture({ skill }));
  assert.ok(codesOf(result).includes("runtime-references.verb-not-supported"));
});

test("an invalid manifest is reported rather than silently passing", () => {
  const result = validateRuntimeReferences(fixture({ manifest: { schemaVersion: 99 } }));
  assert.equal(result.valid, false);
  assert.deepEqual(codesOf(result), ["runtime-references.manifest"]);
});
