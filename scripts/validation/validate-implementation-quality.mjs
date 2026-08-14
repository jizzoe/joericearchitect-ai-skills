#!/usr/bin/env node

import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { validateImplementationQualityResult } from "./lib/implementation-quality.mjs";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [filePath, reviewAuthorizationPath] = process.argv.slice(2);
  if (!filePath) {
    console.error("Usage: validate-implementation-quality.mjs <result.json> [production-review-authorization.json]");
    process.exit(2);
  }
  try {
    const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const productionReviewAuthorization = reviewAuthorizationPath
      ? JSON.parse(fs.readFileSync(reviewAuthorizationPath, "utf8"))
      : undefined;
    const result = validateImplementationQualityResult(value, { productionReviewAuthorization });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.valid ? 0 : 1);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
}
