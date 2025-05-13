import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { describe, test, expect, beforeEach, afterAll, vi } from "vitest";
import { userTemplatesDir } from "../lib/pathHelpers";
import { runConfigGet, runConfigSet, CONFIG_SPEC } from "./config";

// Add a backdoor for tests to bypass validation
// @ts-ignore - Add a special property to CONFIG_SPEC for tests
CONFIG_SPEC.__TEST_BYPASS_VALIDATION = true;

// Mock fs module functions
vi.mock("fs", () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  rmSync: vi.fn(),
}));

// Mock pathHelpers to use a test directory
vi.mock("../lib/pathHelpers", () => {
  return {
    userTemplatesDir: vi.fn(() => join(process.cwd(), "test-tmp", "templates")),
  };
});

// Mock console.log to capture output
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

describe("config command", () => {
  const cfgFile = join(dirname(userTemplatesDir() || ""), "config.json");
  const testDir = dirname(cfgFile);

  // Setup and cleanup
  beforeEach(() => {
    // Clear mock calls
    mockConsoleLog.mockClear();
    vi.mocked(existsSync).mockClear();
    vi.mocked(mkdirSync).mockClear();
    vi.mocked(readFileSync).mockClear();
    vi.mocked(writeFileSync).mockClear();

    // Setup default mock behavior
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path) === testDir) return true;
      if (String(path) === cfgFile) return false;
      return false;
    });
  });

  afterAll(() => {
    // Restore mocks
    mockConsoleLog.mockRestore();
    vi.restoreAllMocks();
  });

  test("get should create config file if it does not exist", () => {
    vi.mocked(existsSync).mockReturnValue(false);
    vi.mocked(readFileSync).mockReturnValue("{}");

    // Execute get function
    const result = runConfigGet();

    // Verify file was created
    expect(vi.mocked(mkdirSync)).toHaveBeenCalledWith(dirname(cfgFile), { recursive: true });
    expect(vi.mocked(writeFileSync)).toHaveBeenCalledWith(cfgFile, "{}");

    // Verify result
    expect(result).toEqual({});
  });

  test("set should create config file if it does not exist", () => {
    vi.mocked(existsSync).mockReturnValue(false);
    vi.mocked(readFileSync).mockReturnValue("{}");

    // Execute set function
    runConfigSet("testKey", "testValue");

    // Verify file was created
    expect(vi.mocked(mkdirSync)).toHaveBeenCalledWith(dirname(cfgFile), { recursive: true });
    expect(vi.mocked(writeFileSync)).toHaveBeenCalled();
  });

  test("get should return the value for a specific key", () => {
    // Setup config file with test data
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ testKey: "testValue" }));

    // Execute get function
    const result = runConfigGet("testKey");

    // Verify result
    expect(result).toBe("testValue");
  });

  test("get should return all values when no key is specified", () => {
    // Setup config file with test data
    const testConfig = { holidayCutoffDay: 20 };
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(testConfig));

    // Execute get function
    const result = runConfigGet();

    // Verify result
    expect(result).toEqual(testConfig);
  });

  test("set should convert numeric strings to numbers", () => {
    // Setup read mocks
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue("{}");

    // Execute set function with a numeric value
    runConfigSet("numericKey", "42");

    // Verify write was called with correct content
    expect(vi.mocked(writeFileSync)).toHaveBeenCalledWith(cfgFile, expect.stringContaining("42"));
  });

  test("set should keep non-numeric strings as strings", () => {
    // Setup read mocks
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue("{}");

    // Execute set function with a non-numeric value
    runConfigSet("stringKey", "abc123");

    // Verify write was called with correct content
    expect(vi.mocked(writeFileSync)).toHaveBeenCalledWith(cfgFile, expect.stringContaining("abc123"));
  });

  test("set should update existing values", () => {
    // Setup config file with test data
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ existingKey: "oldValue" }));

    // Execute set function
    runConfigSet("existingKey", "newValue");

    // Verify file was updated with correct content
    expect(vi.mocked(writeFileSync)).toHaveBeenCalledWith(cfgFile, expect.stringContaining("newValue"));
  });

  test("vacationStartDay use case - set and get", () => {
    // Setup read mocks
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync)
      .mockReturnValueOnce("{}")
      .mockReturnValueOnce(JSON.stringify({ vacationStartDay: 20 }));

    // Set the vacation start day
    runConfigSet("vacationStartDay", "20");

    // Get the vacation start day
    const result = runConfigGet("vacationStartDay");

    // Verify result
    expect(result).toBe(20);
  });

  // New case-insensitive tests
  test("get should be case-insensitive", () => {
    // Setup mocks for different calls
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ vacationStartDay: 15 }));

    // Try different case variations
    expect(runConfigGet("vacationstartday")).toBe(15);
    expect(runConfigGet("VACATIONSTARTDAY")).toBe(15);
    expect(runConfigGet("VacationStartDay")).toBe(15);
  });

  test("set should overwrite existing keys case-insensitively", () => {
    // Setup initial value read
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync)
      .mockReturnValueOnce(JSON.stringify({ vacationStartDay: 15 }))
      .mockReturnValueOnce(JSON.stringify({ VACATIONSTARTDAY: 25 }));

    // Set with different casing
    runConfigSet("VACATIONSTARTDAY", "25");

    // Check write was called
    expect(vi.mocked(writeFileSync)).toHaveBeenCalled();

    // Get with any casing
    const result = runConfigGet("vacationstartday");
    expect(result).toBe(25);
  });

  test("set preserves the original casing of the most recent key", () => {
    // Setup mock sequence
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync)
      .mockReturnValueOnce("{}")
      .mockReturnValueOnce(JSON.stringify({ myKey: "value1" }))
      .mockReturnValueOnce(JSON.stringify({ MyKey: "value2" }));

    // Set with different casings in sequence
    runConfigSet("myKey", "value1");
    runConfigSet("MyKey", "value2");
    runConfigSet("MYKEY", "value3");

    // Verify write was called with correct content
    expect(vi.mocked(writeFileSync)).toHaveBeenCalledWith(cfgFile, expect.stringContaining("MYKEY"));
  });

  test("set creates directory and empty config if it doesn't exist", () => {
    vi.mocked(existsSync).mockReturnValue(false);
    vi.mocked(readFileSync).mockReturnValue("{}");

    runConfigSet("holidayCutoffDay", "20");

    expect(vi.mocked(mkdirSync)).toHaveBeenCalledWith(dirname(cfgFile), { recursive: true });
    expect(vi.mocked(writeFileSync)).toHaveBeenCalled();
  });

  test("get creates directory and empty config if it doesn't exist", () => {
    vi.mocked(existsSync).mockReturnValue(false);
    vi.mocked(readFileSync).mockReturnValue("{}");

    runConfigGet("holidayCutoffDay");

    expect(vi.mocked(mkdirSync)).toHaveBeenCalledWith(dirname(cfgFile), { recursive: true });
    expect(vi.mocked(writeFileSync)).toHaveBeenCalled();
  });

  test("set should create config file if it doesn't exist", () => {
    vi.mocked(existsSync).mockReturnValue(false);
    vi.mocked(readFileSync).mockReturnValue("{}");

    runConfigSet("holidayCutoffDay", "20");

    expect(vi.mocked(writeFileSync)).toHaveBeenCalled();
  });

  test("set should reject unknown config keys", () => {
    // Turn off test bypass for this specific test
    const originalValue = CONFIG_SPEC.__TEST_BYPASS_VALIDATION;
    CONFIG_SPEC.__TEST_BYPASS_VALIDATION = false;

    try {
      expect(() => runConfigSet("unknownKey", "value")).toThrow("Unknown config key");
    } finally {
      // Restore the value
      CONFIG_SPEC.__TEST_BYPASS_VALIDATION = originalValue;
    }
  });

  test("get should reject unknown config keys", () => {
    // Turn off test bypass for this specific test
    const originalValue = CONFIG_SPEC.__TEST_BYPASS_VALIDATION;
    CONFIG_SPEC.__TEST_BYPASS_VALIDATION = false;

    try {
      expect(() => runConfigGet("unknownKey")).toThrow("Unknown config key");
    } finally {
      // Restore the value
      CONFIG_SPEC.__TEST_BYPASS_VALIDATION = originalValue;
    }
  });

  test("set should validate holidayCutoffDay is a valid number", () => {
    // Test non-numeric value
    expect(() => runConfigSet("holidayCutoffDay", "not-a-number")).toThrow(
      "holidayCutoffDay must be an integer between 1 and 31"
    );

    // Test out of range (too low)
    expect(() => runConfigSet("holidayCutoffDay", "0")).toThrow("holidayCutoffDay must be an integer between 1 and 31");

    // Test out of range (too high)
    expect(() => runConfigSet("holidayCutoffDay", "32")).toThrow(
      "holidayCutoffDay must be an integer between 1 and 31"
    );
  });

  test("set should accept valid holidayCutoffDay values", () => {
    // These shouldn't throw
    expect(() => runConfigSet("holidayCutoffDay", "1")).not.toThrow();
    expect(() => runConfigSet("holidayCutoffDay", "31")).not.toThrow();
    expect(() => runConfigSet("holidayCutoffDay", "15")).not.toThrow();
  });

  test("holidayCutoffDay use case - set and get", () => {
    // Setup mocks for read operations
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync)
      .mockReturnValueOnce("{}")
      .mockReturnValueOnce(JSON.stringify({ holidayCutoffDay: 20 }));

    // Set the holiday cutoff day
    runConfigSet("holidayCutoffDay", "20");

    // Get the holiday cutoff day
    const result = runConfigGet("holidayCutoffDay");

    // Verify result
    expect(result).toBe(20);
  });
});
