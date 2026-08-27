import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  buildRuntime, digestFiles, listFiles, localImportSpecifiers, smokeInvoke, verifyClosure
} from "../build-runtime.mjs";
import { isMainModule, validateManifest, safeRelativePath } from "../registry.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function temporaryDirectory(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/**
 * A miniature source tree keeps the failure-path tests fast and independent of
 * the repository's real helper inventory.
 */
function syntheticSource({ manifest, files }) {
  const root = temporaryDirectory("runtime-source-");
  for (const [relative, contents] of Object.entries(files)) {
    const destination = path.join(root, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, contents);
  }
  const manifestPath = path.join(root, "scripts/runtime/manifest.json");
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return root;
}

const baseManifest = {
  schemaVersion: 1,
  contractVersion: 1,
  sourceRoots: ["scripts/runtime"],
  assetRoots: ["quality"],
  entrypoints: [{ name: "example", module: "scripts/runtime/example.mjs", invocation: "cli", smoke: { args: [], exitCodes: [0] } }]
};

const exampleHelper = [
  'import fs from "node:fs";',
  'import path from "node:path";',
  'import { fileURLToPath, pathToFileURL } from "node:url";',
  'const root = process.env.RUNTIME_HOME ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");',
  'fs.readFileSync(path.join(root, "quality/rules.json"), "utf8");',
  'process.stdout.write("ok\\n");'
].join("\n");

test("a reviewed source builds one digest-bound runtime with a complete manifest", () => {
  const source = syntheticSource({
    manifest: baseManifest,
    files: { "scripts/runtime/example.mjs": exampleHelper, "quality/rules.json": "{}\n" }
  });
  const output = path.join(temporaryDirectory("runtime-out-"), "runtime");
  const result = buildRuntime({ source, output });

  assert.equal(result.ok, true);
  assert.equal(result.manifest.contractVersion, 1);
  assert.match(result.manifest.digest, /^[0-9a-f]{64}$/);
  assert.ok(result.manifest.builtAt);
  assert.ok(fs.existsSync(path.join(output, "runtime-manifest.json")));
  // Repository-relative layout is preserved so module-relative resolution holds.
  assert.ok(fs.existsSync(path.join(output, "scripts/runtime/example.mjs")));
  assert.ok(fs.existsSync(path.join(output, "quality/rules.json")));
  assert.equal(Object.keys(result.manifest.files).length, 3);
  // No product-specific repository, credential, or approval state is embedded.
  const serialized = JSON.stringify(result.manifest);
  assert.doesNotMatch(serialized, /jizzoe|token|credential|GH_TOKEN/i);
});

test("the build is deterministic for one unchanged source revision", () => {
  const source = syntheticSource({
    manifest: baseManifest,
    files: { "scripts/runtime/example.mjs": exampleHelper, "quality/rules.json": "{}\n" }
  });
  const first = buildRuntime({ source, output: path.join(temporaryDirectory("runtime-a-"), "runtime") });
  const second = buildRuntime({ source, output: path.join(temporaryDirectory("runtime-b-"), "runtime") });
  assert.equal(first.ok && second.ok, true);
  assert.equal(first.manifest.digest, second.manifest.digest);
});

test("a declared entrypoint missing from the source fails without producing a runtime", () => {
  const source = syntheticSource({
    manifest: baseManifest,
    files: { "scripts/runtime/other.mjs": "process.stdout.write(\"ok\\n\");", "quality/rules.json": "{}\n" }
  });
  const output = path.join(temporaryDirectory("runtime-out-"), "runtime");
  const result = buildRuntime({ source, output });
  assert.equal(result.ok, false);
  assert.equal(result.code, "smoke-invocation-failed");
  assert.equal(result.detail[0].reason, "entrypoint-missing");
  assert.equal(fs.existsSync(output), false);
});

test("a local import outside the declared roots fails the closure check", () => {
  const source = syntheticSource({
    manifest: baseManifest,
    files: {
      // Resolves above the staging root itself, not merely outside a declared root.
      "scripts/runtime/example.mjs": 'import "../../../outside/helper.mjs";\n',
      "outside/helper.mjs": "export const value = 1;\n",
      "quality/rules.json": "{}\n"
    }
  });
  const result = buildRuntime({ source, output: path.join(temporaryDirectory("runtime-out-"), "runtime") });
  assert.equal(result.ok, false);
  assert.equal(result.code, "closure-incomplete");
  assert.equal(result.detail[0].reason, "escapes-declared-roots");
});

