import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { classifyWorkItems, selectNextWork } from "../../../../scripts/github/lib/dependencies.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const queue = JSON.parse(fs.readFileSync(path.join(__dirname, "foundation-queue.json"), "utf8"));

test("dependency selection eval reports status, blocked work, and next work", () => {
  const status = classifyWorkItems(queue);
  const next = selectNextWork(queue);
  assert.deepEqual(status.actionable, ["M6-C1"]);
  assert.equal(status.blocked[0].change, "M7-C1");
  assert.equal(next.selected, "M6-C1");
});

