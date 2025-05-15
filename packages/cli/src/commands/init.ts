import { mkdirSync, copyFileSync, readdirSync, existsSync, statSync } from "fs";
import { join } from "path";
import type { CommandModule } from "yargs";
import { packageTemplatesDir } from "../lib/pathHelpers";
import { resolveScope } from "../lib/paths";

export function runInit(force: boolean, destDir: string, sourceDir: string): void {
  if (existsSync(destDir) && !force) {
    throw new Error("templates/ already exists – use --force to overwrite");
  }
  if (!existsSync(sourceDir)) {
    throw new Error(`Source templates directory not found: ${sourceDir}`);
  }

  mkdirSync(destDir, { recursive: true });
  for (const f of readdirSync(sourceDir)) {
    const sourceFile = join(sourceDir, f);
    if (existsSync(sourceFile) && statSync(sourceFile).isFile()) {
      copyFileSync(sourceFile, join(destDir, f));
    } else if (!existsSync(sourceFile)) {
      console.warn(`Warning: Source template file not found: ${sourceFile}`);
    }
  }
}

interface InitArgs {
  force: boolean;
  user: boolean;
}

export const initCommand: CommandModule<{}, InitArgs> = {
  command: "init",
  describe: "seed templates in ./templates",
  builder: (yargs) =>
    yargs
      .option("force", {
        type: "boolean",
        default: false,
        describe: "Overwrite existing templates directory",
      })
      .option("user", {
        type: "boolean",
        default: false,
        describe: "Copy templates into your user config dir instead of the project",
      }),
  handler: ({ force, user }) => {
    try {
      const { templates: dest } = resolveScope(user);
      const source = packageTemplatesDir();
      runInit(force, dest, source);
      console.log(`✅ templates copied to ${dest}`);
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};
