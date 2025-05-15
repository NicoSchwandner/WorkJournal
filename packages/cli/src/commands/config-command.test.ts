import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { CommandModule } from "yargs";
import { configCommand, configGetCommand, configSetCommand } from "./config";
import { resolveScope } from "../lib/paths";
import { runConfigGet, runConfigSet } from "../lib/config";

// Mock the config functions
vi.mock("../lib/config", () => ({
  runConfigGet: vi.fn(),
  runConfigSet: vi.fn(),
}));

// Mock the resolveScope function
vi.mock("../lib/paths", () => ({
  resolveScope: vi.fn(),
}));

describe("config command module", () => {
  // Mock console.log to capture output
  const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

  const projectConfigPath = "/mock/project/work-journal.json";
  const userConfigPath = "/mock/user/.config/work-journal/config.json";

  beforeEach(() => {
    vi.resetAllMocks();

    // Mock resolveScope to return our test paths
    vi.mocked(resolveScope).mockImplementation((user: boolean) => ({
      templates: user ? "/mock/user/.config/work-journal/templates" : "/mock/project/templates",
      configFile: user ? userConfigPath : projectConfigPath,
    }));

    // Mock runConfigGet to return test data
    vi.mocked(runConfigGet).mockReturnValue({
      merged: { holidayCutoffDay: 23 },
      sources: [userConfigPath, projectConfigPath],
    });
  });

  afterEach(() => {
    mockConsoleLog.mockClear();
  });

  describe("configGetCommand", () => {
    test("should call runConfigGet and display result with sources", async () => {
      // Create mock handler arguments
      const argv = { key: "holidayCutoffDay" };

      // Call the handler
      configGetCommand.handler(argv as any);

      // Check that runConfigGet was called with the key
      expect(runConfigGet).toHaveBeenCalledWith("holidayCutoffDay");

      // Check console output
      expect(mockConsoleLog).toHaveBeenCalledWith({ holidayCutoffDay: 23 });
      expect(mockConsoleLog).toHaveBeenCalledWith("Loaded from:", userConfigPath + ", " + projectConfigPath);
    });

    test("should not display sources if none are available", async () => {
      // Mock empty sources
      vi.mocked(runConfigGet).mockReturnValueOnce({
        merged: { holidayCutoffDay: 23 },
        sources: [],
      });

      // Call the handler
      configGetCommand.handler({} as any);

      // Check that sources message is not displayed
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });
  });

  describe("configSetCommand", () => {
    test("should call runConfigSet with project config path by default", async () => {
      // Create mock handler arguments
      const argv = { key: "holidayCutoffDay", value: "25", user: false };

      // Call the handler
      configSetCommand.handler(argv as any);

      // Check that resolveScope was called with false (project scope)
      expect(resolveScope).toHaveBeenCalledWith(false);

      // Check that runConfigSet was called with the project path
      expect(runConfigSet).toHaveBeenCalledWith(projectConfigPath, "holidayCutoffDay", "25");

      // Check console output
      expect(mockConsoleLog).toHaveBeenCalledWith("✅ saved (project scope)");
    });

    test("should call runConfigSet with user config path when --user flag is used", async () => {
      // Create mock handler arguments
      const argv = { key: "holidayCutoffDay", value: "25", user: true };

      // Call the handler
      configSetCommand.handler(argv as any);

      // Check that resolveScope was called with true (user scope)
      expect(resolveScope).toHaveBeenCalledWith(true);

      // Check that runConfigSet was called with the user path
      expect(runConfigSet).toHaveBeenCalledWith(userConfigPath, "holidayCutoffDay", "25");

      // Check console output
      expect(mockConsoleLog).toHaveBeenCalledWith("✅ saved (user scope)");
    });
  });

  describe("configCommand", () => {
    test("should have get and set subcommands", () => {
      // Access the builder function
      const builder = configCommand.builder as Function;

      // Mock yargs
      const mockYargs = {
        command: vi.fn().mockReturnThis(),
        demandCommand: vi.fn().mockReturnThis(),
      };

      // Call the builder
      builder(mockYargs);

      // Check that both subcommands were added
      expect(mockYargs.command).toHaveBeenCalledWith(configGetCommand);
      expect(mockYargs.command).toHaveBeenCalledWith(configSetCommand);
      expect(mockYargs.demandCommand).toHaveBeenCalled();
    });
  });
});
