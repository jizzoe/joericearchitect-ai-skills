import assert from "node:assert/strict";
import test from "node:test";

import { classifyWorkItems, findDependencyCycles, hasDependencyPath, nextIncompleteTask, selectNextWork } from "../lib/dependencies.mjs";

const items = [
  { change: "M5-C2", status: "Done", sequence: 502, priority: "P2" },
  { change: "M6-C1", status: "Ready", sequence: 601, priority: "P2", blockedBy: ["M5-C2"], sharedFiles: ["scripts/github/lib/dependencies.mjs"] },
  { change: "M7-C1", status: "Ready", sequence: 701, priority: "P1", blockedBy: ["M6-C1"], sharedFiles: ["evals/foundation.json"] },
  { change: "M8-C1", status: "Ready", sequence: 801, priority: "P0", blockedBy: ["UNKNOWN"] }
];

test("dependency cycles include the complete cycle path", () => {
  const cycles = findDependencyCycles([
    { change: "A", blockedBy: ["B"] },
    { change: "B", blockedBy: ["C"] },
    { change: "C", blockedBy: ["A"] }
  ]);
  assert.deepEqual(cycles[0], ["A", "B", "C", "A"]);
});

test("dependency path is detected across transitive blockers", () => {
  assert.equal(hasDependencyPath(items, "M7-C1", "M5-C2"), true);
  assert.equal(hasDependencyPath(items, "M6-C1", "M7-C1"), false);
});

test("blocked work is excluded and reports unresolved blockers", () => {
  const result = classifyWorkItems(items);
  assert.deepEqual(result.actionable, ["M6-C1"]);
  assert.equal(result.blocked.find((item) => item.change === "M7-C1").reasons[0].dependency, "M6-C1");
  assert.equal(result.blocked.find((item) => item.change === "M8-C1").reasons[0].type, "unresolved-dependency");
});

test("next work prefers actionable work over blocked priority", () => {
  const result = selectNextWork(items);
  assert.equal(result.ok, true);
  assert.equal(result.selected, "M6-C1");
});

test("parallel candidates require no dependency path or shared conflict", () => {
  const result = classifyWorkItems([
    { change: "A", status: "Ready", sequence: 1, sharedFiles: ["a.md"] },
    { change: "B", status: "Ready", sequence: 2, sharedFiles: ["b.md"] },
    { change: "C", status: "Ready", sequence: 3, sharedFiles: ["a.md"] }
  ]);
  assert.deepEqual(result.parallelCandidates, [["A", "B"], ["B", "C"]]);
});

test("explicit switch reports selected change without relying on recency", () => {
  const result = selectNextWork(items, "M7-C1");
  assert.equal(result.ok, true);
  assert.equal(result.selected, "M7-C1");
  assert.equal(result.reason, "explicit-selection");
});

test("next incomplete task is parsed from stable task IDs", () => {
  const result = nextIncompleteTask("- [x] 1.1 Done\n- [ ] 2.1 Implement work selection.\n");
  assert.deepEqual(result, { id: "2.1", title: "Implement work selection." });
});

