# work-journal

## 1.4.0

### Minor Changes

- 0ea8774: Change journal directory to lowercase for better filesystem compatibility

### Patch Changes

- b8c4204: Warn once for non-canonical Templates folder
- e7df432: Fixes a bug where the config file could be written inside the Templates/ folder (instead of the project root) if the folder was named with a capital T ("Templates/").

  The project root is now always resolved correctly regardless of the case of the templates folder, so config files are saved in the right place. Also adds a test for PascalCase folder names and ensures cross-platform path compatibility.

## 1.3.1

### Patch Changes

- 6860527: deterministic template lookup when `Templates/` exists

## 1.3.0

### Minor Changes

- c4fce8e: Align data residency of init command and config, default to repo, enable saving to user config with --user flag
- ad19914: Allow setting config values from environment variables

## 1.2.0

### Minor Changes

- 39572ad: Fix publishing pipeline by updating the checkout action in GitHub workflow

## 1.1.0

### Minor Changes

- 58d4454: 💥 Breaking: Renamed vacationStartDay to holidayCutoffDay with input validation
  Added validation for config keys - only accepted key is now `holidayCutoffDay`
  Added centralized config utility with memoization for performance

## 1.0.5

### Patch Changes

- 0f2228d: Fix template path resolution broken in production builds

## 1.0.4

### Patch Changes

- 34d017d: Fix CI/CD pipeline by supplying the correct token

## 1.0.3

### Patch Changes

- 7182182: Fix template copying when running the init command from an npm installation

## 1.0.2

### Patch Changes

- acf1d9e: 📚 Enhancement of README documentation:

  - Moved project tagline to top for immediate clarity
  - Added badges for project status indicators
  - Added the missing `$month` placeholder token to reference table
  - Improved organization with section anchors and clearer structure
  - Added visual examples (VS Code task flow and journal example)
  - Updated repository diagram to include dist/ and changeset/ directories
  - Added note about corepack for Node 20+ users
  - Added CLI reference with --help output
  - Enhanced with configuration examples and template lookup visualization

## 1.0.1

### Patch Changes

- e7a17cc: Fixed a bug in release automation
- e7a17cc: Updated changeset ID format to be human-readable
