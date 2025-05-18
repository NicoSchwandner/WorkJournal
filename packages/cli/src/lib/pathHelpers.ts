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
    const lowerCasePath = join(dir, "templates");
    const pascalCasePath = join(dir, "Templates");

    const lowerCaseExists = existsSync(lowerCasePath) && statSync(lowerCasePath).isDirectory();
    const pascalCaseExists = existsSync(pascalCasePath) && statSync(pascalCasePath).isDirectory();

    if (lowerCaseExists && pascalCaseExists) {
      const errorMsg =
        "ERR_DUPLICATE_TEMPLATES_DIR: Both 'templates/' and 'Templates/' exist. Please keep exactly one (lower-case is recommended).";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (lowerCaseExists) {
      return lowerCasePath;
    }

    if (pascalCaseExists) {
      console.warn("⚠️  Using non-canonical 'Templates/' folder – consider renaming to 'templates/'.");
      return pascalCasePath;
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
