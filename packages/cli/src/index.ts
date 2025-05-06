#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers"; // Import hideBin
import { initCommand } from "./commands/init"; // Import the init command module
import { newCommand } from "./commands/new"; // Import the new command module
import { configCommand } from "./commands/config"; // Import the config command module

yargs(hideBin(process.argv)) // Use hideBin here
  .scriptName("work-journal")
  .command(initCommand) // Register the init command module
  .command(newCommand) // Register the new command module
  .command(configCommand) // Register the config command module
  .demandCommand(1, "Please specify a command.") // Update demandCommand message
  .strict() // Enable strict mode
  .help()
  .parse();
