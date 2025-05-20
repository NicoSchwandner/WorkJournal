import { join, dirname } from "path";
import { projectTemplatesDir, userTemplatesDir } from "./pathHelpers";

export interface ScopePaths {
  templates: string; // folder
  configFile: string; // single file
}

/** Pick project vs user locations. */
export function resolveScope(user: boolean): ScopePaths {
  // project root = parent directory of the templates folder
  const projTemplates = projectTemplatesDir(); // e.g. /path/DevJournal/Templates
  const projRoot = projTemplates
    ? dirname(projTemplates) //        /path/DevJournal
    : process.cwd(); // fallback

  return {
    templates: user ? join(userTemplatesDir()!, "templates") : join(projRoot, "templates"),
    configFile: user ? join(dirname(userTemplatesDir()!), "config.json") : join(projRoot, "work-journal.json"),
  };
}
