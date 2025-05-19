import { describe, it, expect, vi, beforeEach } from "vitest";
import { join } from "path";
import * as fs from "fs";
import * as pathHelpers from "../pathHelpers";

// Mock modules
vi.mock("fs");

describe("duplicate templates folder handling", () => {
  const root = "/repo";

  beforeEach(() => {
    vi.resetAllMocks();

    // Mock process.cwd
    vi.stubGlobal("process", {
      ...process,
      cwd: vi.fn().mockReturnValue(root),
    });
  });

  function mockFs({ lower, upper }: { lower?: boolean; upper?: boolean }) {
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      if (lower && p === join(root, "templates")) return true;
      if (upper && p === join(root, "Templates")) return true;
      return false;
    });

    vi.mocked(fs.statSync).mockImplementation(
      (p) =>
        ({
          isDirectory: () => true,
        } as unknown as fs.Stats)
    );
  }

  it("uses lowercase when only it exists", () => {
    mockFs({ lower: true });
    expect(pathHelpers.projectTemplatesDir()).toBe(join(root, "templates"));
  });

  it("warns and uses PascalCase when only it exists", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFs({ upper: true });
    expect(pathHelpers.projectTemplatesDir()).toBe(join(root, "Templates"));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("non-canonical"));
    warn.mockRestore();
  });

  it("throws when both exist", () => {
    mockFs({ lower: true, upper: true });
    expect(() => pathHelpers.projectTemplatesDir()).toThrow("ERR_DUPLICATE_TEMPLATES_DIR");
  });

  if (process.platform !== "win32") {
    // Test Linux-only case-sensitive functionality
    it("maintains case sensitivity behavior on Linux", () => {
      mockFs({ lower: true, upper: true });
      expect(() => pathHelpers.projectTemplatesDir()).toThrow("ERR_DUPLICATE_TEMPLATES_DIR");
    });
  }
});
