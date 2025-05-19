import { join, dirname } from "path";
import { projectTemplatesDir, userTemplatesDir } from "./pathHelpers";

export interface ScopePaths {
  templates: string; // folder
  configFile: string; // single file
}

/** Pick project vs user locations. */
export function resolveScope(user: boolean): ScopePaths {
  // project root = folder that would hold ./templates
  let projRoot = process.cwd();

  try {
    const templatesDir = projectTemplatesDir();
    projRoot = templatesDir?.replace(/[\/\\]templates$/, "") || process.cwd();
    if (templatesDir?.includes("Templates")) {
      projRoot = templatesDir?.replace(/[\/\\]Templates$/, "") || process.cwd();
    }
  } catch (error) {
    // If projectTemplatesDir throws because of duplicate directories,
    // we'll use the current working directory as fallback
    console.error(error instanceof Error ? error.message : String(error));
  }

  return {
    templates: user ? join(userTemplatesDir()!, "templates") : join(projRoot, "templates"),
    configFile: user ? join(dirname(userTemplatesDir()!), "config.json") : join(projRoot, "work-journal.json"),
  };
}
