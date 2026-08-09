#!/usr/bin/env node

import fs from "node:fs";
import { replaceManagedBlock } from "./lib/issues.mjs";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--body-file") args.body = fs.readFileSync(argv[++index], "utf8");
    else if (arg === "--block-file") args.block = fs.readFileSync(argv[++index], "utf8").trimEnd();
    else if (arg === "--start") args.start = argv[++index];
    else if (arg === "--end") args.end = argv[++index];
    else throw new Error(`unexpected argument: ${arg}`);
  }
  return args;
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (!args.body || !args.block || !args.start || !args.end) throw new Error("body, block, start, and end are required");
  console.log(replaceManagedBlock(args.body, args.block, { start: args.start, end: args.end }));
} catch (error) {
  console.error(error.message);
  process.exit(2);
}
