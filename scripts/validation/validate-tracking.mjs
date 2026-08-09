#!/usr/bin/env node

import path from "node:path";
import { readTrackingFile } from "./lib/tracking.mjs";

function parseArgs(argv) {
  const args = { json: false, expectedChange: null, filePath: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") args.json = true;
    else if (arg === "--change") {
      args.expectedChange = argv[index + 1];
      index += 1;
    } else if (!args.filePath) {
      args.filePath = arg;
    } else {
      throw new Error(`unexpected argument: ${arg}`);
    }
  }
  return args;
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (!args.filePath) {
    throw new Error("usage: validate-tracking.mjs [--json] [--change <name>] <tracking.yaml>");
  }

  const expectedChange = args.expectedChange ?? path.basename(path.dirname(path.resolve(args.filePath)));
  const result = readTrackingFile(args.filePath, { expectedChange });
  const output = {
    valid: result.validation.valid,
    issues: result.validation.issues,
    normalized: result.normalized
  };

  if (args.json) {
    console.log(JSON.stringify(output, null, 2));
  } else if (output.valid) {
    console.log(`Tracking validation passed for ${result.normalized.openspec.change}`);
  } else {
    for (const issue of output.issues) {
      console.error(`${issue.path}: ${issue.message}${issue.expected ? `; expected ${issue.expected}` : ""}`);
    }
  }

  process.exit(output.valid ? 0 : 1);
} catch (error) {
  console.error(error.message);
  process.exit(2);
}
