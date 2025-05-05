import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { projectTemplatesDir, userTemplatesDir, packageTemplatesDir } from "./pathHelpers";

// Get template source directories, filtering out nulls (e.g., if projectTemplatesDir isn't found)
const sources = [projectTemplatesDir(), userTemplatesDir(), packageTemplatesDir()].filter(
  (dir): dir is string => dir !== null
);

export function loadTemplate(name: string): string {
  for (const dir of sources) {
    // Ensure the template name doesn't try to escape the directory
    if (name.includes("..") || name.startsWith("/")) {
      throw new Error(`Invalid template name: "${name}"`);
    }
    const templatePath = join(dir, name);
    if (existsSync(templatePath)) {
      return readFileSync(templatePath, "utf8");
    }
  }
  throw new Error(`Template "${name}" not found in any source: ${sources.join(", ")}`);
}
