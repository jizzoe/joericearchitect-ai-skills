import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";

const secret = /(?:password|secret|token|credential|api[_-]?key|private[_-]?key|gh[pousr]_[A-Za-z0-9]{20,}|Bearer\s+\S+)/i;
const relative = (value) => typeof value === "string" && value.length > 0 && !path.isAbsolute(value) && !value.split(/[\\/]/).includes("..");
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
export const runtimeConfigurationDigest = (value) => crypto.createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");

/** Resolve the only product-owned, non-secret runtime defaults admitted into a run. */
export function resolveRuntimeConfiguration({ sealed = {}, product = {} } = {}) {
  const runtime = product?.runtime;
  if (runtime === undefined) return { valid: true, snapshot: { schemaVersion: 1, sources: [], values: {} }, digest: runtimeConfigurationDigest({ schemaVersion: 1, sources: [], values: {} }) };
  const allowed = ["schemaVersion", "evidenceRoot", "claimProvider", "reviewAdapter"];
  if (!runtime || runtime.schemaVersion !== 1 || Object.keys(runtime).some((key) => !allowed.includes(key)) || JSON.stringify(runtime).match(secret)) return { valid: false, reason: "runtime-configuration-invalid" };
  if (runtime.evidenceRoot !== undefined && !relative(runtime.evidenceRoot)) return { valid: false, reason: "runtime-configuration-unsafe-path" };
  for (const key of ["claimProvider", "reviewAdapter"]) if (runtime[key] !== undefined && (typeof runtime[key] !== "string" || !/^[a-z0-9][a-z0-9-]*$/i.test(runtime[key]))) return { valid: false, reason: "runtime-configuration-invalid" };
  const values = { ...runtime }; delete values.schemaVersion;
  for (const [key, value] of Object.entries(values)) if (sealed[key] !== undefined && sealed[key] !== value) return { valid: false, reason: "runtime-configuration-authority-conflict" };
  const snapshot = { schemaVersion: 1, sources: ["config/ai-skills.json:runtime"], values: canonical(values) };
  return { valid: true, snapshot, digest: runtimeConfigurationDigest(snapshot) };
}

export function loadRuntimeConfiguration({ repositoryPath, sealed = {}, fileSystem = fs } = {}) {
  if (typeof repositoryPath !== "string" || !path.isAbsolute(repositoryPath)) return { valid: false, reason: "runtime-configuration-repository-invalid" };
  try {
    const configPath = path.join(repositoryPath, "config", "ai-skills.json");
    return resolveRuntimeConfiguration({ sealed, product: JSON.parse(fileSystem.readFileSync(configPath, "utf8")) });
  } catch { return { valid: false, reason: "runtime-configuration-unavailable" }; }
}
