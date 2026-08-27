import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { codexReviewEventContractRevision } from "./codex-review-event-contract.mjs";
import { parseReviewFindingsPayload, validateReviewFindingsPayload } from "./independent-review-contract.mjs";

const safeText = (value) => typeof value === "string" && value.length > 0 && !/[\r\n\0]/.test(value);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const exactKeys = (value, expected) => value && typeof value === "object" && !Array.isArray(value) &&
  Object.keys(value).sort().join("\0") === [...expected].sort().join("\0");

function validDestination(value) {
  const basename = typeof value === "string" ? path.basename(value) : "";
  return typeof value === "string" && path.isAbsolute(value) && !/[\r\n\0]/.test(value) && basename !== "" && basename !== "." && basename !== "..";
}

function absent(fileSystem, target) {
  try {
    fileSystem.lstatSync(target);
    return false;
  } catch (error) {
    if (error?.code === "ENOENT") return true;
    throw error;
  }
}

function sameIdentity(left, right) {
  return left?.isFile() && right?.isFile() && !left.isSymbolicLink() && !right.isSymbolicLink() &&
    Number.isInteger(left.dev) && Number.isInteger(left.ino) && left.dev === right.dev && left.ino === right.ino &&
    left.nlink >= 1 && right.nlink >= 1;
}

function safeOwnedDirectory(entry) {
  if (!entry?.isDirectory() || entry.isSymbolicLink() || !Number.isInteger(entry.dev) || !Number.isInteger(entry.ino)) return false;
  if (typeof process.getuid === "function" && Number.isInteger(entry.uid) && entry.uid !== process.getuid()) return false;
  return process.platform === "win32" || (entry.mode & 0o077) === 0;
}

function sameDirectory(fileSystem, directory, expected) {
  try {
    const current = fileSystem.lstatSync(directory);
    return safeOwnedDirectory(current) && current.dev === expected.dev && current.ino === expected.ino;
  } catch {
    return false;
  }
}

function syncDirectory(fileSystem, directory) {
  let descriptor;
  try {
    descriptor = fileSystem.openSync(directory, fileSystem.constants.O_RDONLY);
    fileSystem.fsyncSync(descriptor);
  } catch (error) {
    if (!["EINVAL", "ENOTSUP", "EISDIR", "EPERM", "EACCES"].includes(error?.code)) throw error;
  } finally {
    if (descriptor !== undefined) fileSystem.closeSync(descriptor);
  }
}

function inspectPublished(fileSystem, target, expectedBytes, expectedIdentity, { requireLinked = false } = {}) {
  const entry = fileSystem.lstatSync(target);
  if (!entry.isFile() || entry.isSymbolicLink() || !sameIdentity(entry, expectedIdentity) || (requireLinked && entry.nlink < 2)) return false;
  const descriptor = fileSystem.openSync(target, fileSystem.constants.O_RDONLY | (fileSystem.constants.O_NOFOLLOW ?? 0));
  try {
    const opened = fileSystem.fstatSync(descriptor);
    const body = fileSystem.readFileSync(descriptor);
    return sameIdentity(opened, expectedIdentity) && (!requireLinked || opened.nlink >= 2) && body.equals(expectedBytes);
  } finally {
    fileSystem.closeSync(descriptor);
  }
}

function removeIfOwned(fileSystem, target, expectedBytes, expectedIdentity, directoryIdentity) {
  try {
    if (!sameDirectory(fileSystem, path.dirname(target), directoryIdentity)) return false;
    if (!inspectPublished(fileSystem, target, expectedBytes, expectedIdentity)) return false;
    fileSystem.unlinkSync(target);
    syncDirectory(fileSystem, path.dirname(target));
    return true;
  } catch {
    return false;
  }
}

