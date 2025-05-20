import { homedir } from "os";
import { join, dirname, parse, relative } from "path";
import { existsSync, statSync, readdirSync } from "fs";
import { fileURLToPath } from "url";

let hasWarnedNonCanonical = false; // Module-level guard for warning

export class DuplicateTemplatesError extends Error {
  code = "ERR_DUPLICATE_TEMPLATES_DIR";
  constructor() {
    super(
      "ERR_DUPLICATE_TEMPLATES_DIR: Both 'templates/' and 'Templates/' exist. Please keep exactly one (lower-case is recommended)."
    );
    this.name = "DuplicateTemplatesError";
    Object.setPrototypeOf(this, DuplicateTemplatesError.prototype);
  }
}

/**
 * Finds the templates directory by walking up from the current working directory.
 *
 * Note: This function uses readdirSync which doesn't resolve symlinks. If a user
 * creates a symlink from Templates -> templates on a case-sensitive filesystem,
 * both names will be returned and trigger the duplicate error. This is intentional
 * as it prevents potential confusion about which directory is actually being used.
 */
export function projectTemplatesDir(): string | null {
  let dir = process.cwd();
  const root = parse(dir).root; // Gets "C:\", "D:\", or "/" depending on platform
  const startDir = dir; // Store for relative path in warning

  // Adding a safety counter to prevent infinite loops
  let depth = 0;
  const MAX_DEPTH = 50;

  while (true) {
    try {
      // Use withFileTypes to get proper Dirent objects
      const entries = readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

      // Use Set for O(1) lookups
      const entrySet = new Set(entries);
      const lowerCaseExists = entrySet.has("templates");
      const pascalCaseExists = entrySet.has("Templates");

      if (lowerCaseExists && pascalCaseExists) {
        throw new DuplicateTemplatesError();
      }

      if (lowerCaseExists) {
        return join(dir, "templates");
      }

      if (pascalCaseExists) {
        // Include relative path in warning for better context
        const relativePath = relative(startDir, dir);
        if (!hasWarnedNonCanonical) {
          console.warn(
            `⚠️  Using non-canonical 'Templates/' folder in ${relativePath} – consider renaming to 'templates/'.`
          );
          hasWarnedNonCanonical = true;
        }
        return join(dir, "Templates");
      }
    } catch (error) {
      // If we can't read the directory, just continue to the next one
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }

    // Break if we've reached the root or max depth (as a safety measure)
    if (dir === root || depth++ >= MAX_DEPTH) {
      if (depth >= MAX_DEPTH) {
        console.debug(`Reached max depth ${MAX_DEPTH} while searching for templates directory`);
      }
      break;
    }

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
  // 1. locate the nearest package.json
  let pkgJson: string;
  try {
    // First try to resolve package.json relative to __dirname
    pkgJson = require.resolve("../../package.json", { paths: [__dirname] });
  } catch (e) {
    try {
      // In ESM context, use import.meta.url if available
      // @ts-ignore - Suppress TS error for potential undefined import.meta
      const dirOfThisFile = dirname(fileURLToPath(import.meta.url)); // dist/lib
      return join(dirOfThisFile, "..", "..", "templates"); // dist/../.. = package root
    } catch (e) {
      // Final fallback: one level up from the compiled file to find templates directory
      return join(__dirname, "..", "templates");
    }
  }

  // Get the package root directory from the resolved package.json path
  const pkgRoot = dirname(pkgJson); // .../node_modules/work-journal
  return join(pkgRoot, "templates"); // .../node_modules/work-journal/templates
}
