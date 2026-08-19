// Installed runtime location and non-secret activation metadata contract.
//
// One logical root on every platform, derived only from the user's home
// variable. Nothing here reads or writes a credential, and no PATH or shell
// startup file is modified: activation state is observed and reported.

import fs from "node:fs";
import path from "node:path";

export const RUNTIME_DIRECTORY = ".ai-skills";
export const ACTIVE_METADATA_FILENAME = "active.json";
export const INSTALLED_HISTORY_FILENAME = "installed.json";
export const METADATA_SCHEMA_VERSION = 1;
export const RUNTIME_ROOT_ENVIRONMENT = "AI_SKILLS_RUNTIME_ROOT";

const text = (value) => typeof value === "string" && value.trim().length > 0;

export function homeDirectory(environment = process.env, platform = process.platform) {
  const home = platform === "win32"
    ? environment.USERPROFILE ?? environment.HOME
    : environment.HOME;
  return text(home) && path.isAbsolute(home) ? home : null;
}

export function runtimePaths(environment = process.env, platform = process.platform) {
  const home = homeDirectory(environment, platform);
  if (!home) return { valid: false, reason: "home-directory-unavailable" };
  const base = path.join(home, RUNTIME_DIRECTORY);
  const runtimeRoot = path.join(base, "runtime");
  return {
    valid: true,
    base,
    runtimeRoot,
    binDirectory: path.join(base, "bin"),
    launcherPath: path.join(base, "bin", platform === "win32" ? "ai-skills-runtime.cmd" : "ai-skills-runtime"),
    activePath: path.join(runtimeRoot, ACTIVE_METADATA_FILENAME),
    installedPath: path.join(runtimeRoot, INSTALLED_HISTORY_FILENAME),
    versionDirectory: (digest) => path.join(runtimeRoot, `runtime-${String(digest).slice(0, 12)}`)
  };
}

export function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function writeJsonAtomically(filePath, value) {
  const temporary = `${filePath}.${process.pid}.tmp`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o644 });
  fs.renameSync(temporary, filePath);
  return filePath;
}

export function readActiveMetadata(paths) {
  const metadata = readJson(paths.activePath);
  if (metadata?.schemaVersion !== METADATA_SCHEMA_VERSION || !text(metadata.activePath) || !text(metadata.digest)) return null;
  return metadata;
}

export function readInstalledHistory(paths) {
  const history = readJson(paths.installedPath);
  if (history?.schemaVersion !== METADATA_SCHEMA_VERSION || !Array.isArray(history.history)) {
    return { schemaVersion: METADATA_SCHEMA_VERSION, history: [] };
  }
  return history;
}

/**
 * History is append-only and is the sole ordering authority; directory names
 * are never parsed to establish which runtime came first.
 */
export function appendInstalledHistory(paths, entry) {
  const history = readInstalledHistory(paths);
  history.history.push(entry);
  writeJsonAtomically(paths.installedPath, history);
  return history;
}

export function previouslyActive(paths) {
  const history = readInstalledHistory(paths).history;
  const active = readActiveMetadata(paths);
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index]?.digest && history[index].digest !== active?.digest) return history[index];
  }
  return null;
}

/**
 * Reports whether the launcher shim would be found on PATH. It never edits PATH
 * or a shell startup file.
 */
export function activationState(paths, environment = process.env, platform = process.platform) {
  const launcherPresent = fs.existsSync(paths.launcherPath);
  const separator = platform === "win32" ? ";" : ":";
  const entries = (environment.PATH ?? "").split(separator).filter(Boolean);
  return {
    launcherPath: paths.launcherPath,
    launcherPresent,
    onPath: entries.includes(paths.binDirectory),
    pathEntryToAdd: paths.binDirectory
  };
}
