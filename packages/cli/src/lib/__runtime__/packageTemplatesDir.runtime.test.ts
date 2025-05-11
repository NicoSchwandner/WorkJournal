import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { packageTemplatesDir } from "../pathHelpers"; // compiled code in tests

describe("packageTemplatesDir [runtime]", () => {
  it("resolves to a valid templates folder with template files", () => {
    const dir = packageTemplatesDir();
    // The path can be either:
    // 1. In node_modules (production/installed environment)
    // 2. In the local development path (during testing)
    const isValidPath =
      dir.match(/node_modules[\\/](.*)work-journal[\\/]templates$/) !== null ||
      dir.match(/WorkJournal[\\/]packages[\\/]cli[\\/]templates$/) !== null;

    expect(isValidPath).toBe(true);
    expect(existsSync(join(dir, "daily_template.md"))).toBe(true);
  });
});
