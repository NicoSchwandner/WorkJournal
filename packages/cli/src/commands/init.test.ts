import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import mock from "mock-fs";
import { runInit } from "./init";
import { resolveScope } from "../lib/paths";

// Mock the resolveScope function
vi.mock("../lib/paths", () => ({
  resolveScope: vi.fn(),
}));

describe("work-journal init command", () => {
  const mockSourceTemplatesPath = "/mock/source-templates";
  const mockDestTemplatesPath = "/mock/dest-templates";
  const mockUserTemplatesPath = "/mock/user-templates";

  beforeEach(() => {
    vi.resetAllMocks();

    // Mock resolveScope to return our test paths
    vi.mocked(resolveScope).mockImplementation((user: boolean) => ({
      templates: user ? mockUserTemplatesPath : mockDestTemplatesPath,
      configFile: user ? "/mock/user-config.json" : "/mock/project-config.json",
    }));

    mock({
      [mockSourceTemplatesPath]: {
        "daily.md": "Daily template content",
        "weekly.md": "Weekly template content",
        config: { "settings.json": "some settings" },
      },
      "/mock": {},
    });
  });

  afterEach(() => {
    mock.restore();
    vi.resetAllMocks();
  });

  it("should create templates directory and copy files if it does not exist", () => {
    expect(existsSync(mockDestTemplatesPath)).toBe(false);

    runInit(false, mockDestTemplatesPath, mockSourceTemplatesPath);

    expect(existsSync(mockDestTemplatesPath)).toBe(true);
    expect(existsSync(join(mockDestTemplatesPath, "daily.md"))).toBe(true);
    expect(readFileSync(join(mockDestTemplatesPath, "daily.md"), "utf8")).toBe("Daily template content");
    expect(existsSync(join(mockDestTemplatesPath, "weekly.md"))).toBe(true);
    expect(readFileSync(join(mockDestTemplatesPath, "weekly.md"), "utf8")).toBe("Weekly template content");
    expect(existsSync(join(mockDestTemplatesPath, "config"))).toBe(false);
  });

  it("should throw error if templates directory exists and --force is not used", () => {
    mkdirSync(mockDestTemplatesPath, { recursive: true });
    writeFileSync(join(mockDestTemplatesPath, "dummy.txt"), "existing content");
    expect(existsSync(mockDestTemplatesPath)).toBe(true);

    expect(() => runInit(false, mockDestTemplatesPath, mockSourceTemplatesPath)).toThrowError(
      "templates/ already exists – use --force to overwrite"
    );

    expect(existsSync(join(mockDestTemplatesPath, "dummy.txt"))).toBe(true);
    expect(readFileSync(join(mockDestTemplatesPath, "dummy.txt"), "utf8")).toBe("existing content");
    expect(existsSync(join(mockDestTemplatesPath, "daily.md"))).toBe(false);
    expect(existsSync(join(mockDestTemplatesPath, "weekly.md"))).toBe(false);
  });

  it("should overwrite existing templates directory if --force is used", () => {
    mkdirSync(mockDestTemplatesPath, { recursive: true });
    writeFileSync(join(mockDestTemplatesPath, "dummy.txt"), "existing content");
    expect(existsSync(mockDestTemplatesPath)).toBe(true);

    runInit(true, mockDestTemplatesPath, mockSourceTemplatesPath);

    expect(existsSync(mockDestTemplatesPath)).toBe(true);
    expect(existsSync(join(mockDestTemplatesPath, "dummy.txt"))).toBe(true);
    expect(readFileSync(join(mockDestTemplatesPath, "dummy.txt"), "utf8")).toBe("existing content");

    expect(existsSync(join(mockDestTemplatesPath, "daily.md"))).toBe(true);
    expect(readFileSync(join(mockDestTemplatesPath, "daily.md"), "utf8")).toBe("Daily template content");
    expect(existsSync(join(mockDestTemplatesPath, "weekly.md"))).toBe(true);
    expect(readFileSync(join(mockDestTemplatesPath, "weekly.md"), "utf8")).toBe("Weekly template content");
    expect(existsSync(join(mockDestTemplatesPath, "config"))).toBe(false);
  });

  it("should throw error if source directory does not exist", () => {
    const nonExistentSourcePath = "/mock/non-existent-source";
    expect(existsSync(nonExistentSourcePath)).toBe(false);

    expect(() => runInit(false, mockDestTemplatesPath, nonExistentSourcePath)).toThrowError(
      `Source templates directory not found: ${nonExistentSourcePath}`
    );
  });

  it("should use user templates directory when --user flag is true", () => {
    expect(existsSync(mockUserTemplatesPath)).toBe(false);

    runInit(false, mockUserTemplatesPath, mockSourceTemplatesPath);

    expect(existsSync(mockUserTemplatesPath)).toBe(true);
    expect(existsSync(join(mockUserTemplatesPath, "daily.md"))).toBe(true);
    expect(readFileSync(join(mockUserTemplatesPath, "daily.md"), "utf8")).toBe("Daily template content");
    expect(existsSync(join(mockUserTemplatesPath, "weekly.md"))).toBe(true);
    expect(readFileSync(join(mockUserTemplatesPath, "weekly.md"), "utf8")).toBe("Weekly template content");
  });
});
