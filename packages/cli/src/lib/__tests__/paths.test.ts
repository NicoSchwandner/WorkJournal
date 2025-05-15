import { describe, it, expect, vi, beforeEach } from "vitest";
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
      templates: "/home/user/.config/work-journal/templates/templates",
      configFile: "/home/user/.config/work-journal/config.json",
    });
  });

  it("should resolve project scope correctly", () => {
    const scope = resolveScope(false);

    expect(scope).toEqual({
      templates: "/project/templates",
      configFile: "/project/work-journal.json",
    });
  });

  it("should handle missing project templates dir", () => {
    vi.mocked(projectTemplatesDir).mockReturnValue(null);
    const originalCwd = process.cwd;
    process.cwd = vi.fn().mockReturnValue("/fallback");

    const scope = resolveScope(false);

    expect(scope).toEqual({
      templates: "/fallback/templates",
      configFile: "/fallback/work-journal.json",
    });

    process.cwd = originalCwd;
  });
});
