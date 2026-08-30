import fs from "node:fs";
import path from "node:path";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const ADAPTERS = new Set(["codex-detached-read-only-v1", "claude-detached-restricted-v1"]);
const ASSURANCE_LEVELS = new Set(["strict-isolated", "authorized-degraded"]);
const TRANSPORTS = new Set(["parent-capture", "subprocess"]);
const CONFIG_KEYS = new Set(["schemaVersion", "providers"]);
const PROVIDER_KEYS = new Set(["name", "adapter", "executable", "assurance", "transport"]);
const exactKeys = (value, expected) => {
  const keys = Object.keys(value);
  return keys.length === expected.size && keys.every((key) => expected.has(key));
};

/** Validate a reviewer-providers registry. Read-only and side-effect free. */
export function validateReviewerProvidersConfig(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { valid: false, reason: "reviewer-providers-config-invalid" };
  if (!exactKeys(value, CONFIG_KEYS) || value.schemaVersion !== 1 || !Array.isArray(value.providers) || value.providers.length === 0) return { valid: false, reason: "reviewer-providers-config-invalid" };
  const seen = new Set();
  const providers = [];
  for (const provider of value.providers) {
    if (!provider || typeof provider !== "object" || Array.isArray(provider) ||
        !exactKeys(provider, PROVIDER_KEYS) ||
        !text(provider.name) || !ADAPTERS.has(provider.adapter) || !text(provider.executable) ||
        !ASSURANCE_LEVELS.has(provider.assurance) || !TRANSPORTS.has(provider.transport)) {
      return { valid: false, reason: "reviewer-providers-entry-invalid" };
    }
    if (seen.has(provider.name)) return { valid: false, reason: "reviewer-providers-duplicate-name" };
    seen.add(provider.name);
    providers.push({
      name: provider.name,
      adapter: provider.adapter,
      executable: provider.executable,
      assurance: provider.assurance,
      transport: provider.transport
    });
  }
  return { valid: true, providers };
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

/** Resolve one reviewer provider by name only after validating the registry. */
export function resolveReviewerProvider(config, name) {
  if (!text(name)) return null;
  const validation = validateReviewerProvidersConfig(config);
  if (!validation.valid) return null;
  return validation.providers.find((provider) => provider.name === name) ?? null;
}

/** Default registry location for a repository (config/reviewer-providers.json). */
export function defaultReviewerProvidersPath(repositoryPath) {
  return text(repositoryPath) ? path.join(repositoryPath, "config", "reviewer-providers.json") : null;
}
