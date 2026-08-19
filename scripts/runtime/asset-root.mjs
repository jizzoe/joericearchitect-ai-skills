// Packaged asset resolution for helpers that read repository data.
//
// An installed runtime keeps repository-relative layout, so the checkout
// default and the packaged layout agree. RUNTIME_HOME is honoured first so an
// installed helper never depends on a source checkout, and a resolved root that
// does not exist fails closed instead of silently validating an empty set.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const RUNTIME_HOME_ENVIRONMENT = "RUNTIME_HOME";

const text = (value) => typeof value === "string" && value.trim().length > 0;

export function assetBaseRoot(moduleUrl, environment = process.env) {
  const home = environment[RUNTIME_HOME_ENVIRONMENT];
  if (text(home) && path.isAbsolute(home)) return { base: home, source: RUNTIME_HOME_ENVIRONMENT };
  return { base: path.resolve(path.dirname(fileURLToPath(moduleUrl)), "../.."), source: "checkout" };
}

export function resolveAssetRoot(relativeRoot, moduleUrl, environment = process.env) {
  const { base, source } = assetBaseRoot(moduleUrl, environment);
  const resolved = path.resolve(base, relativeRoot);
  if (!fs.existsSync(resolved)) {
    return { valid: false, reason: "asset-root-unresolved", resolved, source };
  }
  return { valid: true, resolved, source };
}

/**
 * CLI helper: resolve or exit with a stable diagnostic. Keeps the fail-closed
 * behaviour identical across the validators that read packaged assets.
 */
export function requireAssetRoot(relativeRoot, moduleUrl, { environment = process.env, exit = process.exit, writeError = (line) => process.stderr.write(`${line}\n`) } = {}) {
  const resolution = resolveAssetRoot(relativeRoot, moduleUrl, environment);
  if (!resolution.valid) {
    writeError(`${resolution.reason}: ${relativeRoot} (resolved ${resolution.resolved} from ${resolution.source})`);
    exit(1);
    return null;
  }
  return resolution.resolved;
}
