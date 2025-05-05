import { describe, it, beforeEach, afterEach, expect } from "vitest";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import mock from "mock-fs";
import { runInit } from "./init";

describe("work-journal init command", () => {
  const mockSourceTemplatesPath = "/mock/source-templates";
  const mockDestTemplatesPath = "/mock/dest-templates";

  beforeEach(() => {
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
});
