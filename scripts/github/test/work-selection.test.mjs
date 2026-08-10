import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { selectNextWork } from "../lib/dependencies.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../evals/workflows/openspec-github-lifecycle/dependency-selection/foundation-queue.json"), "utf8"));

test("foundation queue selects M6-C1 after M5-C2 completion", () => {
  const result = selectNextWork(fixture);
  assert.equal(result.selected, "M6-C1");
  assert.equal(result.reason, "ready-priority-sequence");
});

