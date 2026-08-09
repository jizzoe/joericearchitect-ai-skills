#!/usr/bin/env node

import fs from "node:fs";

import { planLifecycleTransition } from "./lib/lifecycle.mjs";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--config") args.config = JSON.parse(fs.readFileSync(argv[++index], "utf8"));
    else if (arg === "--tracking") args.tracking = JSON.parse(fs.readFileSync(argv[++index], "utf8"));
    else if (arg === "--observed-project") args.observedProject = JSON.parse(fs.readFileSync(argv[++index], "utf8"));
    else if (arg === "--current-status") args.currentStatus = argv[++index];
    else if (arg === "--event") args.event = argv[++index];
    else throw new Error(`unexpected argument: ${arg}`);
  }
  return args;
}

try {
  const args = parseArgs(process.argv.slice(2));
  const result = planLifecycleTransition(args);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
} catch (error) {
  console.error(error.message);
  process.exit(2);
}
