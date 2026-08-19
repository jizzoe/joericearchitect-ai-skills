#!/usr/bin/env node
// Shared SDD runtime builder.
//
// Stages the declared source and asset roots from one reviewed revision into a
// minimal repository-shaped artifact, proves the local dependency closure stays
// inside that artifact, smoke-invokes every declared entrypoint against the
// staging directory, and only then promotes the artifact atomically.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

import {
  BUILT_MANIFEST_FILENAME, MANIFEST_SCHEMA_VERSION, isMainModule, loadManifest, repositoryRootFromModule,
  safeRelativePath
} from "./registry.mjs";

const RESOLUTION_FAILURES = [
  "Cannot find module", "Cannot find package", "ERR_MODULE_NOT_FOUND",
  "ERR_UNSUPPORTED_DIR_IMPORT", "no such file or directory"
];

const failure = (code, detail) => ({ ok: false, code, ...(detail ? { detail } : {}) });

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function listFiles(root, relative = "", { excludedDirectories = [] } = {}) {
  const absolute = path.join(root, relative);
  let entries;
  try {
    entries = fs.readdirSync(absolute, { withFileTypes: true });
  } catch {
    return null;
  }
  const files = [];
  for (const entry of [...entries].sort((left, right) => left.name.localeCompare(right.name))) {
    const next = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (excludedDirectories.includes(entry.name)) continue;
      const nested = listFiles(root, next, { excludedDirectories });
      if (nested === null) return null;
      files.push(...nested);
    } else if (entry.isFile()) {
      files.push(next);
    }
    // Symbolic links are neither staged nor followed: a staged runtime must be
    // self-contained content, not a pointer back into a checkout.
  }
  return files;
}

export function stageRoots({ source, staging, roots, excludedDirectories }) {
  const staged = [];
  for (const declared of roots) {
    const root = safeRelativePath(declared);
    if (root === null) return failure("unsafe-declared-root", declared);
    const absolute = path.join(source, root);
    if (!fs.existsSync(absolute)) return failure("declared-root-missing", root);
    const files = listFiles(absolute, "", { excludedDirectories });
    if (files === null) return failure("declared-root-unreadable", root);
    for (const relative of files) {
      const from = path.join(absolute, relative);
      const to = path.join(staging, root, relative);
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
      staged.push(`${root}/${relative}`);
    }
  }
  return { ok: true, staged: staged.sort() };
}

// Side-effect imports carry no `from` clause, so they need their own branch;
// missing them would let an undeclared dependency through the closure check.
const IMPORT_SPECIFIER = new RegExp([
  /(?:^|[\s;}])import\s+["']([^"']+)["']/.source,
  /(?:^|[\s;}])(?:import|export)\b[^;]{0,400}?\bfrom\s*["']([^"']+)["']/.source,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/.source
].join("|"), "gm");

export function localImportSpecifiers(contents) {
  const specifiers = new Set();
  for (const match of contents.matchAll(IMPORT_SPECIFIER)) {
    const specifier = match[1] ?? match[2] ?? match[3];
    if (typeof specifier === "string" && specifier.startsWith(".")) specifiers.add(specifier);
  }
  return [...specifiers].sort();
}

export function verifyClosure({ staging, files }) {
  const unresolved = [];
  for (const relative of files) {
    if (!relative.endsWith(".mjs") && !relative.endsWith(".js")) continue;
    const absolute = path.join(staging, relative);
    const contents = fs.readFileSync(absolute, "utf8");
    for (const specifier of localImportSpecifiers(contents)) {
      const resolved = path.resolve(path.dirname(absolute), specifier);
      if (resolved !== staging && !resolved.startsWith(`${staging}${path.sep}`)) {
        unresolved.push({ file: relative, specifier, reason: "escapes-declared-roots" });
      } else if (!fs.existsSync(resolved)) {
        unresolved.push({ file: relative, specifier, reason: "missing-in-staged-runtime" });
      }
    }
  }
  return unresolved.length === 0 ? { ok: true } : failure("closure-incomplete", unresolved);
}

export function digestFiles({ staging, files }) {
  const digests = {};
  for (const relative of files) {
    digests[relative] = sha256(fs.readFileSync(path.join(staging, relative)));
  }
  const aggregate = sha256(Object.keys(digests).sort().map((key) => `${key}:${digests[key]}`).join("\n"));
  return { digests, aggregate };
}

