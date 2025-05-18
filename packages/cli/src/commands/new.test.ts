import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { format } from "date-fns";
import { runNew } from "./new";
import * as config from "../lib/config";
import * as dateLogic from "../lib/dateLogic";
import * as templateLoader from "../lib/templateLoader";

// Mock modules
vi.mock("fs");
vi.mock("child_process");
vi.mock("../lib/config");
vi.mock("../lib/templateLoader");
vi.mock("../lib/dateLogic", async () => {
  const actual = await vi.importActual("../lib/dateLogic");
  return {
    ...actual,
    // These can be overridden in specific tests
    isFriday: vi.fn(() => true),
    isEndOfMonthFriday: vi.fn(() => false),
    isEndOfQuarterFriday: vi.fn(() => false),
    isVacationFriday: vi.fn(() => false),
  };
});

// Define the mock template content
const mockTemplates = {
  "daily_template.md": "Daily Template\n\nTop 3 priorities Daily\n\n$date",
  "weekly_template.md": "Weekly Template\n\nWeekly Wins\n\n$date",
  "monthly_template.md": "Monthly Review $monthName $year\n\n$date",
  "quarterly_template.md": "Quarterly Review Q$quarter $year\n\n$date",
  "yearly_template.md": "Year in Review $year\n\n$date",
};

