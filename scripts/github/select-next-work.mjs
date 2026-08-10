#!/usr/bin/env node

import fs from "node:fs";

import { selectNextWork } from "./lib/dependencies.mjs";

const args = process.argv.slice(2);
const inputIndex = args.indexOf("--input");
const explicitIndex = args.indexOf("--change");
if (inputIndex === -1) {
  console.error("--input is required");
  process.exit(2);
}
const items = JSON.parse(fs.readFileSync(args[inputIndex + 1], "utf8"));
const explicit = explicitIndex === -1 ? null : args[explicitIndex + 1];
console.log(JSON.stringify(selectNextWork(items, explicit), null, 2));

