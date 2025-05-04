// tests/templates.placeholder.spec.ts
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, extname, basename } from "node:path";

/**
 * Recursively collect *.md files under a directory.
 * No third-party deps needed – Node's fs + path are plenty.
 */
function collectMarkdownFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = join(dir, entry.name);
      return entry.isDirectory() ? collectMarkdownFiles(full) : full;
    })
    .filter((f) => extname(f) === ".md");
}

describe("template placeholders", () => {
  const templatesDir = join(process.cwd(), "templates");
  const mdFiles = collectMarkdownFiles(templatesDir);

  // Sanity check to ensure we found template files
  it("found template files", () => {
    expect(mdFiles.length).toBeGreaterThan(0);
  });

  it('every template has at least one "$date" placeholder', () => {
    mdFiles.forEach((file) => {
      const content = readFileSync(file, "utf8");
      expect(content).toMatch(/\$date/);
    });
  });

  it('weekly template has at least one "$week" placeholder', () => {
    const weeklyTemplates = mdFiles.filter((file) => basename(file).toLowerCase().includes("weekly"));

    // Skip test if no weekly templates found
    if (weeklyTemplates.length === 0) {
      console.warn("No weekly templates found to test");
      return;
    }

    weeklyTemplates.forEach((file) => {
      const content = readFileSync(file, "utf8");
      expect(content).toMatch(/\$week/);
    });
  });

  it('monthly template has at least one "$month" placeholder', () => {
    const monthlyTemplates = mdFiles.filter((file) => basename(file).toLowerCase().includes("monthly"));

    // Skip test if no monthly templates found
    if (monthlyTemplates.length === 0) {
      console.warn("No monthly templates found to test");
      return;
    }

    monthlyTemplates.forEach((file) => {
      const content = readFileSync(file, "utf8");
      expect(content).toMatch(/\$month/);
    });
  });

  it('quarterly template has at least one "$quarter" placeholder', () => {
    const quarterlyTemplates = mdFiles.filter((file) => basename(file).toLowerCase().includes("quarterly"));

    // Skip test if no quarterly templates found
    if (quarterlyTemplates.length === 0) {
      console.warn("No quarterly templates found to test");
      return;
    }

    quarterlyTemplates.forEach((file) => {
      const content = readFileSync(file, "utf8");
      expect(content).toMatch(/\$quarter/);
    });
  });

  it('yearly template has at least one "$year" placeholder', () => {
    const yearlyTemplates = mdFiles.filter((file) => basename(file).toLowerCase().includes("yearly"));

    // Skip test if no yearly templates found
    if (yearlyTemplates.length === 0) {
      console.warn("No yearly templates found to test");
      return;
    }

    yearlyTemplates.forEach((file) => {
      const content = readFileSync(file, "utf8");
      expect(content).toMatch(/\$year/);
    });
  });
});
