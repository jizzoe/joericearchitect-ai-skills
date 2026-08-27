import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { canonicalJson, validateReviewPackage } from "./independent-review-contract.mjs";

export const reviewPackageCapsuleRevision = "independent-review-package-capsule-v1";
export const reviewPackageCapsuleDirectoryName = ".ai-independent-review-package";
export const reviewPackageCapsuleIndexName = "index.json";
export const maximumReviewPackageCanonicalBytes = 16 * 1024 * 1024;
export const maximumReviewPackageChunkBytes = 64 * 1024;
export const maximumReviewPackageChunks = 512;
export const maximumReviewPackageIndexBytes = 1024 * 1024;

const legacyPackageName = ".ai-independent-review-package.json";
const sections = ["metadata", "artifacts", "validation-evidence", "diff"];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const digest = (value) => typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
const commit = (value) => typeof value === "string" && /^[0-9a-f]{40}$/.test(value);
const exactKeys = (value, expected) => value && typeof value === "object" && !Array.isArray(value) &&
  Object.keys(value).sort().join("\0") === [...expected].sort().join("\0");

function unavailable(code) {
  return { available: false, code };
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

function stableRegularFile(fileSystem, filePath, maximumBytes) {
  let descriptor;
  try {
    const entry = fileSystem.lstatSync(filePath);
    if (!entry.isFile() || entry.isSymbolicLink() || entry.size <= 0 || entry.size > maximumBytes) return null;
    if (process.platform !== "win32" && (entry.mode & 0o222) !== 0) return null;
    descriptor = fileSystem.openSync(filePath, fileSystem.constants.O_RDONLY | (fileSystem.constants.O_NOFOLLOW ?? 0));
    const opened = fileSystem.fstatSync(descriptor);
    if (!opened.isFile() || opened.isSymbolicLink() || opened.dev !== entry.dev || opened.ino !== entry.ino || opened.size !== entry.size) return null;
    const bytes = fileSystem.readFileSync(descriptor);
    const confirmed = fileSystem.fstatSync(descriptor);
    if (confirmed.dev !== opened.dev || confirmed.ino !== opened.ino || confirmed.size !== bytes.length) return null;
    return bytes;
  } catch {
    return null;
  } finally {
    if (descriptor !== undefined) fileSystem.closeSync(descriptor);
  }
}

function readOnlyDirectoryIdentity(fileSystem, directoryPath) {
  try {
    const entry = fileSystem.lstatSync(directoryPath);
    return entry.isDirectory() && !entry.isSymbolicLink() && Number.isInteger(entry.dev) && Number.isInteger(entry.ino) &&
      (process.platform === "win32" || (entry.mode & 0o222) === 0) ? { dev: entry.dev, ino: entry.ino } : null;
  } catch {
    return null;
  }
}

function directoryIdentityCurrent(fileSystem, directoryPath, expected) {
  const current = readOnlyDirectoryIdentity(fileSystem, directoryPath);
  return current && current.dev === expected.dev && current.ino === expected.ino;
}

function canonicalBytes(value) {
  return Buffer.from(canonicalJson(value), "utf8");
}

function jsonStringCharacterBytes(character) {
  if (character === "\"" || character === "\\") return 2;
  const code = character.codePointAt(0);
  if (code <= 0x1f) return [0x08, 0x09, 0x0a, 0x0c, 0x0d].includes(code) ? 2 : 6;
  return Buffer.byteLength(character, "utf8");
}

function splitCanonicalJson(value) {
  const source = canonicalJson(value);
  if (typeof source !== "string" || source.length === 0) return null;
  const chunks = [];
  let fragment = [];
  let encodedBytes = Buffer.byteLength('{"fragment":""}', "utf8");
  const flush = () => {
    if (fragment.length === 0) return;
    const bytes = canonicalBytes({ fragment: fragment.join("") });
    if (bytes.length > maximumReviewPackageChunkBytes) throw new Error("json-fragment-bound-exceeded");
    chunks.push(bytes);
    fragment = [];
    encodedBytes = Buffer.byteLength('{"fragment":""}', "utf8");
  };
  try {
    for (const character of source) {
      const additionalBytes = jsonStringCharacterBytes(character);
      if (encodedBytes + additionalBytes <= maximumReviewPackageChunkBytes) {
        fragment.push(character);
        encodedBytes += additionalBytes;
        continue;
      }
      flush();
      if (encodedBytes + additionalBytes > maximumReviewPackageChunkBytes) return null;
      fragment.push(character);
      encodedBytes += additionalBytes;
    }
    flush();
  } catch {
    return null;
  }
  return chunks;
}

function splitUtf8Patch(value) {
  if (typeof value !== "string") return null;
  const bytes = Buffer.from(value, "utf8");
  if (bytes.toString("utf8") !== value || bytes.length === 0) return null;
  const chunks = [];
  let offset = 0;
  while (offset < bytes.length) {
    let end = Math.min(offset + maximumReviewPackageChunkBytes, bytes.length);
    while (end < bytes.length && end > offset && (bytes[end] & 0xc0) === 0x80) end -= 1;
    if (end <= offset) return null;
    if (end < bytes.length) {
      const newline = bytes.lastIndexOf(0x0a, end - 1);
      if (newline >= offset) end = newline + 1;
    }
    chunks.push(Buffer.from(bytes.subarray(offset, end)));
    offset = end;
  }
  return chunks;
}

function packageChunks(reviewPackage) {
  const { diff, artifacts, validationEvidence, ...metadata } = reviewPackage;
  const metadataChunks = splitCanonicalJson(metadata);
  const artifactChunks = splitCanonicalJson(artifacts);
  const validationChunks = splitCanonicalJson(validationEvidence);
  const diffChunks = splitUtf8Patch(diff);
  if (!metadataChunks || !artifactChunks || !validationChunks || !diffChunks) return null;
  return [
    ...metadataChunks.map((bytes) => ({ section: "metadata", extension: "json", bytes })),
    ...artifactChunks.map((bytes) => ({ section: "artifacts", extension: "json", bytes })),
    ...validationChunks.map((bytes) => ({ section: "validation-evidence", extension: "json", bytes })),
    ...diffChunks.map((bytes) => ({ section: "diff", extension: "patch", bytes }))
  ];
}

function validChunkEntry(value, index) {
  if (!exactKeys(value, ["ordinal", "relativePath", "section", "byteCount", "sha256"]) ||
      value.ordinal !== index || !sections.includes(value.section) || !Number.isInteger(value.byteCount) ||
      value.byteCount <= 0 || value.byteCount > maximumReviewPackageChunkBytes || !digest(value.sha256)) return false;
  const extension = value.section === "diff" ? "patch" : "json";
  return value.relativePath === `chunks/${String(index).padStart(4, "0")}-${value.section}.${extension}`;
}

export function validateReviewPackageCapsuleIndex(value) {
  if (!exactKeys(value, ["schemaVersion", "representationRevision", "packageSchemaVersion", "baseCommit", "headCommit",
    "manifestDigest", "totalCanonicalBytes", "chunkCount", "chunks"]) || value.schemaVersion !== 1 ||
      value.representationRevision !== reviewPackageCapsuleRevision || value.packageSchemaVersion !== 1 ||
      !commit(value.baseCommit) || !commit(value.headCommit) || !digest(value.manifestDigest) ||
      !Number.isInteger(value.totalCanonicalBytes) || value.totalCanonicalBytes <= 0 ||
      value.totalCanonicalBytes > maximumReviewPackageCanonicalBytes || !Number.isInteger(value.chunkCount) ||
      value.chunkCount <= 0 || value.chunkCount > maximumReviewPackageChunks || !Array.isArray(value.chunks) ||
      value.chunks.length !== value.chunkCount || !value.chunks.every(validChunkEntry)) return false;
  const sectionOrder = value.chunks.map((chunk) => sections.indexOf(chunk.section));
  return sectionOrder[0] === 0 && sectionOrder.at(-1) === 3 &&
    sections.every((section) => value.chunks.some((chunk) => chunk.section === section)) &&
    sectionOrder.every((section, index) => index === 0 || section >= sectionOrder[index - 1]) &&
    new Set(value.chunks.map((chunk) => chunk.relativePath)).size === value.chunkCount;
}

function parseJsonChunk(bytes) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    return null;
  }
}

