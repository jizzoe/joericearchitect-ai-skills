import assert from "node:assert/strict";
import test from "node:test";

import {
  applyDeltaToLiving,
  buildOverlapGraph,
  detectRequirementConflict,
  exactRequirementText,
  parseDeltaRequirements,
  parseLivingRequirements,
  proveRepeatSyncNoOp
} from "../autonomous-sdd-sync-contract.mjs";
import {
  archiveDestinationName,
  isArchiveIdempotent,
  planArchiveDestination,
  validateArchiveContentPreservation,
  validateArchivePreconditions
} from "../autonomous-sdd-archive-contract.mjs";

const req = (id, operation, text) => ({ id, operation, text });

test("exactRequirementText normalizes CRLF and trims", () => {
  assert.equal(exactRequirementText("a\r\nb", "a\nb"), true);
  assert.equal(exactRequirementText("  a\n", "a"), true);
  assert.equal(exactRequirementText("a", "b"), false);
});

test("parseDeltaRequirements extracts operations and full text", () => {
  const md = [
    "## ADDED Requirements",
    "### Requirement: Alpha",
    "Description of Alpha.",
    "#### Scenario: A works",
    "- **WHEN** a",
    "- **THEN** b",
    "## MODIFIED Requirements",
    "### Requirement: Beta",
    "Replaced Beta."
  ].join("\n");
  const parsed = parseDeltaRequirements(md);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].id, "Alpha");
  assert.equal(parsed[0].operation, "ADDED");
  assert.match(parsed[0].text, /Description of Alpha/);
  assert.match(parsed[0].text, /Scenario: A works/);
  assert.equal(parsed[1].id, "Beta");
  assert.equal(parsed[1].operation, "MODIFIED");
});

test("parseLivingRequirements extracts requirement text", () => {
  const md = [
    "## Purpose",
    "irrelevant",
    "## Requirements",
    "### Requirement: Alpha",
    "Desc.",
    "#### Scenario: A",
    "- **WHEN** a",
    "- **THEN** b",
    "### Requirement: Beta",
    "Desc B."
  ].join("\n");
  const living = parseLivingRequirements(md);
  assert.deepEqual(Object.keys(living).sort(), ["Alpha", "Beta"]);
  assert.match(living.Alpha, /Scenario: A/);
});

test("applyDeltaToLiving applies ADDED/MODIFIED/REMOVED", () => {
  const delta = {
    capability: "demo",
    requirements: [
      req("Alpha", "ADDED", "new alpha"),
      req("Beta", "MODIFIED", "replaced beta"),
      req("Gamma", "REMOVED", "")
    ]
  };
  const result = applyDeltaToLiving({ delta, living: { requirements: { Beta: "old beta", Gamma: "gone" } } });
  assert.equal(result.ok, true);
  assert.equal(result.changed, true);
  assert.equal(result.livingAfter.requirements.Alpha, "new alpha");
  assert.equal(result.livingAfter.requirements.Beta, "replaced beta");
  assert.equal("Gamma" in result.livingAfter.requirements, false);
});

test("applyDeltaToLiving detects added-conflict, modified-missing, and dropped-scenario", () => {
  const addedConflict = applyDeltaToLiving({
    delta: { capability: "d", requirements: [req("Alpha", "ADDED", "new")] },
    living: { requirements: { Alpha: "existing" } }
  });
  assert.equal(addedConflict.ok, false);
  assert.equal(addedConflict.conflicts[0].reason, "added-requirement-conflicts-with-living");

  const modifiedMissing = applyDeltaToLiving({
    delta: { capability: "d", requirements: [req("Alpha", "MODIFIED", "new")] },
    living: { requirements: {} }
  });
  assert.equal(modifiedMissing.conflicts[0].reason, "modified-requirement-missing-in-living");

  const dropped = applyDeltaToLiving({
    delta: { capability: "d", requirements: [req("Alpha", "MODIFIED", "### Requirement: Alpha\n#### Scenario: New only\n- **WHEN** x\n- **THEN** y")] },
    living: { requirements: { Alpha: "### Requirement: Alpha\n#### Scenario: Old\n- **WHEN** a\n- **THEN** b\n#### Scenario: New only\n- **WHEN** x\n- **THEN** y" } }
  });
  assert.equal(dropped.conflicts[0].reason, "modified-requirement-drops-scenario");
  assert.deepEqual(dropped.conflicts[0].dropped, ["Old"]);
});

