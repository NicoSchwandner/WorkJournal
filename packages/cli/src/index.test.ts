import { expect, test } from "vitest";
import path from "path";
import { fileURLToPath } from "url";

test("CLI boots", async () => {
  const { execaNode } = await import("execa");

  // Get the path to the CLI binary, resolving from the current file location
  // This ensures it works regardless of where the test is run from
  const currentFilePath = import.meta.url ? fileURLToPath(import.meta.url) : __filename;
  const cliPackageDir = path.dirname(path.dirname(currentFilePath));
  const cliBinPath = path.join(cliPackageDir, "dist", "index.js");

  try {
    const { stdout } = await execaNode(cliBinPath, ["--help"]);
    expect(stdout).toContain("Commands:");
  } catch (error) {
    // Even if the command exits with an error code, we want to check its output
    if (error.stdout || error.stderr) {
      const output = [error.stdout, error.stderr].join("\n");
      expect(output).toContain("Commands:");
    } else {
      throw error;
    }
  }
});
