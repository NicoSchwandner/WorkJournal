import { homedir } from "os";
import { join, dirname, parse } from "path";
import { existsSync, statSync } from "fs";

export function projectTemplatesDir(): string | null {
  let dir = process.cwd();
  const root = parse(dir).root; // Gets "C:\", "D:\", or "/" depending on platform

  // Adding a safety counter to prevent infinite loops
  let depth = 0;
  const MAX_DEPTH = 50;

  while (true) {
    const templatesPath = join(dir, "templates");
    if (existsSync(templatesPath) && statSync(templatesPath).isDirectory()) {
      return templatesPath;
    }

    // Break if we've reached the root or max depth (as a safety measure)
    if (dir === root || depth++ >= MAX_DEPTH) break;

    // Use dirname instead of manual join with ".." for better cross-platform support
    dir = dirname(dir);
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