test("applyDeltaToLiving is a no-op when text already matches", () => {
  const delta = { capability: "d", requirements: [req("Alpha", "ADDED", "same text")] };
  const result = applyDeltaToLiving({ delta, living: { requirements: { Alpha: "same text" } } });
  assert.equal(result.ok, true);
  assert.equal(result.changed, false);
});

test("detectRequirementConflict only conflicts on the same id", () => {
  assert.equal(detectRequirementConflict({ left: { id: "A", operation: "MODIFIED" }, right: { id: "A", operation: "MODIFIED" } }).conflict, true);
  assert.equal(detectRequirementConflict({ left: { id: "A", operation: "ADDED" }, right: { id: "B", operation: "ADDED" } }).conflict, false);
});

test("buildOverlapGraph flags shared requirement and leaves disjoint capabilities alone", () => {
  const graph = buildOverlapGraph({
    activeChanges: [
      { change: "change-a", deltas: [{ capability: "shared", requirements: [req("R", "MODIFIED", "a")] }] },
      { change: "change-b", deltas: [{ capability: "shared", requirements: [req("R", "MODIFIED", "b")] }] },
      { change: "change-c", deltas: [{ capability: "other", requirements: [req("S", "ADDED", "s")] }] }
    ]
  });
  assert.equal(graph.hasConflicts, true);
  assert.equal(graph.conflicts.length, 1);
  assert.equal(graph.conflicts[0].capability, "shared");
  assert.equal(graph.conflicts[0].requirement, "R");
});

test("proveRepeatSyncNoOp passes after one apply", () => {
  const delta = { capability: "d", requirements: [req("Alpha", "ADDED", "text")] };
  assert.equal(proveRepeatSyncNoOp({ delta, living: { requirements: {} } }), true);
});

test("planArchiveDestination derives date-name and classifies archive/already-archived/conflict", () => {
  const plan = planArchiveDestination({ changeName: "foo-bar", date: "2026-08-25" });
  assert.equal(plan.action, "archive");
  assert.equal(plan.destination, "2026-08-25-foo-bar");
  assert.equal(planArchiveDestination({ changeName: "foo-bar", date: "2026-08-25", existingEntries: [{ name: "2026-08-25-foo-bar", change: "foo-bar" }] }).action, "already-archived");
  const conflict = planArchiveDestination({ changeName: "foo-bar", date: "2026-08-25", existingEntries: [{ name: "2026-08-25-foo-bar", change: "other" }] });
  assert.equal(conflict.ok, false);
  assert.equal(conflict.classification, "conflict");
  assert.equal(planArchiveDestination({ changeName: "Bad_Name", date: "2026-08-25" }).classification, "rejected");
});

test("archive content preservation requires the canonical bundle files", () => {
  assert.equal(validateArchiveContentPreservation({ archivedFiles: ["proposal.md", "design.md", "tasks.md", ".openspec.yaml"] }).valid, true);
  const missing = validateArchiveContentPreservation({ archivedFiles: ["proposal.md", "design.md"] });
  assert.equal(missing.valid, false);
  assert.deepEqual(missing.missing, ["tasks.md", ".openspec.yaml"]);
});

test("archive idempotency and preconditions", () => {
  assert.equal(isArchiveIdempotent({ destination: "2026-08-25-foo-bar", changeName: "foo-bar", existingEntries: [{ name: "2026-08-25-foo-bar", change: "foo-bar" }] }), true);
  assert.equal(isArchiveIdempotent({ destination: "2026-08-25-foo-bar", changeName: "foo-bar", existingEntries: [{ name: "2026-08-25-foo-bar", change: "other" }] }), false);
  assert.equal(validateArchivePreconditions({ implementationDelivered: true, syncDelivered: true, issueClosed: true, projectDone: true }).ready, true);
  const missing = validateArchivePreconditions({ implementationDelivered: true, syncDelivered: false, issueClosed: true, projectDone: true });
  assert.equal(missing.ready, false);
  assert.deepEqual(missing.missing, ["sync-delivered"]);
});

test("archiveDestinationName helper", () => {
  assert.equal(archiveDestinationName({ changeName: "foo", date: "2026-08-25" }), "2026-08-25-foo");
});
