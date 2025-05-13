import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { CommandModule } from "yargs";
import { userTemplatesDir } from "../lib/pathHelpers";

// Add a config spec (hard-coded allow-list)
export const CONFIG_SPEC = {
  holidayCutoffDay: "number", // day 1-31 in December
} as const;

type ConfigKey = keyof typeof CONFIG_SPEC;

const cfgFile = join(dirname(userTemplatesDir() || ""), "config.json");

const ensure = () => {
  if (!existsSync(cfgFile)) {
    mkdirSync(dirname(cfgFile), { recursive: true });
    writeFileSync(cfgFile, "{}");
  }
};

interface ConfigGetOptions {
  key?: string;
}

interface ConfigSetOptions {
  key: string;
  value: string;
}

// Exported for testing
export function runConfigGet(key?: string): any {
  ensure();
  const cfg = JSON.parse(readFileSync(cfgFile, "utf8"));

  if (!key) {
    return cfg; // Return all values if no key specified
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
  const entries = Object.entries(cfg);
  const matchingEntry = entries.find(([k]) => k.toLowerCase() === normalizedKey);

  return matchingEntry ? matchingEntry[1] : undefined;
}

// Exported for testing
export function runConfigSet(rawKey: string, rawVal: string): void {
  ensure();

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
    // Future numeric config options can add their own validation here
    // else if (key === "someOtherNumericKey") { ... }
  }

  const cfg = JSON.parse(readFileSync(cfgFile, "utf8"));

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
  writeFileSync(cfgFile, JSON.stringify(cfg, null, 2));
}

export const configGetCommand: CommandModule<{}, ConfigGetOptions> = {
  command: "get [key]",
  describe: "Read configuration value(s)",
  builder: (yargs) =>
    yargs.positional("key", {
      describe: "Configuration key to retrieve (omit to get all values)",
      type: "string",
    }),
  handler: (argv) => {
    const result = runConfigGet(argv.key);
    console.log(result);
  },
};

export const configSetCommand: CommandModule<{}, ConfigSetOptions> = {
  command: "set <key> <value>",
  describe: "Set configuration value",
  builder: (yargs) =>
    yargs
      .positional("key", {
        describe: "Configuration key to set",
        type: "string",
        demandOption: true,
      })
      .positional("value", {
        describe: "Value to set",
        type: "string",
        demandOption: true,
      }),
  handler: (argv) => {
    runConfigSet(argv.key, argv.value);
    console.log("✅ saved");
  },
};

export const configCommand: CommandModule = {
  command: "config",
  describe: "Manage configuration",
  builder: (yargs) =>
    yargs
      .command(configGetCommand)
      .command(configSetCommand)
      .demandCommand(1, "Please specify a subcommand: get or set"),
  handler: () => {},
};
