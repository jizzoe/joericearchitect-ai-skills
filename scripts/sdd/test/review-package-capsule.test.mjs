import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { removeArchivedReviewView } from "../detached-review-view.mjs";
import { canonicalJson, packageDigest } from "../independent-review-contract.mjs";
import {
  inspectReviewPackageCapsule,
  maximumReviewPackageCanonicalBytes,
  maximumReviewPackageChunkBytes,
  reviewPackageCapsuleDirectoryName,
  writeReviewPackageCapsule
} from "../review-package-capsule.mjs";

function packageFixture(overrides = {}) {
  const draft = {
    schemaVersion: 1,
    baseCommit: "a".repeat(40),
    headCommit: "b".repeat(40),
    diff: "diff --git a/example.txt b/example.txt\n+reviewed\n",
    artifacts: [{ path: "example.txt", sha256: "c".repeat(64), bytes: 9 }],
    validationEvidence: ["focused tests passed"],
    ...overrides
  };
  delete draft.manifestDigest;
  return { ...draft, manifestDigest: packageDigest(draft) };
}

function withReviewPath(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "review-package-capsule-"));
  const reviewPath = path.join(root, "repository");
  fs.mkdirSync(reviewPath, { mode: 0o700 });
  try { return fn({ root, reviewPath }); } finally {
    const capsulePath = path.join(reviewPath, reviewPackageCapsuleDirectoryName);
    const chunksPath = path.join(capsulePath, "chunks");
    try { fs.chmodSync(capsulePath, 0o700); } catch { /* capsule may not exist */ }
    try { fs.chmodSync(chunksPath, 0o700); } catch { /* chunks may not exist */ }
    try {
      for (const name of fs.readdirSync(chunksPath)) fs.chmodSync(path.join(chunksPath, name), 0o600);
    } catch { /* chunks may not be readable */ }
    try { fs.chmodSync(path.join(capsulePath, "index.json"), 0o600); } catch { /* index may not exist */ }
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function capsuleFiles(capsulePath) {
  const index = fs.readFileSync(path.join(capsulePath, "index.json"));
  const chunks = fs.readdirSync(path.join(capsulePath, "chunks")).sort()
    .map((name) => [name, fs.readFileSync(path.join(capsulePath, "chunks", name))]);
  return { index, chunks };
}

function makeWritable(target) {
  fs.chmodSync(target, 0o700);
}

function rewriteIndex(capsulePath, index) {
  const indexPath = path.join(capsulePath, "index.json");
  makeWritable(indexPath);
  fs.writeFileSync(indexPath, `${canonicalJson(index)}\n`);
  if (process.platform !== "win32") fs.chmodSync(indexPath, 0o400);
}

test("capsule deterministically reconstructs the unchanged canonical package", () => {
  const reviewPackage = packageFixture();
  const first = withReviewPath(({ reviewPath }) => {
    const written = writeReviewPackageCapsule(reviewPath, reviewPackage);
    assert.equal(written.available, true, JSON.stringify(written));
    assert.deepEqual(written.package, reviewPackage);
    assert.equal(written.index.manifestDigest, reviewPackage.manifestDigest);
    assert.equal(written.index.totalCanonicalBytes, Buffer.byteLength(JSON.stringify(reviewPackage)));
    return capsuleFiles(path.join(reviewPath, reviewPackageCapsuleDirectoryName));
  });
  const second = withReviewPath(({ reviewPath }) => {
    const written = writeReviewPackageCapsule(reviewPath, reviewPackage);
    assert.equal(written.available, true, JSON.stringify(written));
    return capsuleFiles(path.join(reviewPath, reviewPackageCapsuleDirectoryName));
  });
  assert.deepEqual(first, second);
});

test("capsule chunks long lines and multibyte patch content by UTF-8 bytes", () => withReviewPath(({ reviewPath }) => {
  const diff = `diff --git a/large.txt b/large.txt\n+${"é".repeat(70_000)}\n`;
  const reviewPackage = packageFixture({ diff });
  const written = writeReviewPackageCapsule(reviewPath, reviewPackage);
  assert.equal(written.available, true, JSON.stringify(written));
  const diffEntries = written.index.chunks.filter((chunk) => chunk.section === "diff");
  assert.ok(diffEntries.length >= 3);
  assert.ok(diffEntries.every((chunk) => chunk.byteCount <= maximumReviewPackageChunkBytes));
  for (const chunk of written.index.chunks.filter((entry) => entry.section !== "diff")) {
    assert.doesNotThrow(() => JSON.parse(fs.readFileSync(path.join(reviewPath, reviewPackageCapsuleDirectoryName, chunk.relativePath), "utf8")));
  }
  assert.equal(written.package.diff, diff);
}));

test("capsule rejects the total canonical package bound before launch", () => withReviewPath(({ reviewPath }) => {
  const oversizedPackage = packageFixture({ diff: `diff --git a/a b/a\n+${"x".repeat(maximumReviewPackageCanonicalBytes)}\n` });
  assert.equal(writeReviewPackageCapsule(reviewPath, oversizedPackage).code, "independent-review-package-capsule-total-bound-exceeded");
  assert.equal(fs.existsSync(path.join(reviewPath, reviewPackageCapsuleDirectoryName)), false);
}));

test("capsule splits an individual large JSON value into valid bounded fragments", () => withReviewPath(({ reviewPath }) => {
  const evidence = `large validation evidence ${"v".repeat(100_000)}`;
  const reviewPackage = packageFixture({ validationEvidence: [evidence] });
  const written = writeReviewPackageCapsule(reviewPath, reviewPackage);
  assert.equal(written.available, true, JSON.stringify(written));
  const entries = written.index.chunks.filter((chunk) => chunk.section === "validation-evidence");
  assert.ok(entries.length > 1);
  assert.ok(entries.every((entry) => entry.byteCount <= maximumReviewPackageChunkBytes));
  assert.deepEqual(written.package.validationEvidence, [evidence]);
}));

test("capsule rejects legacy or pre-existing exposure paths without following them", (t) => withReviewPath(({ root, reviewPath }) => {
  const outside = path.join(root, "outside-canary");
  fs.writeFileSync(outside, "canary");
  try { fs.symlinkSync(outside, path.join(reviewPath, ".ai-independent-review-package.json")); } catch (error) {
    if (["EPERM", "EACCES"].includes(error?.code)) return t.skip("filesystem does not permit symlink fixtures");
    throw error;
  }
  assert.equal(writeReviewPackageCapsule(reviewPath, packageFixture()).code, "independent-review-package-legacy-exposure-present");
  assert.equal(fs.readFileSync(outside, "utf8"), "canary");
}));

test("archive-view cleanup removes an owned read-only capsule after marker verification", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ai-skills-review-archive-"));
  const launchPath = path.join(temporaryRoot, "review-session");
  const reviewPath = path.join(launchPath, "repository");
  const view = {
    kind: "archived-review-view-v1",
    repository: "/fixture/repository",
    launchPath,
    reviewPath,
    temporaryRoot,
    headCommit: "b".repeat(40),
    ownershipToken: "capsule-cleanup-fixture",
    createdAt: "2026-08-27T00:00:00.000Z"
  };
  fs.mkdirSync(reviewPath, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(temporaryRoot, ".ai-skills-review-view.json"), `${JSON.stringify(view)}\n`, { mode: 0o600 });
  const written = writeReviewPackageCapsule(reviewPath, packageFixture());
  assert.equal(written.available, true, JSON.stringify(written));
  assert.equal(removeArchivedReviewView(view).removed, true);
  assert.equal(fs.existsSync(temporaryRoot), false);
});

