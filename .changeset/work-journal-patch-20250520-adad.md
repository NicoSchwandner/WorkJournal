---
"work-journal": patch
---

Fixes a bug where the config file could be written inside the Templates/ folder (instead of the project root) if the folder was named with a capital T ("Templates/").

The project root is now always resolved correctly regardless of the case of the templates folder, so config files are saved in the right place. Also adds a test for PascalCase folder names and ensures cross-platform path compatibility.
