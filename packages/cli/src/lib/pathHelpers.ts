import { homedir } from "os";
import { join } from "path";
import { existsSync, statSync } from "fs";

export function projectTemplatesDir(): string | null {
  let currentDir = process.cwd();
  while (currentDir !== "/") {
    const templatesPath = join(currentDir, "templates");
    if (existsSync(templatesPath) && statSync(templatesPath).isDirectory()) {
      return templatesPath;
    }
    currentDir = join(currentDir, "..");
  }
  return null;
}

export function userTemplatesDir(): string | null {
  const baseDir =
    process.env.APPDATA ||
    (process.platform === "darwin" ? join(homedir(), "Library", "Preferences") : join(homedir(), ".config"));
  const templatesPath = join(baseDir, "work-journal", "templates");
  // We don't check for existence here, the loader will handle it.
  return templatesPath;
}

export function packageTemplatesDir(): string {
  // Assuming this file is in packages/cli/src/lib
  // Adjust the relative path if the file structure changes
  try {
    // Use import.meta.url if available (ESM context)
    // @ts-ignore - Supress TS error for potential undefined import.meta
    const currentFilePath = new URL(import.meta.url).pathname;
    return join(currentFilePath, "..", "..", "templates");
  } catch (e) {
    // Fallback for CJS context
    // Needs to go up from lib -> src -> cli -> packages -> templates
    return join(__dirname, "..", "..", "..", "..", "templates");
  }
}
