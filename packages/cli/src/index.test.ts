import { expect, test } from "vitest";
test("CLI boots", async () => {
  const { execaNode } = await import("execa");
  try {
    const { stdout } = await execaNode("dist/index.js", ["--help"]);
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