function reconstructJsonSection(bodies) {
  let source = "";
  for (const body of bodies) {
    const envelope = parseJsonChunk(body.bytes);
    if (!exactKeys(envelope, ["fragment"]) || typeof envelope.fragment !== "string" ||
        !body.bytes.equals(canonicalBytes(envelope))) return null;
    source += envelope.fragment;
  }
  try {
    const value = JSON.parse(source);
    return canonicalJson(value) === source ? value : null;
  } catch {
    return null;
  }
}

export function inspectReviewPackageCapsule(capsulePath, { fileSystem = fs } = {}) {
  if (typeof capsulePath !== "string" || !path.isAbsolute(capsulePath) || path.basename(capsulePath) !== reviewPackageCapsuleDirectoryName) {
    return unavailable("independent-review-package-capsule-directory-invalid");
  }
  const capsuleIdentity = readOnlyDirectoryIdentity(fileSystem, capsulePath);
  if (!capsuleIdentity) return unavailable("independent-review-package-capsule-directory-invalid");
  const chunksPath = path.join(capsulePath, "chunks");
  const chunksIdentity = readOnlyDirectoryIdentity(fileSystem, chunksPath);
  if (!chunksIdentity) return unavailable("independent-review-package-capsule-chunks-directory-invalid");
  const indexPath = path.join(capsulePath, reviewPackageCapsuleIndexName);
  const indexBytes = stableRegularFile(fileSystem, indexPath, maximumReviewPackageIndexBytes);
  if (!indexBytes) return unavailable("independent-review-package-capsule-index-invalid");
  let index;
  try { index = JSON.parse(indexBytes.toString("utf8")); } catch { return unavailable("independent-review-package-capsule-index-malformed"); }
  if (!validateReviewPackageCapsuleIndex(index) ||
      !indexBytes.equals(Buffer.from(`${canonicalJson(index)}\n`, "utf8"))) {
    return unavailable("independent-review-package-capsule-index-contract-invalid");
  }
  try {
    if (!directoryIdentityCurrent(fileSystem, capsulePath, capsuleIdentity) ||
        !directoryIdentityCurrent(fileSystem, chunksPath, chunksIdentity)) return unavailable("independent-review-package-capsule-directory-identity-mismatch");
    const rootEntries = fileSystem.readdirSync(capsulePath).sort();
    if (rootEntries.join("\0") !== [reviewPackageCapsuleIndexName, "chunks"].sort().join("\0")) {
      return unavailable("independent-review-package-capsule-extra-entry");
    }
    const expectedChunkNames = index.chunks.map((chunk) => path.basename(chunk.relativePath)).sort();
    const actualChunkNames = fileSystem.readdirSync(chunksPath).sort();
    if (actualChunkNames.join("\0") !== expectedChunkNames.join("\0")) return unavailable("independent-review-package-capsule-chunk-set-mismatch");
  } catch {
    return unavailable("independent-review-package-capsule-directory-unreadable");
  }
  const bodies = [];
  for (const chunk of index.chunks) {
    if (!directoryIdentityCurrent(fileSystem, capsulePath, capsuleIdentity) ||
        !directoryIdentityCurrent(fileSystem, chunksPath, chunksIdentity)) return unavailable("independent-review-package-capsule-directory-identity-mismatch");
    const bytes = stableRegularFile(fileSystem, path.join(capsulePath, chunk.relativePath), maximumReviewPackageChunkBytes);
    if (!bytes) return unavailable("independent-review-package-capsule-chunk-invalid");
    if (bytes.length !== chunk.byteCount || sha256(bytes) !== chunk.sha256) {
      return unavailable("independent-review-package-capsule-chunk-digest-mismatch");
    }
    bodies.push({ section: chunk.section, bytes });
  }
  const metadataBodies = bodies.filter((chunk) => chunk.section === "metadata");
  const artifactBodies = bodies.filter((chunk) => chunk.section === "artifacts");
  const validationBodies = bodies.filter((chunk) => chunk.section === "validation-evidence");
  const diffBodies = bodies.filter((chunk) => chunk.section === "diff");
  const metadata = reconstructJsonSection(metadataBodies);
  const artifacts = reconstructJsonSection(artifactBodies);
  const validationEvidence = reconstructJsonSection(validationBodies);
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata) ||
      !Array.isArray(artifacts) || !Array.isArray(validationEvidence)) {
    return unavailable("independent-review-package-capsule-json-chunk-invalid");
  }
  const diffBytes = Buffer.concat(diffBodies.map((chunk) => chunk.bytes));
  const diff = diffBytes.toString("utf8");
  if (Buffer.from(diff, "utf8").compare(diffBytes) !== 0) return unavailable("independent-review-package-capsule-diff-utf8-invalid");
  const reviewPackage = {
    ...metadata,
    diff,
    artifacts,
    validationEvidence
  };
  if (metadata.schemaVersion !== index.packageSchemaVersion || metadata.baseCommit !== index.baseCommit ||
      metadata.headCommit !== index.headCommit || metadata.manifestDigest !== index.manifestDigest) {
    return unavailable("independent-review-package-capsule-index-binding-mismatch");
  }
  const reconstructed = canonicalBytes(reviewPackage);
  if (reconstructed.length !== index.totalCanonicalBytes) return unavailable("independent-review-package-capsule-byte-count-mismatch");
  const validation = validateReviewPackage(reviewPackage);
  if (!validation.valid) return unavailable(validation.issues?.[0]?.code ?? "independent-review-package-capsule-package-invalid");
  if (!directoryIdentityCurrent(fileSystem, capsulePath, capsuleIdentity) ||
      !directoryIdentityCurrent(fileSystem, chunksPath, chunksIdentity)) return unavailable("independent-review-package-capsule-directory-identity-mismatch");
  return {
    available: true,
    code: "independent-review-package-capsule-valid",
    package: reviewPackage,
    index,
    indexPath,
    indexSha256: sha256(indexBytes),
    totalCanonicalBytes: reconstructed.length,
    chunkCount: index.chunkCount
  };
}

