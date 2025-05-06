import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { CommandModule } from "yargs";
import { userTemplatesDir } from "../lib/pathHelpers";

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
  return key ? cfg[key] : cfg;
}

// Exported for testing
export function runConfigSet(key: string, value: string): void {
  ensure();
  const cfg = JSON.parse(readFileSync(cfgFile, "utf8"));
  cfg[key] = isNaN(+value) ? value : +value;
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
