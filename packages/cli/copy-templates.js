#!/usr/bin/env node
/**
 * Cross-platform script to copy templates from the repo root to the CLI package
 */

const fs = require("fs");
const path = require("path");

// Source and destination paths
const srcDir = path.resolve(__dirname, "../../templates");
const destDir = path.resolve(__dirname, "./templates");

// Clean up existing templates directory
if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}

// Create the templates directory
fs.mkdirSync(destDir, { recursive: true });

// Copy all .md files
fs.readdirSync(srcDir)
  .filter((file) => file.endsWith(".md"))
  .forEach((file) => {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);
    fs.copyFileSync(srcFile, destFile);
    console.log(`Copied ${file} to ${destDir}`);
  });

console.log("Templates copied successfully!");