export function smokeInvoke({ staging, entrypoints, run = spawnSync }) {
  const failures = [];
  for (const entry of entrypoints) {
    const modulePath = path.join(staging, entry.module);
    if (!fs.existsSync(modulePath)) {
      failures.push({ entrypoint: entry.name, reason: "entrypoint-missing", module: entry.module });
      continue;
    }
    const args = entry.smoke?.args ?? [];
    const result = run(process.execPath, [modulePath, ...args], {
      cwd: staging,
      env: { ...process.env, RUNTIME_HOME: staging, AI_SKILLS_SMOKE: "1" },
      encoding: "utf8",
      timeout: 30_000
    });
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    const resolutionFailure = RESOLUTION_FAILURES.find((marker) => output.includes(marker));
    if (resolutionFailure) {
      failures.push({ entrypoint: entry.name, reason: "unresolved-module-or-asset", detail: resolutionFailure });
      continue;
    }
    const expected = entry.smoke?.exitCodes;
    if (Array.isArray(expected) && !expected.includes(result.status)) {
      failures.push({ entrypoint: entry.name, reason: "unexpected-smoke-exit", detail: result.status });
    }
  }
  return failures.length === 0 ? { ok: true } : failure("smoke-invocation-failed", failures);
}

export function sourceRevision(source, { run = execFileSync } = {}) {
  try {
    const revision = run("git", ["-C", source, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    const dirty = run("git", ["-C", source, "status", "--porcelain"], { encoding: "utf8" }).trim();
    return { revision, clean: dirty.length === 0 };
  } catch {
    return { revision: null, clean: false };
  }
}

export function buildRuntime({ source, output, now = new Date().toISOString(), run = spawnSync, git = execFileSync } = {}) {
  if (!path.isAbsolute(source ?? "") || !path.isAbsolute(output ?? "")) return failure("build-paths-must-be-absolute");
  const declaration = loadManifest(source);
  if (!declaration.valid) return failure("manifest-invalid", declaration.issues);
  const manifest = declaration.manifest;

  const staging = `${output}.staging-${crypto.randomUUID()}`;
  try {
    fs.mkdirSync(staging, { recursive: true, mode: 0o755 });
    const stagedSources = stageRoots({
      source, staging, roots: manifest.sourceRoots, excludedDirectories: manifest.excludedDirectories ?? []
    });
    if (!stagedSources.ok) return stagedSources;
    const stagedAssets = stageRoots({ source, staging, roots: manifest.assetRoots, excludedDirectories: [] });
    if (!stagedAssets.ok) return stagedAssets;
    const files = [...stagedSources.staged, ...stagedAssets.staged].sort();

    const closure = verifyClosure({ staging, files });
    if (!closure.ok) return closure;

    const smoke = smokeInvoke({ staging, entrypoints: manifest.entrypoints, run });
    if (!smoke.ok) return smoke;

    const { digests, aggregate } = digestFiles({ staging, files });
    const identity = sourceRevision(source, { run: git });
    const built = {
      schemaVersion: MANIFEST_SCHEMA_VERSION,
      contractVersion: manifest.contractVersion,
      sourceRevision: identity.revision && identity.clean ? identity.revision : `local+${aggregate.slice(0, 12)}`,
      sourceRevisionClean: identity.clean,
      digest: aggregate,
      builtAt: now,
      sourceRoots: manifest.sourceRoots,
      assetRoots: manifest.assetRoots,
      entrypoints: manifest.entrypoints,
      files: digests
    };
    fs.writeFileSync(path.join(staging, BUILT_MANIFEST_FILENAME), `${JSON.stringify(built, null, 2)}\n`);

    // Promotion is a single rename onto a name that must not already exist, so a
    // failed build never replaces a validated runtime.
    if (fs.existsSync(output)) return failure("output-already-exists", output);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.renameSync(staging, output);
    return { ok: true, output, manifest: built, fileCount: files.length };
  } catch (error) {
    return failure("build-failed", error?.message ?? "build failed");
  } finally {
    if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
  }
}

function parseArgs(argv) {
  const args = { source: repositoryRootFromModule(import.meta.url) };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--source") args.source = path.resolve(argv[++index]);
    else if (arg === "--output") args.output = path.resolve(argv[++index]);
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`unexpected argument: ${arg}`);
  }
  return args;
}

if (isMainModule(import.meta.url)) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help || !args.output) {
      process.stdout.write("usage: build-runtime.mjs --output <absolute-dir> [--source <absolute-repo>]\n");
      process.exit(args.help ? 0 : 2);
    }
    const result = buildRuntime({ source: args.source, output: args.output });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exit(result.ok ? 0 : 1);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(2);
  }
}