export function writeReviewPackageCapsule(reviewPath, reviewPackage, { fileSystem = fs } = {}) {
  if (typeof reviewPath !== "string" || !path.isAbsolute(reviewPath) || !validateReviewPackage(reviewPackage).valid) {
    return unavailable("independent-review-package-capsule-input-invalid");
  }
  try {
    const reviewDirectory = fileSystem.lstatSync(reviewPath);
    if (!reviewDirectory.isDirectory() || reviewDirectory.isSymbolicLink()) {
      return unavailable("independent-review-package-capsule-review-path-invalid");
    }
  } catch {
    return unavailable("independent-review-package-capsule-review-path-invalid");
  }
  const completeBytes = canonicalBytes(reviewPackage);
  if (completeBytes.length > maximumReviewPackageCanonicalBytes) return unavailable("independent-review-package-capsule-total-bound-exceeded");
  const chunks = packageChunks(reviewPackage);
  if (!chunks) return unavailable("independent-review-package-capsule-chunking-failed");
  if (chunks.length > maximumReviewPackageChunks) return unavailable("independent-review-package-capsule-chunk-count-exceeded");
  const capsulePath = path.join(reviewPath, reviewPackageCapsuleDirectoryName);
  const chunksPath = path.join(capsulePath, "chunks");
  try {
    if (!absent(fileSystem, path.join(reviewPath, legacyPackageName))) {
      return unavailable("independent-review-package-legacy-exposure-present");
    }
    fileSystem.mkdirSync(capsulePath, { mode: 0o700 });
    fileSystem.mkdirSync(chunksPath, { mode: 0o700 });
    const entries = chunks.map((chunk, ordinal) => {
      const relativePath = `chunks/${String(ordinal).padStart(4, "0")}-${chunk.section}.${chunk.extension}`;
      const chunkPath = path.join(capsulePath, relativePath);
      fileSystem.writeFileSync(chunkPath, chunk.bytes, { mode: 0o400, flag: "wx" });
      fileSystem.chmodSync(chunkPath, 0o400);
      return { ordinal, relativePath, section: chunk.section, byteCount: chunk.bytes.length, sha256: sha256(chunk.bytes) };
    });
    const index = {
      schemaVersion: 1,
      representationRevision: reviewPackageCapsuleRevision,
      packageSchemaVersion: reviewPackage.schemaVersion,
      baseCommit: reviewPackage.baseCommit,
      headCommit: reviewPackage.headCommit,
      manifestDigest: reviewPackage.manifestDigest,
      totalCanonicalBytes: completeBytes.length,
      chunkCount: entries.length,
      chunks: entries
    };
    const indexBytes = Buffer.from(`${canonicalJson(index)}\n`, "utf8");
    if (indexBytes.length > maximumReviewPackageIndexBytes) return unavailable("independent-review-package-capsule-index-bound-exceeded");
    const indexPath = path.join(capsulePath, reviewPackageCapsuleIndexName);
    fileSystem.writeFileSync(indexPath, indexBytes, { mode: 0o400, flag: "wx" });
    fileSystem.chmodSync(indexPath, 0o400);
    fileSystem.chmodSync(chunksPath, 0o500);
    fileSystem.chmodSync(capsulePath, 0o500);
  } catch (error) {
    return unavailable(error?.code === "EEXIST" ? "independent-review-package-capsule-destination-exists" : "independent-review-package-capsule-write-failed");
  }
  const inspected = inspectReviewPackageCapsule(capsulePath, { fileSystem });
  if (!inspected.available || canonicalJson(inspected.package) !== canonicalJson(reviewPackage)) {
    return unavailable(inspected.available ? "independent-review-package-capsule-reconstruction-mismatch" : inspected.code);
  }
  return { ...inspected, code: "independent-review-package-capsule-written" };
}
