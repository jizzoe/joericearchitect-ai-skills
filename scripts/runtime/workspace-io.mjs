// Bounded workspace io for runtime entrypoints.
//
// Every read and write is confined to one validated absolute target repository
// root. A path that escapes the root, is absolute, or traverses upward is
// refused before any filesystem call. This module grants no authorization; the
// helpers it serves keep their own checks.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const text = (value) => typeof value === "string" && value.trim().length > 0;

export function createWorkspaceIo(root, { fileSystem = fs } = {}) {
  if (!text(root) || !path.isAbsolute(root)) throw new Error("workspace-root-invalid");

  const resolveWithin = (relativePath) => {
    if (!text(relativePath) || path.isAbsolute(relativePath)) throw new Error("workspace-path-invalid");
    const resolved = path.resolve(root, relativePath);
    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) throw new Error("workspace-path-escape");
    return resolved;
  };

  const readArtifact = (relativePath) => {
    const resolved = resolveWithin(relativePath);
    try {
      return fileSystem.readFileSync(resolved, "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") return undefined;
      throw error;
    }
  };

  // Stage every file first, then promote. A staging failure leaves the
  // workspace untouched; promotion failure is reported without claiming a
  // commit.
  const writeArtifactsAtomically = (operations) => {
    const staged = [];
    try {
      for (const operation of operations) {
        const destination = resolveWithin(operation?.path);
        if (typeof operation?.content !== "string") throw new Error("workspace-content-invalid");
        fileSystem.mkdirSync(path.dirname(destination), { recursive: true });
        const temporary = `${destination}.${process.pid}.${crypto.randomUUID()}.tmp`;
        fileSystem.writeFileSync(temporary, operation.content, { mode: 0o644 });
        staged.push({ temporary, destination });
      }
    } catch (error) {
      for (const { temporary } of staged) {
        try { fileSystem.rmSync(temporary, { force: true }); } catch { /* best effort */ }
      }
      throw error;
    }
    for (const { temporary, destination } of staged) fileSystem.renameSync(temporary, destination);
    return { committed: true, paths: staged.map(({ destination }) => path.relative(root, destination)) };
  };

  return {
    root,
    resolveWithin,
    readArtifact,
    writeArtifact: (operation) => writeArtifactsAtomically([operation]),
    writeArtifactsAtomically
  };
}

/**
 * The launcher exports the validated target as an environment variable so an
 * entrypoint never has to infer a workspace from its own location.
 */
export const TARGET_REPOSITORY_ENVIRONMENT = "AI_SKILLS_TARGET_REPOSITORY";

export function workspaceIoFromEnvironment(environment = process.env) {
  const root = environment[TARGET_REPOSITORY_ENVIRONMENT];
  return text(root) ? createWorkspaceIo(root) : null;
}
