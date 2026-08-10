#!/usr/bin/env node

import fs from "node:fs";

import { classifyWorkItems } from "./lib/dependencies.mjs";

const inputIndex = process.argv.indexOf("--input");
if (inputIndex === -1) {
  console.error("--input is required");
  process.exit(2);
}
const items = JSON.parse(fs.readFileSync(process.argv[inputIndex + 1], "utf8"));
console.log(JSON.stringify(classifyWorkItems(items), null, 2));

