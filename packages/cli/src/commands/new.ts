import { existsSync, mkdirSync, writeFileSync, appendFileSync, readFileSync } from "fs";
import { join } from "path";
import type { CommandModule } from "yargs";
import { addDays, format } from "date-fns";
import { spawn } from "child_process";
import { loadTemplate } from "../lib/templateLoader";
import { render, hasUnreplaced } from "../lib/placeholder";
import { isFriday, isEndOfMonthFriday, isEndOfQuarterFriday, isVacationFriday, weekNum } from "../lib/dateLogic";

interface NewCommandArgs {
  offset: number;
  open: boolean;
  force: boolean;
}

/**
 * Determines the appropriate template to use based on date
 * @param targetDate The date to check
 * @returns The template filename to use, or null if no special template
 */
function determineTemplate(targetDate: Date): string {
  // Check from highest to lowest priority
  if (isVacationFriday(targetDate, 17)) {
    return "yearly_template.md";
  } else if (isEndOfQuarterFriday(targetDate)) {
    return "quarterly_template.md";
  } else if (isEndOfMonthFriday(targetDate)) {
    return "monthly_template.md";
  } else if (isFriday(targetDate)) {
    return "weekly_template.md";
  } else {
    return "daily_template.md";
  }
}

/**
 * Creates or appends to today's journal entry.
 * Handles daily, weekly, monthly, quarterly, and yearly templates.
 * @param targetDate The date to create/append the journal for
 * @param shouldOpen Whether to open the file after creation
 * @param force Whether to force overwrite existing files
 */
export function runNew(targetDate: Date, shouldOpen: boolean, force: boolean = false): string {
  // Format date components
  const year = format(targetDate, "yyyy");
  const month = format(targetDate, "MM");
  const day = format(targetDate, "dd");
  const dateString = format(targetDate, "yyyy-MM-dd");
  const formattedDate = format(targetDate, "EEEE, MMMM do yyyy");
  const weekNumber = weekNum(targetDate);

  // Calculate quarter (1-4)
  const quarter = Math.floor(targetDate.getMonth() / 3) + 1;

  // Build the journal file path
  const journalDir = join(process.cwd(), "Journal", year, month);
  const journalFilePath = join(journalDir, `${dateString}.md`);

  // Create directory structure if needed
  mkdirSync(journalDir, { recursive: true });

  // Check if file exists
  const fileExists = existsSync(journalFilePath);

  // Create replacements map for rendering templates
  const replacements = {
    date: formattedDate,
    week: weekNumber,
    year,
    quarter,
  };

  // Determine which template to use based on date
  const templateToUse = determineTemplate(targetDate);

  // Create or overwrite file if it doesn't exist or force is true
  if (!fileExists || force) {
    try {
      let template = loadTemplate(templateToUse);
      // Remove template comment
      template = template.replace(/<!-- TEMPLATE: [a-z]+ -->\n\n?/, "");
      const renderedTemplate = render(template, replacements);
      writeFileSync(journalFilePath, renderedTemplate);
      console.log(`${fileExists ? "Overwrote" : "Created"} journal entry: ${journalFilePath}`);
    } catch (error: any) {
      console.error(`Error ${fileExists ? "overwriting" : "creating"} journal file: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log(`Journal entry already exists: ${journalFilePath}`);
  }

  // Check for unreplaced placeholders
  const finalContent = readFileSync(journalFilePath, "utf8");
  if (hasUnreplaced(finalContent)) {
    console.warn("Warning: Journal entry contains unreplaced placeholders");
  }

  // Open the file if requested
  if (shouldOpen) {
    const editor = process.env.EDITOR || "code";
    try {
      spawn(editor, [journalFilePath], { stdio: "inherit" });
      console.log(`Opening ${journalFilePath} with ${editor}`);
    } catch (error: any) {
      console.error(`Error opening file: ${error.message}`);
    }
  }

  return journalFilePath;
}

export const newCommand: CommandModule<{}, NewCommandArgs> = {
  command: "new",
  describe: "create or append to today's journal entry",
  builder: (yargs) =>
    yargs
      .option("offset", {
        type: "number",
        default: 0,
        describe: "Day offset from today",
      })
      .option("open", {
        type: "boolean",
        default: false,
        describe: "Open the journal entry after creation",
      })
      .option("force", {
        type: "boolean",
        default: false,
        describe: "Force overwrite existing journal entry",
      }),
  handler: ({ offset, open, force }) => {
    try {
      // Calculate target date by adding the offset to today
      const targetDate = addDays(new Date(), offset);
      const journalPath = runNew(targetDate, open, force);
      console.log(`Journal entry ready: ${journalPath}`);
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};