/** Publish bytes with hard-link creation as the atomic no-clobber commit point. */
export function publishExclusiveReviewArtifact({ destinationPath, content, mode = 0o600 } = {}, {
  fileSystem = fs,
  nonce = randomUUID
} = {}) {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content ?? "", "utf8");
  if (!validDestination(destinationPath) || bytes.length === 0 || mode !== 0o600) {
    return { published: false, code: "review-artifact-publication-input-invalid" };
  }
  const directory = path.dirname(destinationPath);
  let directoryEntry;
  try {
    directoryEntry = fileSystem.lstatSync(directory);
    if (!safeOwnedDirectory(directoryEntry)) {
      return { published: false, code: "review-artifact-publication-directory-unsafe" };
    }
    if (!absent(fileSystem, destinationPath)) return { published: false, code: "review-artifact-publication-destination-exists" };
  } catch {
    return { published: false, code: "review-artifact-publication-directory-unavailable" };
  }

  const temporaryPath = path.join(directory, `.${path.basename(destinationPath)}.${nonce()}.tmp`);
  let descriptor;
  let temporaryIdentity;
  let linked = false;
  try {
    descriptor = fileSystem.openSync(temporaryPath,
      fileSystem.constants.O_WRONLY | fileSystem.constants.O_CREAT | fileSystem.constants.O_EXCL | (fileSystem.constants.O_NOFOLLOW ?? 0), mode);
    let offset = 0;
    while (offset < bytes.length) {
      const written = fileSystem.writeSync(descriptor, bytes, offset, bytes.length - offset, null);
      if (!Number.isInteger(written) || written <= 0) throw Object.assign(new Error("write did not advance"), { code: "EWRITE" });
      offset += written;
    }
    fileSystem.fsyncSync(descriptor);
    temporaryIdentity = fileSystem.fstatSync(descriptor);
    fileSystem.closeSync(descriptor);
    descriptor = undefined;
    if (!temporaryIdentity.isFile() || temporaryIdentity.isSymbolicLink() || temporaryIdentity.size !== bytes.length) {
      throw Object.assign(new Error("temporary identity invalid"), { code: "EIDENTITY" });
    }
    if (!sameDirectory(fileSystem, directory, directoryEntry)) throw Object.assign(new Error("directory identity changed"), { code: "EDIRECTORY" });
    fileSystem.linkSync(temporaryPath, destinationPath);
    linked = true;
    if (!sameDirectory(fileSystem, directory, directoryEntry)) throw Object.assign(new Error("directory identity changed"), { code: "EDIRECTORY" });
    if (!inspectPublished(fileSystem, destinationPath, bytes, temporaryIdentity, { requireLinked: true }) ||
        !sameDirectory(fileSystem, directory, directoryEntry)) {
      throw Object.assign(new Error("published identity invalid"), { code: "EIDENTITY" });
    }
    fileSystem.unlinkSync(temporaryPath);
    syncDirectory(fileSystem, directory);
    return {
      published: true,
      code: "review-artifact-published",
      bytes: bytes.length,
      sha256: sha256(bytes),
      identity: Object.freeze({ dev: temporaryIdentity.dev, ino: temporaryIdentity.ino }),
      directoryIdentity: Object.freeze({ dev: directoryEntry.dev, ino: directoryEntry.ino })
    };
  } catch (error) {
    if (descriptor !== undefined) {
      try { fileSystem.closeSync(descriptor); } catch { /* best-effort descriptor cleanup */ }
    }
    let cleanup = true;
    if (linked) cleanup = removeIfOwned(fileSystem, destinationPath, bytes, temporaryIdentity, directoryEntry);
    try {
      if (sameDirectory(fileSystem, directory, directoryEntry) && !absent(fileSystem, temporaryPath)) fileSystem.unlinkSync(temporaryPath);
      else if (!sameDirectory(fileSystem, directory, directoryEntry)) cleanup = false;
    } catch { cleanup = false; }
    const code = error?.code === "EEXIST"
      ? "review-artifact-publication-destination-exists"
      : ["EPERM", "EACCES", "ENOTSUP", "EXDEV"].includes(error?.code)
        ? "review-artifact-publication-hard-link-unavailable"
        : ["EIDENTITY", "EDIRECTORY"].includes(error?.code)
          ? "review-artifact-publication-final-inspection-invalid"
          : "review-artifact-publication-failed";
    return { published: false, code, cleanupComplete: cleanup };
  }
}

export function validateCodexCaptureReceipt(value) {
  const keys = ["schemaVersion", "transportRevision", "executionId", "requestDigest", "cliIdentitySha256",
    "cliVersionClassification", "exitStatus", "eventBytes", "eventCount", "candidateCount", "toolEventCount",
    "terminalClassification", "artifactReceiptState", "diagnosticCode"];
  return exactKeys(value, keys) && value.schemaVersion === 1 && value.transportRevision === codexReviewEventContractRevision &&
    safeText(value.executionId) && /^[0-9a-f]{64}$/.test(value.requestDigest) && /^[0-9a-f]{64}$/.test(value.cliIdentitySha256) &&
    safeText(value.cliVersionClassification) && (value.exitStatus === null || Number.isInteger(value.exitStatus)) &&
    ["eventBytes", "eventCount", "candidateCount", "toolEventCount"].every((key) => Number.isInteger(value[key]) && value[key] >= 0) &&
    safeText(value.terminalClassification) && ["published", "absent"].includes(value.artifactReceiptState) && safeText(value.diagnosticCode);
}

export function publishCodexCaptureReceipt({ receiptPath, receipt } = {}, dependencies) {
  if (!validateCodexCaptureReceipt(receipt)) return { published: false, code: "codex-capture-receipt-invalid" };
  return publishExclusiveReviewArtifact({ destinationPath: receiptPath, content: `${JSON.stringify(receipt)}\n` }, dependencies);
}

export function publishCodexCaptureSuccess({ resultPath, receiptPath, candidateText, receipt } = {}, dependencies) {
  if (receipt?.artifactReceiptState !== "published") return { published: false, code: "codex-capture-success-receipt-invalid" };
  const parsed = parseReviewFindingsPayload(candidateText, { allowEnvelope: false });
  if (!parsed.parsed || !validateReviewFindingsPayload(parsed.payload).valid) {
    return { published: false, code: "codex-capture-success-payload-invalid" };
  }
  const resultBytes = Buffer.from(candidateText ?? "", "utf8");
  const result = publishExclusiveReviewArtifact({ destinationPath: resultPath, content: resultBytes }, dependencies);
  if (!result.published) return { published: false, code: result.code, result, receipt: null };
  const receiptPublication = publishCodexCaptureReceipt({ receiptPath, receipt }, dependencies);
  if (receiptPublication.published) return { published: true, code: "codex-capture-artifacts-published", result, receipt: receiptPublication };

  const identity = { isFile: () => true, isSymbolicLink: () => false, dev: result.identity.dev, ino: result.identity.ino, nlink: 2 };
  const fileSystem = dependencies?.fileSystem ?? fs;
  const directoryIdentity = { isDirectory: () => true, isSymbolicLink: () => false, dev: result.directoryIdentity.dev, ino: result.directoryIdentity.ino, uid: typeof process.getuid === "function" ? process.getuid() : undefined, mode: 0o700 };
  const removed = removeIfOwned(fileSystem, resultPath, resultBytes, identity, directoryIdentity);
  return {
    published: false,
    code: "codex-capture-receipt-publication-failed",
    result,
    receipt: receiptPublication,
    cleanupComplete: removed
  };
}