test("capsule inspection rejects a changed owned directory identity", () => withReviewPath(({ reviewPath }) => {
  const written = writeReviewPackageCapsule(reviewPath, packageFixture());
  assert.equal(written.available, true, JSON.stringify(written));
  const capsulePath = path.join(reviewPath, reviewPackageCapsuleDirectoryName);
  const chunksPath = path.join(capsulePath, "chunks");
  const fileSystem = Object.create(fs);
  let chunkDirectoryReads = 0;
  fileSystem.lstatSync = (subject) => {
    const entry = fs.lstatSync(subject);
    if (subject !== chunksPath || ++chunkDirectoryReads === 1) return entry;
    return new Proxy(entry, { get: (target, property) => property === "dev" ? target.dev + 1 : Reflect.get(target, property) });
  };
  const inspected = inspectReviewPackageCapsule(capsulePath, { fileSystem });
  assert.equal(inspected.code, "independent-review-package-capsule-directory-identity-mismatch");
}));

test("capsule inspection rejects missing, extra, duplicate, reordered, changed, oversized, non-regular, and symlinked chunks", (t) => {
  const scenarios = [
    ["missing", ({ capsulePath, index }) => {
      makeWritable(path.join(capsulePath, "chunks"));
      fs.unlinkSync(path.join(capsulePath, index.chunks[0].relativePath));
    }],
    ["extra", ({ capsulePath }) => {
      const chunksPath = path.join(capsulePath, "chunks");
      makeWritable(chunksPath);
      fs.writeFileSync(path.join(chunksPath, "unindexed.json"), "{}", { mode: 0o400 });
      if (process.platform !== "win32") fs.chmodSync(chunksPath, 0o500);
    }],
    ["reordered", ({ capsulePath, index }) => {
      [index.chunks[1], index.chunks[2]] = [index.chunks[2], index.chunks[1]];
      rewriteIndex(capsulePath, index);
    }],
    ["duplicate", ({ capsulePath, index }) => {
      index.chunks[1].relativePath = index.chunks[0].relativePath;
      rewriteIndex(capsulePath, index);
    }],
    ["changed", ({ capsulePath, index }) => {
      const chunkPath = path.join(capsulePath, index.chunks.at(-1).relativePath);
      makeWritable(chunkPath);
      fs.appendFileSync(chunkPath, "changed");
      if (process.platform !== "win32") fs.chmodSync(chunkPath, 0o400);
    }],
    ["oversized", ({ capsulePath, index }) => {
      const chunkPath = path.join(capsulePath, index.chunks.at(-1).relativePath);
      makeWritable(chunkPath);
      fs.appendFileSync(chunkPath, Buffer.alloc(maximumReviewPackageChunkBytes + 1, 0x78));
      if (process.platform !== "win32") fs.chmodSync(chunkPath, 0o400);
    }],
    ["nonregular", ({ capsulePath, index }) => {
      const chunksPath = path.join(capsulePath, "chunks");
      const chunkPath = path.join(capsulePath, index.chunks[0].relativePath);
      makeWritable(chunksPath);
      fs.unlinkSync(chunkPath);
      fs.mkdirSync(chunkPath, { mode: 0o500 });
      if (process.platform !== "win32") fs.chmodSync(chunksPath, 0o500);
    }],
    ["symlinked", ({ root, capsulePath, index }) => {
      const chunksPath = path.join(capsulePath, "chunks");
      const chunkPath = path.join(capsulePath, index.chunks[0].relativePath);
      const outside = path.join(root, "outside.json");
      fs.writeFileSync(outside, "{}");
      makeWritable(chunksPath);
      fs.unlinkSync(chunkPath);
      try { fs.symlinkSync(outside, chunkPath); } catch (error) {
        if (["EPERM", "EACCES"].includes(error?.code)) return false;
        throw error;
      }
      if (process.platform !== "win32") fs.chmodSync(chunksPath, 0o500);
      return true;
    }]
  ];
  for (const [name, mutate] of scenarios) {
    withReviewPath(({ root, reviewPath }) => {
      const written = writeReviewPackageCapsule(reviewPath, packageFixture());
      assert.equal(written.available, true, `${name}: ${JSON.stringify(written)}`);
      const capsulePath = path.join(reviewPath, reviewPackageCapsuleDirectoryName);
      if (mutate({ root, capsulePath, index: structuredClone(written.index) }) === false) return t.skip("filesystem does not permit symlink fixtures");
      const inspected = inspectReviewPackageCapsule(capsulePath);
      assert.equal(inspected.available, false, `${name}: ${JSON.stringify(inspected)}`);
    });
  }
});
