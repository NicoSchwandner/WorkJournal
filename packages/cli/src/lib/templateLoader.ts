import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { projectTemplatesDir, userTemplatesDir, packageTemplatesDir } from "./pathHelpers";

// Get template source directories, filtering out nulls (e.g., if projectTemplatesDir isn't found)
function getTemplateSources(): string[] {
  const sources: string[] = [];

  // Safely try to get project templates directory
  try {
    const projectDir = projectTemplatesDir();
    if (projectDir !== null) {
      sources.push(projectDir);
    }
  } catch (err: unknown) {
    // If there's an error getting project templates (like duplicate dirs),
    // just log warning and continue with other sources
    console.error(`Warning: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Add other directories as before
  const userDir = userTemplatesDir();
  if (userDir !== null) {
    sources.push(userDir);
  }

  sources.push(packageTemplatesDir());

  return sources;
}

// Initialize sources when the module is loaded
const sources = getTemplateSources();

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
