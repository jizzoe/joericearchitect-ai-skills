#!/usr/bin/env node
import fs from "node:fs";
import { validateStandardsPack } from "./lib/standards-pack.mjs";
const result = validateStandardsPack(JSON.parse(fs.readFileSync(process.argv[2], "utf8")));
console.log(JSON.stringify(result, null, 2));
process.exit(result.valid ? 0 : 1);
