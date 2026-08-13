#!/usr/bin/env node

import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { validateImplementationQualityResult } from "./lib/implementation-quality.mjs";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [filePath] = process.argv.slice(2);
  if (!filePath) {
    console.error("Usage: validate-implementation-quality.mjs <result.json>");
    process.exit(2);
  }
  try {
    const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const result = validateImplementationQualityResult(value);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.valid ? 0 : 1);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
}
