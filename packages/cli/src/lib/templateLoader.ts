import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { projectTemplatesDir, userTemplatesDir, packageTemplatesDir } from "./pathHelpers";

// Initialize sources array on-demand to catch any errors from projectTemplatesDir
function getTemplateSources(): string[] {
  try {
    // Try to get the project templates directory first
    const projectDir = projectTemplatesDir();

    // Get the rest of the template sources
    const allSources = [projectDir, userTemplatesDir(), packageTemplatesDir()].filter(
      (dir): dir is string => dir !== null
    );

    return allSources;
  } catch (error) {
    // Re-throw any errors from projectTemplatesDir
    throw error;
  }
}

export function loadTemplate(name: string): string {
  // Get the template sources, which may throw an error if there are duplicate template directories
  const sources = getTemplateSources();

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
