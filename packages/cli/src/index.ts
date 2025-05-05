#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers"; // Import hideBin
import { initCommand } from "./commands/init"; // Import the init command module

yargs(hideBin(process.argv)) // Use hideBin here
  .scriptName("work-journal")
  .command(initCommand) // Register the init command module
  // .command("placeholder", "A placeholder command for now") // Remove placeholder
  .demandCommand(1, "Please specify a command.") // Update demandCommand message
  .strict() // Enable strict mode
  .help()
  .parse();