test("an undeclared local import inside the tree is reported as missing from the staged runtime", () => {
  // An import that stays under the staging root but names a file no declared
  // root contributed: the artifact would ship broken without this check.
  const source = syntheticSource({
    manifest: { ...baseManifest, sourceRoots: ["scripts/runtime"] },
    files: {
      "scripts/runtime/example.mjs": 'import "../../outside/helper.mjs";\nimport "./absent.mjs";\n',
      "outside/helper.mjs": "export const value = 1;\n",
      "quality/rules.json": "{}\n"
    }
  });
  const result = buildRuntime({ source, output: path.join(temporaryDirectory("runtime-out-"), "runtime") });
  assert.equal(result.ok, false);
  assert.equal(result.code, "closure-incomplete");
  assert.equal(result.detail[0].reason, "missing-in-staged-runtime");
});

test("a declared asset that no longer resolves is caught by staged smoke invocation", () => {
  // Static import analysis cannot see a data read, so this is the case the
  // smoke pass exists for.
  const source = syntheticSource({
    manifest: { ...baseManifest, assetRoots: ["quality"] },
    files: { "scripts/runtime/example.mjs": exampleHelper, "quality/unrelated.json": "{}\n" }
  });
  const result = buildRuntime({ source, output: path.join(temporaryDirectory("runtime-out-"), "runtime") });
  assert.equal(result.ok, false);
  assert.equal(result.code, "smoke-invocation-failed");
  assert.equal(result.detail[0].reason, "unresolved-module-or-asset");
});

test("a missing declared asset root fails before staging completes", () => {
  const source = syntheticSource({
    manifest: baseManifest,
    files: { "scripts/runtime/example.mjs": exampleHelper }
  });
  const result = buildRuntime({ source, output: path.join(temporaryDirectory("runtime-out-"), "runtime") });
  assert.equal(result.ok, false);
  assert.equal(result.code, "declared-root-missing");
});

test("an unsafe declared root is refused", () => {
  assert.equal(safeRelativePath("../escape"), null);
  assert.equal(safeRelativePath("/absolute"), null);
  assert.equal(safeRelativePath("scripts/../../escape"), null);
  assert.equal(safeRelativePath("scripts/runtime"), "scripts/runtime");
  const source = syntheticSource({
    manifest: { ...baseManifest, sourceRoots: ["../escape"] },
    files: { "quality/rules.json": "{}\n" }
  });
  const result = buildRuntime({ source, output: path.join(temporaryDirectory("runtime-out-"), "runtime") });
  assert.equal(result.ok, false);
  // Declaration validation rejects it before staging is reached; the staging
  // guard remains as defence in depth.
  assert.equal(result.code, "manifest-invalid");
  assert.ok(result.detail.includes("manifest-source-roots-invalid"));
});

test("promotion never replaces an existing runtime artifact", () => {
  const source = syntheticSource({
    manifest: baseManifest,
    files: { "scripts/runtime/example.mjs": exampleHelper, "quality/rules.json": "{}\n" }
  });
  const output = path.join(temporaryDirectory("runtime-out-"), "runtime");
  assert.equal(buildRuntime({ source, output }).ok, true);
  const second = buildRuntime({ source, output });
  assert.equal(second.ok, false);
  assert.equal(second.code, "output-already-exists");
});

test("staging excludes declared directories and never follows symbolic links", () => {
  const source = syntheticSource({
    manifest: { ...baseManifest, excludedDirectories: ["test"] },
    files: {
      "scripts/runtime/example.mjs": exampleHelper,
      "scripts/runtime/test/example.test.mjs": "// excluded\n",
      "quality/rules.json": "{}\n"
    }
  });
  fs.symlinkSync("/etc/hosts", path.join(source, "scripts/runtime/linked.mjs"));
  const output = path.join(temporaryDirectory("runtime-out-"), "runtime");
  const result = buildRuntime({ source, output });
  assert.equal(result.ok, true);
  assert.equal(fs.existsSync(path.join(output, "scripts/runtime/test/example.test.mjs")), false);
  assert.equal(fs.existsSync(path.join(output, "scripts/runtime/linked.mjs")), false);
});

