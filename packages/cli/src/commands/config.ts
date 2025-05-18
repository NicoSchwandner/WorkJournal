import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname } from "path";
import { CommandModule } from "yargs";
import { runConfigGet, runConfigSet } from "../lib/config";
import { resolveScope } from "../lib/paths";

// Add a config spec (hard-coded allow-list)
export const CONFIG_SPEC = {
  holidayCutoffDay: "number", // day 1-31 in December
} as const;

interface ConfigGetOptions {
  key?: string;
}

interface ConfigSetOptions {
  key: string;
  value: string;
  user: boolean;
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
    const { merged, sources } = runConfigGet(argv.key);
    console.log(merged);
    if (sources.length > 0) {
      console.log("Loaded from:", sources.join(", "));
    }
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
      })
      .option("user", {
        type: "boolean",
        default: false,
        describe: "Save to user config instead of project config",
      }),
  handler: (argv) => {
    const { configFile } = resolveScope(argv.user);
    runConfigSet(configFile, argv.key, argv.value);
    console.log(`✅ saved (${argv.user ? "user" : "project"} scope)`);
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
