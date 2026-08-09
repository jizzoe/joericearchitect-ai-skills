#!/usr/bin/env node

import fs from "node:fs";

import { auditLifecycle, repairLifecycle } from "./lib/lifecycle.mjs";

function parseArgs(argv) {
  const args = { repair: false, authorized: false, dryRun: true };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--config") args.config = JSON.parse(fs.readFileSync(argv[++index], "utf8"));
    else if (arg === "--tracking") args.tracking = JSON.parse(fs.readFileSync(argv[++index], "utf8"));
    else if (arg === "--observed-issue") args.observedIssue = JSON.parse(fs.readFileSync(argv[++index], "utf8"));
    else if (arg === "--observed-project") args.observedProject = JSON.parse(fs.readFileSync(argv[++index], "utf8"));
    else if (arg === "--event") args.event = argv[++index];
    else if (arg === "--repair") args.repair = true;
    else if (arg === "--authorized") args.authorized = true;
    else throw new Error(`unexpected argument: ${arg}`);
  }
  return args;
}

try {
  const args = parseArgs(process.argv.slice(2));
  const result = args.repair ? repairLifecycle(args) : auditLifecycle(args);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
} catch (error) {
  console.error(error.message);
  process.exit(2);
}
