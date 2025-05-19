import { describe, it, expect, vi, beforeEach } from "vitest";
import { join } from "path";
import * as fs from "fs";

// Mock modules
vi.mock("fs");

// Dynamically import after mocks are set up
let pathHelpers: typeof import("../pathHelpers.js");

// Test suite (now explicitly exported for Vitest to detect)
export default describe("duplicate templates folder handling", () => {
  const root = "/repo";

  beforeEach(async () => {
    // Reset mocks and import module before each test
    vi.resetModules();
    vi.resetAllMocks();

    // Mock process.cwd
    vi.stubGlobal("process", {
      ...process,
      cwd: vi.fn().mockReturnValue(root),
    });

    // Import the module dynamically AFTER mocks are in place
    pathHelpers = await import("../pathHelpers.js");
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

  // Skip the test on Windows since Windows filesystems are case-insensitive by default
  if (process.platform !== "win32") {
    it("correctly handles case-sensitive file systems", () => {
      mockFs({ lower: true });
      expect(pathHelpers.projectTemplatesDir()).toBe(join(root, "templates"));
    });
  }
});
