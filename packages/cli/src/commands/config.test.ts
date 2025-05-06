import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { describe, test, expect, beforeEach, afterAll, vi } from "vitest";
import { userTemplatesDir } from "../lib/pathHelpers";
import { runConfigGet, runConfigSet } from "./config";

// Mock pathHelpers to use a test directory
vi.mock("../lib/pathHelpers", () => {
  const originalModule = vi.importActual("../lib/pathHelpers");
  return {
    ...originalModule,
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

    // Ensure test directory exists but config.json doesn't
    if (existsSync(testDir)) {
      if (existsSync(cfgFile)) {
        rmSync(cfgFile);
      }
    } else {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up the test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }

    // Restore mocks
    mockConsoleLog.mockRestore();
  });

  test("get should create config file if it does not exist", () => {
    // Execute get function
    const result = runConfigGet();

    // Verify file was created
    expect(existsSync(cfgFile)).toBe(true);
    expect(readFileSync(cfgFile, "utf8")).toBe("{}");

    // Verify result
    expect(result).toEqual({});
  });

  test("set should create config file if it does not exist", () => {
    // Execute set function
    runConfigSet("testKey", "testValue");

    // Verify file was created with correct content
    expect(existsSync(cfgFile)).toBe(true);
    const config = JSON.parse(readFileSync(cfgFile, "utf8"));
    expect(config.testKey).toBe("testValue");
  });

  test("get should return the value for a specific key", () => {
    // Setup config file with test data
    const testConfig = { testKey: "testValue" };
    writeFileSync(cfgFile, JSON.stringify(testConfig));

    // Execute get function
    const result = runConfigGet("testKey");

    // Verify result
    expect(result).toBe("testValue");
  });

  test("get should return all values when no key is specified", () => {
    // Setup config file with test data
    const testConfig = { key1: "value1", key2: "value2" };
    writeFileSync(cfgFile, JSON.stringify(testConfig));

    // Execute get function
    const result = runConfigGet();

    // Verify result
    expect(result).toEqual(testConfig);
  });

  test("set should convert numeric strings to numbers", () => {
    // Execute set function with a numeric value
    runConfigSet("numericKey", "42");

    // Verify file was created with correct content
    const config = JSON.parse(readFileSync(cfgFile, "utf8"));
    expect(config.numericKey).toBe(42);
    expect(typeof config.numericKey).toBe("number");
  });

  test("set should keep non-numeric strings as strings", () => {
    // Execute set function with a non-numeric value
    runConfigSet("stringKey", "abc123");

    // Verify file was created with correct content
    const config = JSON.parse(readFileSync(cfgFile, "utf8"));
    expect(config.stringKey).toBe("abc123");
    expect(typeof config.stringKey).toBe("string");
  });

  test("set should update existing values", () => {
    // Setup config file with test data
    const testConfig = { existingKey: "oldValue" };
    writeFileSync(cfgFile, JSON.stringify(testConfig));

    // Execute set function
    runConfigSet("existingKey", "newValue");

    // Verify file was updated with correct content
    const config = JSON.parse(readFileSync(cfgFile, "utf8"));
    expect(config.existingKey).toBe("newValue");
  });

  test("vacationStartDay use case - set and get", () => {
    // Set the vacation start day
    runConfigSet("vacationStartDay", "20");

    // Get the vacation start day
    const result = runConfigGet("vacationStartDay");

    // Verify result
    expect(result).toBe(20);
  });

  // New case-insensitive tests
  test("get should be case-insensitive", () => {
    // Setup config with camelCase key
    runConfigSet("vacationStartDay", "15");

    // Try different case variations
    expect(runConfigGet("vacationstartday")).toBe(15);
    expect(runConfigGet("VACATIONSTARTDAY")).toBe(15);
    expect(runConfigGet("VacationStartDay")).toBe(15);
  });

  test("set should overwrite existing keys case-insensitively", () => {
    // Setup initial value with one casing
    runConfigSet("vacationStartDay", "15");

    // Set with different casing
    runConfigSet("VACATIONSTARTDAY", "25");

    // Check results
    const config = JSON.parse(readFileSync(cfgFile, "utf8"));

    // Should only have one key (the newest one)
    expect(Object.keys(config).length).toBe(1);
    expect(Object.keys(config)[0]).toBe("VACATIONSTARTDAY");
    expect(config.VACATIONSTARTDAY).toBe(25);

    // Should be retrievable with any casing
    expect(runConfigGet("vacationstartday")).toBe(25);
  });

  test("set preserves the original casing of the most recent key", () => {
    // Set with different casings in sequence
    runConfigSet("myKey", "value1");
    runConfigSet("MyKey", "value2");
    runConfigSet("MYKEY", "value3");

    const config = JSON.parse(readFileSync(cfgFile, "utf8"));

    // Should only have the last key with its original casing
    expect(Object.keys(config).length).toBe(1);
    expect(Object.keys(config)[0]).toBe("MYKEY");
    expect(config.MYKEY).toBe("value3");
  });
});