test("the repository's own manifest and helper inventory build a complete runtime", () => {
  const output = path.join(temporaryDirectory("runtime-repo-"), "runtime");
  const result = buildRuntime({ source: repositoryRoot, output });
  assert.equal(result.ok, true, JSON.stringify(result));
  // Every helper a canonical skill names must be declared and staged.
  const declared = new Set(result.manifest.entrypoints.map((entry) => entry.name));
  for (const helper of ["check-operation-authorization", "github-cli-auth-context", "platform-review-adapters", "autonomous-sdd-controller",
    "independent-review-contract", "research-planning-skill-runtime", "sdd-lifecycle-hygiene",
    "sdd-workspace-cleanup", "create-or-find-issue", "select-next-work", "validate-pr-contract",
    "codex-review-event-capture", "review-package-capsule", "review-adapter-dispatch"]) {
    assert.ok(declared.has(helper), `missing declared helper: ${helper}`);
  }
  for (const entry of result.manifest.entrypoints) {
    assert.ok(fs.existsSync(path.join(output, entry.module)), `unstaged entrypoint: ${entry.name}`);
  }
  for (const relative of ["scripts/sdd/codex-review-event-capture.mjs", "scripts/sdd/review-package-capsule.mjs"]) {
    const installed = path.join(output, relative);
    const source = path.join(repositoryRoot, relative);
    assert.equal(result.manifest.files[relative], digestFiles({ staging: output, files: [relative] }).digests[relative]);
    assert.equal(fs.readFileSync(installed).compare(fs.readFileSync(source)), 0);
    assert.doesNotMatch(fs.readFileSync(installed, "utf8"), new RegExp(repositoryRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("manifest validation rejects malformed declarations", () => {
  assert.equal(validateManifest({ ...baseManifest, schemaVersion: 2 }).valid, false);
  assert.equal(validateManifest({ ...baseManifest, contractVersion: 0 }).valid, false);
  assert.equal(validateManifest({ ...baseManifest, entrypoints: [] }).valid, false);
  const duplicate = { ...baseManifest, entrypoints: [baseManifest.entrypoints[0], baseManifest.entrypoints[0]] };
  assert.ok(validateManifest(duplicate).issues.some((issue) => issue.startsWith("manifest-entrypoint-duplicate")));
  const badVerbs = {
    ...baseManifest,
    entrypoints: [{ name: "example", module: "scripts/runtime/example.mjs", invocation: "subcommand", verbs: [] }]
  };
  assert.ok(validateManifest(badVerbs).issues.some((issue) => issue.startsWith("manifest-entrypoint-verbs-invalid")));
});

test("import scanning finds only local specifiers", () => {
  const contents = [
    'import fs from "node:fs";',
    'import { a } from "./local.mjs";',
    'import { b } from "../sibling/other.mjs";',
    'const c = await import("./dynamic.mjs");'
  ].join("\n");
  assert.deepEqual(localImportSpecifiers(contents), ["../sibling/other.mjs", "./dynamic.mjs", "./local.mjs"]);
});

test("file listing and digests are stable and order independent", () => {
  const root = temporaryDirectory("runtime-digest-");
  fs.mkdirSync(path.join(root, "nested"), { recursive: true });
  fs.writeFileSync(path.join(root, "b.mjs"), "b\n");
  fs.writeFileSync(path.join(root, "a.mjs"), "a\n");
  fs.writeFileSync(path.join(root, "nested/c.mjs"), "c\n");
  const files = listFiles(root);
  assert.deepEqual(files, ["a.mjs", "b.mjs", "nested/c.mjs"]);
  const first = digestFiles({ staging: root, files });
  const second = digestFiles({ staging: root, files: [...files].reverse() });
  assert.equal(first.aggregate, second.aggregate);
});

test("closure and smoke helpers report their own failures without throwing", () => {
  const root = temporaryDirectory("runtime-helpers-");
  fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(root, "scripts/a.mjs"), 'import "./missing.mjs";\n');
  const closure = verifyClosure({ staging: root, files: ["scripts/a.mjs"] });
  assert.equal(closure.ok, false);
  const smoke = smokeInvoke({ staging: root, entrypoints: [{ name: "absent", module: "scripts/absent.mjs" }] });
  assert.equal(smoke.ok, false);
});

test("the main-module guard resolves a platform path rather than a literal file URL", () => {
  // A `file://` + process.argv[1] comparison never matches on Windows, where
  // argv carries a drive-letter path with backslashes, so the CLI would exit
  // zero without running.
  const posix = "/repo/scripts/runtime/build-runtime.mjs";
  assert.equal(isMainModule(pathToFileURL(posix).href, ["node", posix]), true);
  assert.equal(isMainModule("file:///repo/scripts/runtime/other.mjs", ["node", posix]), false);
  assert.equal(isMainModule(pathToFileURL(posix).href, ["node"]), false);

  const windows = "D:\\a\\repo\\scripts\\runtime\\build-runtime.mjs";
  const windowsUrl = pathToFileURL(windows).href;
  assert.equal(isMainModule(windowsUrl, ["node", windows]), true);
  // The literal form this replaced would not have matched.
  assert.notEqual(windowsUrl, `file://${windows}`);

  // Every runtime CLI uses the shared guard.
  for (const module of ["build-runtime.mjs", "launcher.mjs", "install-runtime.mjs"]) {
    const source = fs.readFileSync(path.join(repositoryRoot, "scripts/runtime", module), "utf8");
    assert.match(source, /isMainModule\(import\.meta\.url\)/, `${module} must use the shared main guard`);
    assert.doesNotMatch(source, /`file:\/\/\$\{process\.argv\[1\]\}`/, `${module} must not compare a literal file URL`);
  }
});
