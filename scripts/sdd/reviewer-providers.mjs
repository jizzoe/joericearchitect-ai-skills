import fs from "node:fs";
import path from "node:path";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const ADAPTERS = new Set(["codex-detached-read-only-v1", "claude-detached-restricted-v1"]);
const ASSURANCE_LEVELS = new Set(["strict-isolated", "authorized-degraded"]);
const TRANSPORTS = new Set(["parent-capture", "subprocess"]);

/** Validate a reviewer-providers registry. Read-only and side-effect free. */
export function validateReviewerProvidersConfig(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { valid: false, reason: "reviewer-providers-config-invalid" };
  if (value.schemaVersion !== 1 || !Array.isArray(value.providers) || value.providers.length === 0) return { valid: false, reason: "reviewer-providers-config-invalid" };
  const seen = new Set();
  for (const provider of value.providers) {
    if (!provider || typeof provider !== "object" || Array.isArray(provider) ||
        !text(provider.name) || !ADAPTERS.has(provider.adapter) || !text(provider.executable) ||
        !ASSURANCE_LEVELS.has(provider.assurance) || !TRANSPORTS.has(provider.transport)) {
      return { valid: false, reason: "reviewer-providers-entry-invalid" };
    }
    if (seen.has(provider.name)) return { valid: false, reason: "reviewer-providers-duplicate-name" };
    seen.add(provider.name);
  }
  return { valid: true, providers: value.providers };
}

/** Load and validate the registry from a JSON file. */
export function loadReviewerProviders(configPath, { fileSystem = fs } = {}) {
  if (!text(configPath)) return { valid: false, reason: "reviewer-providers-config-path-invalid" };
  let parsed;
  try {
    parsed = JSON.parse(fileSystem.readFileSync(configPath, "utf8"));
  } catch {
    return { valid: false, reason: "reviewer-providers-config-unreadable" };
  }
  const validation = validateReviewerProvidersConfig(parsed);
  return validation.valid ? validation : { valid: false, reason: validation.reason };
}

/** Resolve one reviewer provider by name from a registry (array or wrapped object). */
export function resolveReviewerProvider(config, name) {
  if (!config || typeof config !== "object" || !text(name)) return null;
  const providers = Array.isArray(config) ? config : Array.isArray(config.providers) ? config.providers : null;
  if (!providers) return null;
  return providers.find((provider) => provider?.name === name) ?? null;
}

/** Default registry location for a repository (config/reviewer-providers.json). */
export function defaultReviewerProvidersPath(repositoryPath) {
  return text(repositoryPath) ? path.join(repositoryPath, "config", "reviewer-providers.json") : null;
}
