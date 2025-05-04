#!/usr/bin/env node
import yargs from "yargs";
yargs()
  .scriptName("work-journal")
  .command("placeholder", "A placeholder command for now")
  .demandCommand()
  .help()
  .parse();
