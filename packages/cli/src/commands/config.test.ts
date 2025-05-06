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
});
