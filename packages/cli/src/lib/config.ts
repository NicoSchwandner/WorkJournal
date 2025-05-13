import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { userTemplatesDir } from "./pathHelpers";
import { CONFIG_SPEC } from "../commands/config";

type ConfigKey = keyof typeof CONFIG_SPEC;

const cfgFile = join(dirname(userTemplatesDir() || ""), "config.json");

export function getConfig(key: ConfigKey) {
  try {
    const config = existsSync(cfgFile) ? JSON.parse(readFileSync(cfgFile, "utf8")) : {};
    return config[key];
  } catch (error) {
    // Handle JSON parsing errors
    console.error("Error reading config:", error);
    return undefined;
  }
}
