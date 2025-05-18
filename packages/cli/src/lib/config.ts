import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname } from "path";
import { CONFIG_SPEC } from "../commands/config";
import { resolveScope } from "./paths";

type ConfigKey = keyof typeof CONFIG_SPEC;

/* -------------------------------------------------------------
 * Helpers
 * ----------------------------------------------------------- */
/** Identifier used in `sources` array when overrides came from the environment. */
const ENV_SOURCE = "ENV" as const;

/** Validate + convert a raw string coming from CLI / env into its final type. */
function validateAndConvertConfigValue(key: ConfigKey, raw: string): unknown {
  // Re-use the strong validation that already lives in runConfigSet
  runConfigSet("__env__", key, raw, true /* skipWrite */);
  return CONFIG_SPEC[key] === "number" ? +raw : raw;
}

export function getConfig(key: ConfigKey) {
  const { merged } = runConfigGet(key);
  return merged;
}

function ensure(configPath: string) {
  if (!existsSync(configPath)) {
    mkdirSync(dirname(configPath), { recursive: true });
    writeFileSync(configPath, "{}");
  }
}

// Read config from a specific file
function readConfigFile(path: string): any {
  if (existsSync(path)) {
    try {
      return JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      console.error(`Error reading config from ${path}:`, error);
      return {};
    }
  }
  return {};
}

/* -------------------------------------------------------------
 * Environment-variable overrides  (WORK_JOURNAL_FOO_BAR=…)
 * ----------------------------------------------------------- */
function loadEnvOverrides(): Record<string, unknown> {
  const overrides: Record<string, unknown> = {};
  // filter out non-public keys that might be injected in tests (e.g. __TEST_BYPASS_VALIDATION)
  const cfgKeys = Object.keys(CONFIG_SPEC).filter((k) => !k.startsWith("__")) as ConfigKey[];

  for (const key of cfgKeys) {
    const envKey = `WORK_JOURNAL_${key.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase()}`;
    const raw = process.env[envKey];
    if (raw === undefined) continue;

    try {
      overrides[key] = validateAndConvertConfigValue(key, raw);
    } catch (e: any) {
      throw new Error(`${envKey}: ${e.message}`);
    }
  }
  return overrides;
}

// Exported for testing
export function runConfigGet(key?: string): { merged: any; sources: string[] } {
  const sources: string[] = [];

  // Get config file paths
  const userConfig = resolveScope(true).configFile;
  const projectConfig = resolveScope(false).configFile;

  // Read from both sources
  const userCfg = readConfigFile(userConfig);
  const projectCfg = readConfigFile(projectConfig);

  // Record which files were actually found and used
  if (existsSync(userConfig)) sources.push(userConfig);
  if (existsSync(projectConfig)) sources.push(projectConfig);

  // Load environment variable overrides
  const envCfg = loadEnvOverrides();
  if (Object.keys(envCfg).length > 0) sources.push(ENV_SOURCE);

  // Shallow merge, with env taking precedence over project, which takes precedence over user
  const merged = { ...userCfg, ...projectCfg, ...envCfg };

  if (!key) {
    return { merged, sources }; // Return all values if no key specified
  }

  // Check if the key is in the allow-list (unless in test mode)
  if (
    !(key in CONFIG_SPEC) &&
    // @ts-ignore - Special property for tests
    !CONFIG_SPEC.__TEST_BYPASS_VALIDATION
  ) {
    throw new Error(`Unknown config key "${key}". Allowed: ${Object.keys(CONFIG_SPEC).join(", ")}`);
  }

  // Case-insensitive search
  const normalizedKey = key.toLowerCase();
  const entries = Object.entries(merged);
  const matchingEntry = entries.find(([k]) => k.toLowerCase() === normalizedKey);

  return {
    merged: matchingEntry ? matchingEntry[1] : undefined,
    sources,
  };
}

// Exported for testing
export function runConfigSet(cfgPath: string, rawKey: string, rawVal: string, skipWrite = false): void {
  if (!skipWrite) {
    ensure(cfgPath);
  }

  // Validate key against allow-list (unless in test mode)
  const key = rawKey as ConfigKey;
  if (
    !(key in CONFIG_SPEC) &&
    // @ts-ignore - Special property for tests
    !CONFIG_SPEC.__TEST_BYPASS_VALIDATION
  ) {
    throw new Error(`Unknown config key "${rawKey}". Allowed: ${Object.keys(CONFIG_SPEC).join(", ")}`);
  }

  // For numeric values, validate they're within range (only for real config keys)
  const val = Number(rawVal);
  if (CONFIG_SPEC[key] === "number") {
    // Key-specific validation
    if (key === "holidayCutoffDay") {
      if (isNaN(val) || val < 1 || val > 31) {
        throw new Error("holidayCutoffDay must be an integer between 1 and 31");
      }
    }
    // More generic handling for other numeric keys that may be added in the future
    else if (isNaN(val)) {
      throw new Error(`${key} must be a valid number`);
    }
  }

  if (skipWrite) return;

  const cfg = readConfigFile(cfgPath);

  // Case-insensitive update: first remove any existing key variations
  const normalizedKey = key.toLowerCase();
  const existingKeys = Object.keys(cfg);

  for (const existingKey of existingKeys) {
    if (existingKey.toLowerCase() === normalizedKey) {
      delete cfg[existingKey];
    }
  }

  // Store with the original key case the user provided and proper type conversion
  // Only apply type conversion for real config keys
  cfg[key] = CONFIG_SPEC[key] === "number" ? val : isNaN(+rawVal) ? rawVal : +rawVal;
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
}
