import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "node:path";
import { resolveScope } from "../paths";
import { projectTemplatesDir, userTemplatesDir } from "../pathHelpers";

// Mock the path helpers
vi.mock("../pathHelpers", () => ({
  projectTemplatesDir: vi.fn(),
  userTemplatesDir: vi.fn(),
}));

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

  it("should resolve project root correctly when Templates/ uses PascalCase", () => {
    // simulate PascalCase projectTemplatesDir()
    vi.mocked(projectTemplatesDir).mockReturnValue("/repo/DevJournal/Templates");

    const scope = resolveScope(false);

    expect(scope.configFile).toBe("/repo/DevJournal/work-journal.json");
  });
});
