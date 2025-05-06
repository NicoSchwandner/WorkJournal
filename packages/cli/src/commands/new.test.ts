import mockFs from "mock-fs";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { format, addDays, setDay } from "date-fns";
import { runNew } from "./new";
import { describe, test, expect, afterEach } from "vitest";

// Helper to get a date that's a specific day of the week
function getDateByDay(dayOfWeek: number): Date {
  const today = new Date();
  return setDay(today, dayOfWeek, { weekStartsOn: 1 });
}

// Helper to create fake templates
function setupMockFileSystem() {
  // Setup mock templates directory
  const templatesDir = join(process.cwd(), "templates");

  mockFs({
    [templatesDir]: {
      "daily_template.md": `<!-- TEMPLATE: daily -->
# $date (Week $week)
## Top 3 priorities Daily
- [ ] …`,
      "weekly_template.md": `<!-- TEMPLATE: weekly -->
# Week $week / $year
## Weekly summary
## Weekly Wins 🎉`,
      "monthly_template.md": `<!-- TEMPLATE: monthly -->
# Monthly Review - Month $date`,
      "quarterly_template.md": `<!-- TEMPLATE: quarterly -->
# Quarterly Review Q$quarter $year`,
      "yearly_template.md": `<!-- TEMPLATE: yearly -->
# Year in Review $year`,
    },
    // Ensure Journal directory exists, but empty
    [join(process.cwd(), "Journal")]: {},
  });
}

// Clean up mock file system after tests
afterEach(() => {
  mockFs.restore();
});

describe("new command", () => {
  test("Case A: Monday creates file with daily template and no template comments", () => {
    // Setup
    setupMockFileSystem();

    // Monday (Day 1)
    const monday = getDateByDay(1);
    const journalPath = runNew(monday, false);

    // Assertions
    expect(existsSync(journalPath)).toBe(true);

    const content = readFileSync(journalPath, "utf8");
    expect(content.startsWith("# ")).toBe(true); // Should start with heading, not comment
    expect(content).not.toContain("<!-- TEMPLATE: daily -->");
    expect(content).toContain("Top 3 priorities Daily");
  });

  test("Case B: Friday creates file with weekly template, not daily", () => {
    // Setup
    setupMockFileSystem();

    // Friday (Day 5)
    const friday = getDateByDay(5);

    // Run
    const journalPath = runNew(friday, false);

    // Assertions
    expect(existsSync(journalPath)).toBe(true);

    const content = readFileSync(journalPath, "utf8");
    expect(content).not.toContain("<!-- TEMPLATE: daily -->");
    expect(content).not.toContain("<!-- TEMPLATE: weekly -->");
    expect(content).toContain("Weekly Wins 🎉");
    expect(content).not.toContain("Top 3 priorities Daily"); // Should NOT use daily template
  });

  test("Case C: End-of-quarter Friday uses quarterly template, not weekly or daily", () => {
    // Setup
    setupMockFileSystem();

    // Create a specific date known to be end of quarter (2025-03-28, last Friday of Q1)
    const endOfQuarterFriday = new Date(2025, 2, 28); // March 28, 2025 (zero-indexed month)

    // Set up year/month directory structure
    const year = format(endOfQuarterFriday, "yyyy");
    const month = format(endOfQuarterFriday, "MM");
    mkdirSync(join(process.cwd(), "Journal", year, month), { recursive: true });

    // Run the new command
    const journalPath = runNew(endOfQuarterFriday, false);

    // Assertions
    expect(existsSync(journalPath)).toBe(true);

    const content = readFileSync(journalPath, "utf8");
    expect(content).not.toContain("<!-- TEMPLATE: daily -->");
    expect(content).not.toContain("<!-- TEMPLATE: weekly -->");
    expect(content).toContain("Quarterly Review Q1 2025");
    expect(content).not.toContain("Weekly Wins"); // Weekly template should NOT be used
    expect(content).not.toContain("Top 3 priorities Daily"); // Daily template should NOT be used
  });

  test("Case D: Yearly template takes precedence over all others on vacation Friday", () => {
    // Setup
    setupMockFileSystem();

    // Create a vacation Friday (2025-12-12, assuming cutoff is Dec 17)
    const vacationFriday = new Date(2025, 11, 12); // December 12, 2025

    // Run the new command
    const journalPath = runNew(vacationFriday, false);

    // Assertions
    expect(existsSync(journalPath)).toBe(true);

    const content = readFileSync(journalPath, "utf8");
    expect(content).toContain("Year in Review 2025");
    expect(content).not.toContain("Weekly Wins"); // Weekly template should NOT be used
    expect(content).not.toContain("Quarterly Review"); // Quarterly template should NOT be used
    expect(content).not.toContain("Monthly Review"); // Monthly template should NOT be used
  });

  test("Case E: Does not overwrite existing file unless force flag is set", () => {
    // Setup
    setupMockFileSystem();

    // Monday (Day 1)
    const monday = getDateByDay(1);

    // Create a journal directory and existing file
    const year = format(monday, "yyyy");
    const month = format(monday, "MM");
    const dateString = format(monday, "yyyy-MM-dd");
    const journalDir = join(process.cwd(), "Journal", year, month);
    const journalFilePath = join(journalDir, `${dateString}.md`);

    // Create directory and existing file with custom content
    mkdirSync(journalDir, { recursive: true });
    writeFileSync(journalFilePath, "# Existing content");

    // Run without force flag
    runNew(monday, false, false);

    // Existing content should be preserved
    expect(readFileSync(journalFilePath, "utf8")).toBe("# Existing content");

    // Run with force flag
    runNew(monday, false, true);

    // Content should be overwritten
    const newContent = readFileSync(journalFilePath, "utf8");
    expect(newContent).not.toBe("# Existing content");
    expect(newContent).toContain("Top 3 priorities Daily");
  });
});
