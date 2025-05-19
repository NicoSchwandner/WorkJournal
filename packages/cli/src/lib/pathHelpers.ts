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
    // Check for lowercase "templates" (preferred)
    const templatesPath = join(dir, "templates");
    const isLowerExists = existsSync(templatesPath) && statSync(templatesPath).isDirectory();

    // Check for PascalCase "Templates" (supported with warning)
    const templatesUpperPath = join(dir, "Templates");
    const isUpperExists = existsSync(templatesUpperPath) && statSync(templatesUpperPath).isDirectory();

    // Handle various cases
    if (isLowerExists && isUpperExists) {
      // Both exist - error condition
      throw new Error(
        "ERR_DUPLICATE_TEMPLATES_DIR: Both 'templates/' and 'Templates/' exist. Please keep exactly one (lower-case is recommended)."
      );
    } else if (isLowerExists) {
      // Only lowercase exists (preferred)
      return templatesPath;
    } else if (isUpperExists) {
      // Only PascalCase exists (warn but accept)
      console.warn("⚠️  Using non-canonical 'Templates/' folder – consider renaming to 'templates/'.");
      return templatesUpperPath;
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
