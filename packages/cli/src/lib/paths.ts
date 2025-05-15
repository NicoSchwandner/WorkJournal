import { join, dirname } from "path";
import { projectTemplatesDir, userTemplatesDir } from "./pathHelpers";

export interface ScopePaths {
  templates: string;   // folder
  configFile: string;  // single file
}

/** Pick project vs user locations. */
export function resolveScope(user: boolean): ScopePaths {
  // project root = folder that would hold ./templates
  const projRoot = (projectTemplatesDir()?.replace(/[\/\\]templates$/, "")) || process.cwd();

  return {
    templates: user
      ? join(userTemplatesDir()!, "templates")
      : join(projRoot, "templates"),
    configFile: user
      ? join(dirname(userTemplatesDir()!), "config.json")
      : join(projRoot, "work-journal.json"),
  };
} 