#!/usr/bin/env node

import fs from "node:fs";
import { createOrFindIssue } from "./lib/issues.mjs";

function parseArgs(argv) {
  const args = { labels: [], dryRun: false, runtime: { permittedOperations: [] } };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo") args.repo = argv[++index];
    else if (arg === "--title") args.title = argv[++index];
    else if (arg === "--body-file") args.body = fs.readFileSync(argv[++index], "utf8");
    else if (arg === "--managed-block-file") args.managedBlock = fs.readFileSync(argv[++index], "utf8").replace(/\n$/, "");
    else if (arg === "--label") args.labels.push(argv[++index]);
    else if (arg === "--binding-file") args.intakeBinding = JSON.parse(fs.readFileSync(argv[++index], "utf8"));
    else if (arg === "--selected-entry") args.selectedEntry = argv[++index];
    else if (arg === "--runtime-permitted") args.runtime.permittedOperations.push("issue-create-or-update");
    else if (arg === "--now") args.now = argv[++index];
    else if (arg === "--dry-run") args.dryRun = true;
    else throw new Error(`unexpected argument: ${arg}`);
  }
  return args;
}

try {
  const args = parseArgs(process.argv.slice(2));
  const result = createOrFindIssue(args);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
} catch (error) {
  console.error(error.message);
  process.exit(2);
}
