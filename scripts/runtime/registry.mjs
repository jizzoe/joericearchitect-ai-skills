// Shared SDD runtime registry.
//
// Owns the declaration contract for the distributed runtime: which helper
// entrypoints exist, how each one is invoked, which roots are staged, and what
// a structurally valid dispatch target looks like. This module makes no
// authorization decision and reads no credentials.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const MANIFEST_SCHEMA_VERSION = 1;
export const REQUIRED_NODE_MAJOR = 20;

const text = (value) => typeof value === "string" && value.trim().length > 0;
const invocations = new Set(["cli", "subcommand"]);
const verbShape = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const helperShape = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// A staged runtime keeps repository-relative layout, so the declaration file
// sits at the same relative path in a checkout and in an installed runtime.
export const MANIFEST_RELATIVE_PATH = "scripts/runtime/manifest.json";
export const BUILT_MANIFEST_FILENAME = "runtime-manifest.json";

/**
 * True when the module is the process entrypoint.
 *
 * Comparing `import.meta.url` against a literal `file://` plus `process.argv[1]`
 * never matches on Windows, where argv carries a drive-letter path with
 * backslashes, so a CLI guarded that way exits zero without running.
 */
export function isMainModule(moduleUrl, argv = process.argv) {
  if (!argv[1]) return false;
  try {
    return moduleUrl === pathToFileURL(argv[1]).href;
  } catch {
    return false;
  }
}

export function repositoryRootFromModule(moduleUrl) {
  return path.resolve(path.dirname(fileURLToPath(moduleUrl)), "../..");
}

/**
 * Reject any path component that could escape the declared staging boundary.
 */
export function safeRelativePath(value) {
  if (!text(value) || path.isAbsolute(value)) return null;
  const normalized = path.normalize(value).split(path.sep).join("/");
  if (normalized === "." || normalized.startsWith("../") || normalized === ".." ||
      normalized.split("/").includes("..") || normalized.startsWith("/")) return null;
  return normalized;
}

export function validateManifest(manifest) {
  const issues = [];
  if (manifest?.schemaVersion !== MANIFEST_SCHEMA_VERSION) issues.push("manifest-schema-version-unsupported");
  if (!Number.isInteger(manifest?.contractVersion) || manifest.contractVersion < 1) issues.push("manifest-contract-version-invalid");
  for (const key of ["sourceRoots", "assetRoots"]) {
    const roots = manifest?.[key];
    if (!Array.isArray(roots) || roots.length === 0 || roots.some((root) => safeRelativePath(root) === null)) {
      issues.push(`manifest-${key === "sourceRoots" ? "source" : "asset"}-roots-invalid`);
    }
  }
  const entrypoints = manifest?.entrypoints;
  if (!Array.isArray(entrypoints) || entrypoints.length === 0) {
    issues.push("manifest-entrypoints-invalid");
    return { valid: false, issues };
  }
  const seen = new Set();
  for (const entry of entrypoints) {
    if (!text(entry?.name) || !helperShape.test(entry.name)) { issues.push("manifest-entrypoint-name-invalid"); continue; }
    if (seen.has(entry.name)) { issues.push(`manifest-entrypoint-duplicate:${entry.name}`); continue; }
    seen.add(entry.name);
    if (safeRelativePath(entry.module) === null) issues.push(`manifest-entrypoint-module-invalid:${entry.name}`);
    if (!invocations.has(entry.invocation)) issues.push(`manifest-entrypoint-invocation-invalid:${entry.name}`);
    if (entry.invocation === "subcommand") {
      if (!Array.isArray(entry.verbs) || entry.verbs.length === 0 ||
          entry.verbs.some((verb) => !text(verb) || !verbShape.test(verb)) ||
          new Set(entry.verbs).size !== entry.verbs.length) {
        issues.push(`manifest-entrypoint-verbs-invalid:${entry.name}`);
      }
    } else if (entry.verbs !== undefined) {
      issues.push(`manifest-entrypoint-verbs-unexpected:${entry.name}`);
    }
    if (entry.payloadWrapper !== undefined && safeRelativePath(entry.payloadWrapper) === null) {
      issues.push(`manifest-entrypoint-wrapper-invalid:${entry.name}`);
    }
  }
  return { valid: issues.length === 0, issues };
}

export function loadManifest(root) {
  const manifestPath = path.join(root, MANIFEST_RELATIVE_PATH);
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    return { valid: false, issues: ["manifest-unreadable"], manifestPath };
  }
  const validated = validateManifest(manifest);
  return { ...validated, manifest: validated.valid ? manifest : undefined, manifestPath };
}

export function findEntrypoint(manifest, name) {
  if (!text(name)) return null;
  return manifest?.entrypoints?.find((entry) => entry.name === name) ?? null;
}

export function verbDeclared(entry, verb) {
  if (entry?.invocation !== "subcommand") return false;
  return Array.isArray(entry.verbs) && entry.verbs.includes(verb);
}

export function declaredHelperNames(manifest) {
  return (manifest?.entrypoints ?? []).map((entry) => entry.name).sort();
}

/**
 * Legacy workspace-relative helper references that migrated skill text and
 * platform adapters must no longer contain.
 */
export const LEGACY_HELPER_REFERENCE = /(?<![\w/.-])scripts\/(?:sdd|github|validation|skills)\/[a-z0-9-]+\.mjs/g;

export function nodeVersionSupported(version = process.versions.node) {
  const major = Number.parseInt(String(version).split(".")[0], 10);
  return Number.isInteger(major) && major >= REQUIRED_NODE_MAJOR;
}

/**
 * Mechanical target validation only. This deliberately answers "is this a
 * structurally usable repository path", never "is this operation allowed".
 * Authorization stays in scripts/sdd/check-operation-authorization.mjs and the
 * helper-level checks that call it.
 */
export function validateTargetRepository(target, { stat = fs.statSync, lstat = fs.lstatSync, realpath = fs.realpathSync } = {}) {
  if (!text(target)) return { valid: false, reason: "target-repository-absent" };
  if (!path.isAbsolute(target)) return { valid: false, reason: "target-repository-not-absolute" };
  if (path.normalize(target) !== target.replace(/\/+$/, "") && path.normalize(target) !== target) {
    return { valid: false, reason: "target-repository-not-canonical" };
  }
  // The target itself must be a real directory. An ancestor may be a symbolic
  // link — /tmp is one on macOS — because the canonical path is what gets
  // passed to the helper, but a target that is itself a link is refused.
  try {
    if (lstat(target).isSymbolicLink()) return { valid: false, reason: "target-repository-symlink-escape" };
  } catch {
    return { valid: false, reason: "target-repository-missing" };
  }
  let resolved;
  try {
    resolved = realpath(target);
  } catch {
    return { valid: false, reason: "target-repository-missing" };
  }
  try {
    if (!stat(resolved).isDirectory()) return { valid: false, reason: "target-repository-not-directory" };
    const gitPath = path.join(resolved, ".git");
    const gitStat = stat(gitPath);
    if (!gitStat.isDirectory() && !gitStat.isFile()) return { valid: false, reason: "target-repository-not-work-tree-root" };
  } catch {
    return { valid: false, reason: "target-repository-not-work-tree-root" };
  }
  return { valid: true, target: resolved };
}
