import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { join as originalJoin } from "path";
import * as pathModule from "path";
import * as fs from "fs";
import * as os from "os";
import * as url from "url";

// Mock modules
vi.mock("fs");
vi.mock("os");
vi.mock("url");

// Dynamically import after mocks are set up
let pathHelpers: typeof import("../pathHelpers.js");

describe("pathHelpers", () => {
  const MOCK_CWD = "/home/user/project/subdir";
  const MOCK_PROJECT_ROOT = "/home/user/project";
  const MOCK_TEMPLATES_PATH = originalJoin(MOCK_PROJECT_ROOT, "templates");
  const MOCK_HOME = "/home/user";
  const MOCK_APPDATA = "C:\\Users\\User\\AppData\\Roaming";
  const MOCKED_DIRNAME = "/path/to/workspace/packages/cli/dist/lib";

  beforeEach(async () => {
    // Reset mocks and import module before each test
    vi.resetModules();
    vi.resetAllMocks();

    // --- Mock Globals ---
    // Stub global process properties
    vi.stubGlobal("process", {
      cwd: vi.fn().mockReturnValue(MOCK_CWD),
      platform: "linux", // Default platform
      env: {}, // Default empty env
      // Mock __dirname for packageTemplatesDir fallback
      // This assumes the built file is in packages/cli/dist/lib
      // Adjust if build structure changes
      __dirname: MOCKED_DIRNAME,
    });

    // --- Mock Module Functions ---
    // Mock os.homedir
    vi.spyOn(os, "homedir").mockReturnValue(MOCK_HOME);

    // Mock fs functions (default: not found)
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    vi.spyOn(fs, "statSync").mockImplementation((path) => {
      // statSync should only succeed if existsSync would for the *same path*
      // And only return isDirectory true for the mock templates path
      if (vi.mocked(fs.existsSync)(path as string)) {
        return { isDirectory: () => path === MOCK_TEMPLATES_PATH } as fs.Stats;
      } else {
        const err = new Error(`ENOENT: no such file or directory, stat '${path}'`);
        (err as any).code = "ENOENT";
        throw err;
      }
    });

    // Import the module dynamically AFTER mocks are in place
    pathHelpers = await import("../pathHelpers.js");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals(); // Clean up global stubs
  });

  describe("projectTemplatesDir", () => {
    it("should find templates directory by walking up from cwd", () => {
      // Specific mock for this test: existsSync returns true ONLY for the correct path
      vi.spyOn(fs, "existsSync").mockImplementation((path) => path === MOCK_TEMPLATES_PATH);

      expect(pathHelpers.projectTemplatesDir()).toBe(MOCK_TEMPLATES_PATH);
      // Check the calls made during the walk up
      expect(fs.existsSync).toHaveBeenCalledWith(originalJoin(MOCK_CWD, "templates"));
      expect(fs.existsSync).toHaveBeenCalledWith(MOCK_TEMPLATES_PATH);
      // statSync should have been called only for the path that exists
      expect(fs.statSync).toHaveBeenCalledWith(MOCK_TEMPLATES_PATH);
    });

    it("should return null if templates directory is not found up to root", () => {
      // Default mock: existsSync always returns false
      expect(pathHelpers.projectTemplatesDir()).toBeNull();
    });

    it("should return null if found path is not a directory", () => {
      // Mock existsSync to find the path
      vi.spyOn(fs, "existsSync").mockImplementation((path) => path === MOCK_TEMPLATES_PATH);
      // Mock statSync to say it's NOT a directory
      vi.spyOn(fs, "statSync").mockImplementation((path) => {
        if (path === MOCK_TEMPLATES_PATH) {
          return { isDirectory: () => false } as fs.Stats;
        }
        const err = new Error(`ENOENT: no such file or directory, stat '${path}'`);
        (err as any).code = "ENOENT";
        throw err;
      });
      expect(pathHelpers.projectTemplatesDir()).toBeNull();
    });
  });

  describe("userTemplatesDir", () => {
    it("should return Linux path using .config", () => {
      vi.stubGlobal("process", { ...globalThis.process, platform: "linux", env: {} });
      expect(pathHelpers.userTemplatesDir()).toBe(originalJoin(MOCK_HOME, ".config", "work-journal", "templates"));
    });

    it("should return macOS path using Library/Preferences", () => {
      vi.stubGlobal("process", { ...globalThis.process, platform: "darwin", env: {} });
      expect(pathHelpers.userTemplatesDir()).toBe(
        originalJoin(MOCK_HOME, "Library", "Preferences", "work-journal", "templates")
      );
    });

    it("should return Windows path using APPDATA", () => {
      vi.stubGlobal("process", { ...globalThis.process, platform: "win32", env: { APPDATA: MOCK_APPDATA } });
      expect(pathHelpers.userTemplatesDir()).toBe(originalJoin(MOCK_APPDATA, "work-journal", "templates"));
    });

    it("should prioritize APPDATA even on non-windows if set", () => {
      vi.stubGlobal("process", { ...globalThis.process, platform: "linux", env: { APPDATA: MOCK_APPDATA } });
      expect(pathHelpers.userTemplatesDir()).toBe(originalJoin(MOCK_APPDATA, "work-journal", "templates"));
    });

    it("should handle win32 without APPDATA (fallback to .config)", () => {
      vi.stubGlobal("process", { ...globalThis.process, platform: "win32", env: {} });
      // Expect fallback to the .config path even on Windows if APPDATA isn't set
      expect(pathHelpers.userTemplatesDir()).toBe(originalJoin(MOCK_HOME, ".config", "work-journal", "templates"));
    });
  });

  describe("packageTemplatesDir", () => {
    it("should return correct path structure in CJS fallback context", () => {
      // Arrange: Mock URL constructor to simulate ESM context failure
      const mockURL = vi.fn(() => {
        throw new Error("Cannot use URL in CJS context");
      });

      vi.stubGlobal("URL", mockURL);

      // Act: Call the function to trigger the CJS fallback
      const result = pathHelpers.packageTemplatesDir();

      // Assert: Check that the result uses the CJS fallback path
      // We can't predict the exact path, but we can check the pattern
      expect(result).toMatch(/[\/\\]templates$/);
    });

    it("should handle ESM context with import.meta.url correctly", () => {
      // Mock file path for ESM context
      const mockFilePath = "/path/to/node_modules/work-journal/dist/lib/pathHelpers.js";

      // Mock URL and fileURLToPath
      vi.mocked(url.fileURLToPath).mockReturnValue(mockFilePath);

      // Mock URL constructor
      vi.stubGlobal(
        "URL",
        class MockURL {
          pathname: string;
          constructor() {
            this.pathname = "file:///path/to/node_modules/work-journal/dist/lib/pathHelpers.js";
          }
        }
      );

      // Call the function
      const result = pathHelpers.packageTemplatesDir();

      // ESM path should join dirname(mockFilePath) with ../../templates
      const expectedPath = originalJoin(pathModule.dirname(mockFilePath), "..", "..", "templates");

      // Should resolve correctly
      expect(result).toEqual(expect.stringMatching(/templates$/));
    });
  });
});
