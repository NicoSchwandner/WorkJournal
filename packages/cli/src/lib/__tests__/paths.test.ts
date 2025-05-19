import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "node:path";
import { resolveScope } from "../paths";
import { projectTemplatesDir, userTemplatesDir } from "../pathHelpers";

// Mock the path helpers
vi.mock("../pathHelpers", () => ({
  projectTemplatesDir: vi.fn(),
  userTemplatesDir: vi.fn(),
}));

// Define constants used in tests
const MOCK_CWD = "/fallback";

describe("resolveScope", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(userTemplatesDir).mockReturnValue("/home/user/.config/work-journal/templates");
    vi.mocked(projectTemplatesDir).mockReturnValue("/project/templates");
  });

  it("should resolve user scope correctly", () => {
    const scope = resolveScope(true);

    expect(scope).toEqual({
      templates: path.join("/home/user/.config/work-journal/templates", "templates"),
      configFile: path.join("/home/user/.config/work-journal", "config.json"),
    });
  });

  it("should resolve project scope correctly", () => {
    const scope = resolveScope(false);

    expect(scope).toEqual({
      templates: path.join("/project", "templates"),
      configFile: path.join("/project", "work-journal.json"),
    });
  });

  it("should handle missing project templates dir", () => {
    vi.mocked(projectTemplatesDir).mockReturnValue(null);
    const originalCwd = process.cwd;
    process.cwd = vi.fn().mockReturnValue("/fallback");

    const scope = resolveScope(false);

    expect(scope).toEqual({
      templates: path.join("/fallback", "templates"),
      configFile: path.join("/fallback", "work-journal.json"),
    });

    process.cwd = originalCwd;
  });

  describe("error handling with duplicate templates directories", () => {
    beforeEach(() => {
      // Restore console.error to prevent test pollution
      console.error = vi.fn();
    });

    it("should handle ERR_DUPLICATE_TEMPLATES_DIR error gracefully", () => {
      // Mock process.cwd to control the return path
      const originalCwd = process.cwd;
      process.cwd = vi.fn().mockReturnValue(MOCK_CWD);

      // Mock projectTemplatesDir to throw a duplicate templates error
      vi.mocked(projectTemplatesDir).mockImplementation(() => {
        throw new Error("ERR_DUPLICATE_TEMPLATES_DIR: Both 'templates/' and 'Templates/' exist");
      });

      // resolveScope should not throw the error but handle it
      const paths = resolveScope(false);

      // Should fallback to CWD
      expect(paths.templates).toBe(path.join(MOCK_CWD, "templates"));
      expect(paths.configFile).toBe(path.join(MOCK_CWD, "work-journal.json"));

      // Should log the error
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining("ERR_DUPLICATE_TEMPLATES_DIR"));

      // Restore original cwd
      process.cwd = originalCwd;
    });

    it("should handle Templates (uppercase) path", () => {
      // Mock projectTemplatesDir to return Templates with uppercase
      const templatesPath = path.join(MOCK_CWD, "Templates");
      vi.mocked(projectTemplatesDir).mockReturnValue(templatesPath);

      const paths = resolveScope(false);

      // Should still use lowercase templates for the output path
      expect(paths.templates).toBe(path.join(MOCK_CWD, "templates"));
      expect(paths.configFile).toBe(path.join(MOCK_CWD, "work-journal.json"));
    });
  });
});
