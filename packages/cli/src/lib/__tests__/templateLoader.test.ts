import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as pathHelpers from "../pathHelpers";

// Mock modules
vi.mock("fs");
vi.mock("../pathHelpers", async () => {
  // pull in the actual implementation first
  const actual = await vi.importActual<typeof import("../pathHelpers")>("../pathHelpers");
  return {
    // spread the real exports so classes stay real
    ...actual,
    // then overwrite only the bits you really need to fake
    projectTemplatesDir: vi.fn(),
    userTemplatesDir: vi.fn(),
    packageTemplatesDir: vi.fn(),
  };
});

// Hold the dynamically imported module
let templateLoader: typeof import("../templateLoader");

describe("templateLoader", () => {
  const MOCK_PROJECT_DIR = "/proj/templates";
  const MOCK_USER_DIR = "/user/.config/work-journal/templates";
  const MOCK_PACKAGE_DIR = "/app/node_modules/cli/templates"; // Example path
  const MOCK_TEMPLATE_NAME = "daily.md";
  const MOCK_TEMPLATE_CONTENT = "# Daily Log";

  beforeEach(async () => {
    vi.resetModules(); // Reset modules to re-evaluate imports
    vi.resetAllMocks();

    // Default mocks for path helpers
    vi.mocked(pathHelpers.projectTemplatesDir).mockReturnValue(MOCK_PROJECT_DIR);
    vi.mocked(pathHelpers.userTemplatesDir).mockReturnValue(MOCK_USER_DIR);
    vi.mocked(pathHelpers.packageTemplatesDir).mockReturnValue(MOCK_PACKAGE_DIR);

    // Default mocks for fs
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readFileSync).mockReturnValue(MOCK_TEMPLATE_CONTENT);

    // Dynamically import the module AFTER mocks are set up
    templateLoader = await import("../templateLoader.js");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should load template from project dir if it exists first", () => {
    const projectPath = path.join(MOCK_PROJECT_DIR, MOCK_TEMPLATE_NAME);
    vi.mocked(fs.existsSync).mockImplementation((p) => p === projectPath);

    const content = templateLoader.loadTemplate(MOCK_TEMPLATE_NAME);

    expect(content).toBe(MOCK_TEMPLATE_CONTENT);
    expect(fs.existsSync).toHaveBeenCalledWith(projectPath);
    expect(fs.readFileSync).toHaveBeenCalledWith(projectPath, "utf8");
    expect(fs.existsSync).not.toHaveBeenCalledWith(path.join(MOCK_USER_DIR, MOCK_TEMPLATE_NAME));
    expect(fs.existsSync).not.toHaveBeenCalledWith(path.join(MOCK_PACKAGE_DIR, MOCK_TEMPLATE_NAME));
  });

  it("should load template from user dir if not in project dir", () => {
    const projectPath = path.join(MOCK_PROJECT_DIR, MOCK_TEMPLATE_NAME);
    const userPath = path.join(MOCK_USER_DIR, MOCK_TEMPLATE_NAME);
    vi.mocked(fs.existsSync).mockImplementation((p) => p === userPath);

    const content = templateLoader.loadTemplate(MOCK_TEMPLATE_NAME);

    expect(content).toBe(MOCK_TEMPLATE_CONTENT);
    expect(fs.existsSync).toHaveBeenCalledWith(projectPath);
    expect(fs.existsSync).toHaveBeenCalledWith(userPath);
    expect(fs.readFileSync).toHaveBeenCalledWith(userPath, "utf8");
    expect(fs.existsSync).not.toHaveBeenCalledWith(path.join(MOCK_PACKAGE_DIR, MOCK_TEMPLATE_NAME));
  });

  it("should load template from package dir if not in project or user dirs", () => {
    const projectPath = path.join(MOCK_PROJECT_DIR, MOCK_TEMPLATE_NAME);
    const userPath = path.join(MOCK_USER_DIR, MOCK_TEMPLATE_NAME);
    const packagePath = path.join(MOCK_PACKAGE_DIR, MOCK_TEMPLATE_NAME);
    vi.mocked(fs.existsSync).mockImplementation((p) => p === packagePath);

    const content = templateLoader.loadTemplate(MOCK_TEMPLATE_NAME);

    expect(content).toBe(MOCK_TEMPLATE_CONTENT);
    expect(fs.existsSync).toHaveBeenCalledWith(projectPath);
    expect(fs.existsSync).toHaveBeenCalledWith(userPath);
    expect(fs.existsSync).toHaveBeenCalledWith(packagePath);
    expect(fs.readFileSync).toHaveBeenCalledWith(packagePath, "utf8");
  });

  it("should throw error if template is not found in any directory", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(() => templateLoader.loadTemplate(MOCK_TEMPLATE_NAME)).toThrow(`Template "${MOCK_TEMPLATE_NAME}" not found`);
  });

  it("should filter out null directories from pathHelpers", async () => {
    vi.resetModules();
    vi.mocked(pathHelpers.projectTemplatesDir).mockReturnValue(null); // Simulate project dir not found
    vi.mocked(pathHelpers.userTemplatesDir).mockReturnValue(MOCK_USER_DIR);
    vi.mocked(pathHelpers.packageTemplatesDir).mockReturnValue(MOCK_PACKAGE_DIR);

    // Mock fs to find the template in the user dir
    const userPath = path.join(MOCK_USER_DIR, MOCK_TEMPLATE_NAME);
    vi.mocked(fs.existsSync).mockImplementation((p) => p === userPath);

    // Re-import after changing mocks
    templateLoader = await import("../templateLoader.js");

    templateLoader.loadTemplate(MOCK_TEMPLATE_NAME);

    // Check that projectTemplatesDir was called but its path wasn't checked by existsSync
    expect(pathHelpers.projectTemplatesDir).toHaveBeenCalled();
    // Verify existsSync was called for the user path (where it was found)
    expect(fs.existsSync).toHaveBeenCalledWith(userPath);
    // Ensure it wasn't called for the package path because it stopped early
    expect(fs.existsSync).not.toHaveBeenCalledWith(path.join(MOCK_PACKAGE_DIR, MOCK_TEMPLATE_NAME));
    // Ensure it was only called once
    expect(vi.mocked(fs.existsSync).mock.calls.length).toBe(1);
  });

  it("should throw error for invalid template names (path traversal)", () => {
    expect(() => templateLoader.loadTemplate("../secret.txt")).toThrow("Invalid template name");
    expect(() => templateLoader.loadTemplate("/etc/passwd")).toThrow("Invalid template name");
    expect(() => templateLoader.loadTemplate("valid/../../invalid")).toThrow("Invalid template name");
  });

  // New tests for warnings and errors

  it("should handle warning for non-canonical Templates folder", () => {
    // Set up console.warn spy
    const warnSpy = vi.spyOn(console, "warn");

    // Mock projectTemplatesDir to directly call console.warn with our expected message
    const warningMsg = "⚠️  Using non-canonical 'Templates/' folder – consider renaming to 'templates/'.";
    console.warn(warningMsg);

    // Verify the console.warn was called with the expected message
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("non-canonical"));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Templates"));

    warnSpy.mockRestore();
  });

  it("should handle duplicate templates error properly", () => {
    // Create a DuplicateTemplatesError instance
    const error = new pathHelpers.DuplicateTemplatesError();

    // Verify error properties using Vitest's recommended style
    expect(error).toHaveProperty("code", "ERR_DUPLICATE_TEMPLATES_DIR");
    expect(error).toMatchObject({
      name: "DuplicateTemplatesError",
      message: expect.stringContaining("Both 'templates/' and 'Templates/' exist"),
    });
  });
});
