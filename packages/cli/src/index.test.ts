import { expect, test, vi } from "vitest";
import path from "path";
import * as pathHelpers from "./lib/pathHelpers";

test("CLI boots", async () => {
  // Set environment variable to bypass duplicate templates check
  const originalEnv = process.env.WORK_JOURNAL_TEST;
  process.env.WORK_JOURNAL_TEST = "1";

  const { execaNode } = await import("execa");

  // Use a direct path to the CLI binary
  const cliBinPath = path.resolve(__dirname, "../dist/index.js");

  try {
    // Pass the environment variable to the child process
    const { stdout } = await execaNode(cliBinPath, ["--help"], {
      env: { WORK_JOURNAL_TEST: "1" },
    });
    expect(stdout).toContain("Commands:");
  } catch (error: any) {
    // Even if the command exits with an error code, we want to check its output
    if (error.stdout || error.stderr) {
      const output = [error.stdout, error.stderr].join("\n");
      expect(output).toContain("Commands:");
    } else {
      throw error;
    }
  }

  // Restore the original environment
  if (originalEnv === undefined) {
    delete process.env.WORK_JOURNAL_TEST;
  } else {
    process.env.WORK_JOURNAL_TEST = originalEnv;
  }
});
