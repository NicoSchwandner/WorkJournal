import { join, dirname } from "path";
import { projectTemplatesDir, userTemplatesDir } from "./pathHelpers";

export interface ScopePaths {
  templates: string; // folder
  configFile: string; // single file
}

/** Pick project vs user locations. */
export function resolveScope(user: boolean): ScopePaths {
  // project root = folder that would hold ./templates or ./Templates
  const templatesDir = projectTemplatesDir();
  const projRoot = templatesDir ? dirname(templatesDir) : process.cwd();

  return {
    templates: user ? join(userTemplatesDir()!, "templates") : join(projRoot, "templates"), // Always normalize to lowercase for output paths
    configFile: user ? join(dirname(userTemplatesDir()!), "config.json") : join(projRoot, "work-journal.json"),
  };
}