describe("new command", () => {
  let writtenFilePath = "";
  let writtenContent = "";
  const originalProcessExit = process.exit;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    writtenFilePath = "";
    writtenContent = "";

    // Mock process.exit to prevent test termination
    vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`Process exited with code ${code}`);
    });

    // Default mocks that work for all tests
    vi.mocked(existsSync).mockImplementation((path) => {
      // Templates always exist
      if (String(path).includes("template")) return true;
      // By default journal files don't exist
      return false;
    });

    vi.mocked(mkdirSync).mockImplementation(() => undefined);

    vi.mocked(readFileSync).mockImplementation((path) => {
      const pathStr = String(path);

      // Handle template requests
      if (pathStr.includes("daily_template")) return mockTemplates["daily_template.md"];
      if (pathStr.includes("weekly_template")) return mockTemplates["weekly_template.md"];
      if (pathStr.includes("monthly_template")) return mockTemplates["monthly_template.md"];
      if (pathStr.includes("quarterly_template")) return mockTemplates["quarterly_template.md"];
      if (pathStr.includes("yearly_template")) return mockTemplates["yearly_template.md"];

      // Return the written content for journal files
      if (pathStr === writtenFilePath) return writtenContent;

      return "";
    });

    vi.mocked(writeFileSync).mockImplementation((path, content) => {
      writtenFilePath = String(path);
      writtenContent = String(content);
      return undefined;
    });

    // Default config
    vi.mocked(config.getConfig).mockReturnValue(undefined);

    // Default date logic - regular weekday (not special)
    vi.mocked(dateLogic.isFriday).mockReturnValue(false);
    vi.mocked(dateLogic.isEndOfMonthFriday).mockReturnValue(false);
    vi.mocked(dateLogic.isEndOfQuarterFriday).mockReturnValue(false);
    vi.mocked(dateLogic.isVacationFriday).mockReturnValue(false);

    // Mock templateLoader
    vi.mocked(templateLoader.loadTemplate).mockImplementation((templateName) => {
      switch (templateName) {
        case "daily_template.md":
          return mockTemplates["daily_template.md"];
        case "weekly_template.md":
          return mockTemplates["weekly_template.md"];
        case "monthly_template.md":
          return mockTemplates["monthly_template.md"];
        case "quarterly_template.md":
          return mockTemplates["quarterly_template.md"];
        case "yearly_template.md":
          return mockTemplates["yearly_template.md"];
        default:
          return mockTemplates["daily_template.md"];
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.exit = originalProcessExit;
  });

  test("Monday creates file with daily template", () => {
    // Create a Monday
    const monday = new Date(2025, 4, 5); // May 5, 2025

    // Run the command
    const journalPath = runNew(monday, false);

    // Verify file was written with correct content
    expect(writtenFilePath).toBe(journalPath);
    expect(writtenContent).toContain("Daily Template");
    expect(writtenContent).toContain("Top 3 priorities Daily");
    expect(writtenContent).not.toContain("<!-- TEMPLATE:");
  });

  test("Friday creates file with weekly template", () => {
    // Set up Friday
    vi.mocked(dateLogic.isFriday).mockReturnValue(true);

    // Create a regular Friday
    const friday = new Date(2025, 4, 9); // May 9, 2025

    // Run the command
    const journalPath = runNew(friday, false);

    // Verify weekly template was used
    expect(writtenFilePath).toBe(journalPath);
    expect(writtenContent).toContain("Weekly Template");
    expect(writtenContent).toContain("Weekly Wins");
    expect(writtenContent).not.toContain("Top 3 priorities Daily");
  });

  test("End-of-quarter Friday uses quarterly template", () => {
    // Set up end of quarter Friday
    vi.mocked(dateLogic.isFriday).mockReturnValue(true);
    vi.mocked(dateLogic.isEndOfQuarterFriday).mockReturnValue(true);

    // Create end of quarter Friday
    const endOfQuarterFriday = new Date(2025, 2, 28); // March 28, 2025

    // Run the command
    const journalPath = runNew(endOfQuarterFriday, false);

    // Verify quarterly template was used
    expect(writtenFilePath).toBe(journalPath);
    expect(writtenContent).toContain("Quarterly Review Q1 2025");
    expect(writtenContent).not.toContain("Weekly Wins");
  });

  test("Vacation Friday with default cutoff uses yearly template", () => {
    // Set up vacation Friday
    vi.mocked(dateLogic.isFriday).mockReturnValue(true);
    vi.mocked(dateLogic.isVacationFriday).mockReturnValue(true);

    // Create a vacation Friday (with default cutoff of 23)
    const vacationFriday = new Date(2025, 11, 12); // December 12, 2025

    // Run the command
    const journalPath = runNew(vacationFriday, false);

    // Verify yearly template was used
    expect(writtenFilePath).toBe(journalPath);
    expect(writtenContent).toContain("Year in Review 2025");
    expect(writtenContent).not.toContain("Weekly Wins");
  });

  test("Vacation Friday respects custom holiday cutoff", () => {
    // Set up vacation Friday with custom cutoff
    vi.mocked(dateLogic.isFriday).mockReturnValue(true);
    vi.mocked(dateLogic.isVacationFriday).mockReturnValue(true);

    // Set custom cutoff of 22
    vi.mocked(config.getConfig).mockReturnValue(22);

    // Create a date that would be vacation Friday with cutoff 22 but not with default
    const customVacationFriday = new Date(2025, 11, 19); // December 19, 2025

    // Run the command
    const journalPath = runNew(customVacationFriday, false);

    // Verify yearly template was used
    expect(writtenFilePath).toBe(journalPath);
    expect(writtenContent).toContain("Year in Review 2025");
  });

  test("Does not overwrite existing file unless force flag is set", () => {
    // Create a test date
    const testDate = new Date(2025, 4, 5); // May 5, 2025

    // Mock that file already exists
    vi.mocked(existsSync).mockImplementation((path) => {
      if (String(path).includes("template")) return true;
      // File exists this time
      return true;
    });

    // Spy on console.log
    const consoleSpy = vi.spyOn(console, "log");

    // Run with force=false
    runNew(testDate, false, false);

    // Should not write to file
    expect(writtenContent).toBe("");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Journal entry already exists"));

    // Reset for next part of test
    consoleSpy.mockClear();

    // Run with force=true
    runNew(testDate, false, true);

    // Should overwrite file
    expect(writtenContent).not.toBe("");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Overwrote journal entry"));

    consoleSpy.mockRestore();
  });

  test("Handles duplicate templates error", () => {
    // Mock templateLoader to throw the duplicate templates error
    vi.mocked(templateLoader.loadTemplate).mockImplementation(() => {
      throw new Error(
        "ERR_DUPLICATE_TEMPLATES_DIR: Both 'templates/' and 'Templates/' exist. Please keep exactly one (lower-case is recommended)."
      );
    });

    // Create a test date
    const testDate = new Date(2025, 4, 5); // May 5, 2025

    // Expect runNew to throw an error with our custom message
    expect(() => runNew(testDate, false)).toThrow("Process exited with code 1");
  });
});
