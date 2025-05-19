import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import { join } from "path";

// Mock modules
vi.mock("fs");

// Dynamically import after mocks are set up
let pathHelpers: typeof import("../pathHelpers.js");

describe("duplicate templates folder handling", () => {
  const root = "/repo";

  beforeEach(async () => {
    // Reset mocks and import module before each test
    vi.resetModules();
    vi.resetAllMocks();

    // --- Mock Globals ---
    // Stub global process properties
    vi.stubGlobal("process", {
      cwd: vi.fn().mockReturnValue(root),
      platform: "linux", // Default platform
      env: {},
    });

    // Import the module dynamically AFTER mocks are in place
    pathHelpers = await import("../pathHelpers.js");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals(); // Clean up global stubs
  });

  function mockFs({ lower, upper }: { lower?: boolean; upper?: boolean }) {
    const entries: fs.Dirent[] = [];
    if (lower) {
      const lowerEntry = new fs.Dirent();
      lowerEntry.name = "templates";
      lowerEntry.isDirectory = () => true;
      entries.push(lowerEntry);
    }
    if (upper) {
      const upperEntry = new fs.Dirent();
      upperEntry.name = "Templates";
      upperEntry.isDirectory = () => true;
      entries.push(upperEntry);
    }

    vi.mocked(fs.readdirSync).mockImplementation((dir, options) => {
      if (options?.withFileTypes) {
        return entries;
      }
      return [];
    });
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

  // Skip this test on Windows platform
  if (process.platform !== "win32") {
    it("handles case sensitivity on Linux", () => {
      mockFs({ lower: true, upper: true });
      expect(() => pathHelpers.projectTemplatesDir()).toThrow(/Both.*templates.*Templates.*exist/);
    });
  }
});
