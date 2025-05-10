import { homedir } from "os";
import { join, dirname, parse } from "path";
import { existsSync, statSync } from "fs";
import { fileURLToPath } from "url";

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
  try {
    // Use import.meta.url if available (ESM context)
    // @ts-ignore - Supress TS error for potential undefined import.meta
    const dirOfThisFile = dirname(fileURLToPath(import.meta.url)); // dist/lib
    return join(dirOfThisFile, "..", "..", "templates"); // dist/../.. = package root
  } catch (e) {
    // Fallback for CJS context
    return join(__dirname, "..", "..", "templates");
  }
}
