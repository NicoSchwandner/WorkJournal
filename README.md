# 🗒️ Work-Journal

> Zero-friction Markdown journal for developers.

[![GitHub Repo](https://img.shields.io/badge/GitHub-WorkJournal-blue?logo=github)](https://github.com/NicoSchwandner/WorkJournal) [![Stars](https://img.shields.io/github/stars/NicoSchwandner/WorkJournal?style=social)](https://github.com/NicoSchwandner/WorkJournal) [![CI](https://github.com/NicoSchwandner/WorkJournal/actions/workflows/ci.yml/badge.svg)](https://github.com/NicoSchwandner/WorkJournal/actions/workflows/ci.yml) [![npm](https://img.shields.io/npm/v/work-journal)](https://www.npmjs.com/package/work-journal) [![License](https://img.shields.io/github/license/NicoSchwandner/WorkJournal)](https://github.com/NicoSchwandner/WorkJournal/blob/main/LICENSE)

[![Demo of work-journal as cli](https://raw.githubusercontent.com/NicoSchwandner/WorkJournal/main/assets/demo.gif)](https://asciinema.org/a/Ss97s2DA2ztjSPpVIxMNrLmgj?autoplay=1&loop=1)

---

## 🌟 Why Work-Journal?

**TL;DR:** Work-Journal is a simple, CLI-first tool for developers to maintain consistent Markdown journals with minimal setup and fuss, integrating smoothly with Git and your existing editor.

Keeping a lightweight text journal helps you:

- 🧠 **Stay focused** instead of juggling half-finished tasks in your head.
- 🚧 **Surface blockers early** and record decisions for your future self.
- 📣 Deliver **crystal-clear stand-up updates** without scrolling through Slack history.
- 📈 See **long-term progress** with weekly, monthly, or quarterly reflections.

Traditional note-taking apps can feel heavy, manual, or lock you into proprietary formats. **Work-Journal** embraces plain Markdown, integrates seamlessly with Git, and automates the tedious parts of maintaining a consistent journal.

---

## 🚀 Quick Start

Get your journal running in under a minute! **[Node.js 18+](https://nodejs.org/en/download) is required.**

1. **Create a new journal entry for today:**

   ```bash
   npx work-journal new
   ```

   Or, if you prefer pnpm:

   ```bash
   pnpm dlx work-journal new
   ```

   This command creates a new Markdown file in `journal/YYYY/MM/YYYY-MM-DD.md` based on a template.

2. **(Optional) Install globally for easier access:**

   ```bash
   pnpm add -g work-journal  # or npm install -g work-journal
   ```

   Now you can run `work-journal new` from any directory.
   For even less friction, create an alias in your shell's configuration file (e.g., `.bashrc`, `.zshrc`):

   ```bash
   alias wj="work-journal" # Then use 'wj new'
   ```

3. **Pro-tip:** Use the `--open` flag to instantly open your new entry:

   ```bash
   work-journal new --open  # Opens in $EDITOR or falls back to VS Code
   ```

   This saves you the step of manually locating and opening the file. Set your preferred editor in the `EDITOR` environment variable, or Work-Journal will default to VS Code.

---

## ✨ Features

| Status | Feature                      | Notes                                                                                                              |
| :----: | ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
|   ✅   | **Smart Template Engine**    | Uses daily, weekly, monthly, quarterly, or yearly templates automatically based on the date.                       |
|   ✅   | **Flexible Template Source** | Prioritizes templates: `project/templates/` → user config (`~/.config/work-journal/templates`) → package defaults. |
|   ✅   | **Cross-Platform**           | Works on macOS, Linux, and Windows.                                                                                |
|   ✅   | **Configurable Year-End**    | Customize the "last Friday before holidays" trigger for the yearly template via `holidayCutoffDay`.                |
|   ✅   | **Environment Variables**    | Override config settings easily using `WORK_JOURNAL_*` environment variables.                                      |

---

## ⚙️ How It Works

### 🗂️ Journal Structure

The `new` command generates entries in a `journal/YYYY/MM/YYYY-MM-DD.md` structure. It creates this in your current working directory. If Work-Journal finds a `./templates/` directory or a `work-journal.json` config file by searching upwards from your current directory, it will use that discovered project root as the base for creating the `journal/` folder.

### 📝 Templating Logic

Work-Journal intelligently selects a template based on the target date:

- **Daily (`daily_template.md`):** The default for most days.
- **Weekly (`weekly_template.md`):** Used on Fridays.
- **Monthly (`monthly_template.md`):** Used on the last Friday of the month.
- **Quarterly (`quarterly_template.md`):** Used on the last Friday of a calendar quarter.
- **Yearly (`yearly_template.md`):** Used on the last Friday of December that falls on or before the configured `holidayCutoffDay`.

To customize these templates, run:

```bash
work-journal init
```

This copies the default templates into a `./templates` folder in your current project. You can then edit these `.md` files. If you want to set up global custom templates, use `work-journal init --user`.

### 📌 Template Override Lookup

The CLI searches for templates in the following order, using the first one it finds for each type (daily, weekly, etc.):

```
1. ./templates/                 (Project-specific custom templates)
     ↓
2. ~/.config/work-journal/      (User-level global custom templates)
     ↓
3. Packaged Default Templates   (Bundled with the CLI installation)
```

**Note:** The folder name `templates` should be lower-case, especially on case-sensitive file systems like Linux. Using `Templates/` (PascalCase) might lead to warnings or errors if `templates/` also exists.

### 🧩 Placeholder Reference

Your Markdown templates can use these placeholders, which Work-Journal will replace with dynamic values:

| Token        | Example      | Description                                    |
| ------------ | ------------ | ---------------------------------------------- |
| `$date`      | `2025-05-02` | ISO date (YYYY-MM-DD) based on local timezone. |
| `$week`      | `18`         | ISO-8601 week number (1-53).                   |
| `$month`     | `05`         | Two-digit month (01-12).                       |
| `$monthName` | `May`        | Full, localized month name.                    |
| `$quarter`   | `2`          | Calendar quarter (1-4).                        |
| `$year`      | `2025`       | Four-digit year.                               |

---

## 🛠️ Configuration

Customize Work-Journal's behavior through configuration files or environment variables.

### Configuration Files

Settings are loaded and merged in this order of precedence (Highest precedence first):

1.  **Environment Variables:** (Highest precedence)
2.  **Project Configuration:** A `work-journal.json` file in your project root (the directory where Work-Journal determines your `Journal/` or `templates/` folder resides).
3.  **User Global Configuration:**
    - Linux: `~/.config/work-journal/config.json`
    - macOS: `~/Library/Preferences/work-journal/config.json`
    - Windows: `%APPDATA%\work-journal\config.json`

### Managing Configuration via CLI

Use the `config` command:

```bash
# Set the holiday cutoff day to December 20th in the project's config
work-journal config set holidayCutoffDay 20

# Get the current effective value for holidayCutoffDay
work-journal config get holidayCutoffDay
# Output might be: 20 (and lists the source file like /path/to/project/work-journal.json)

# Set holidayCutoffDay globally in your user configuration
work-journal config set holidayCutoffDay 22 --user
```

**Available Configuration Keys:**

| Key                | Type   | Default | Description                                                                |
| ------------------ | ------ | ------- | -------------------------------------------------------------------------- |
| `holidayCutoffDay` | number | `23`    | The day in December used to determine the trigger for the yearly template. |

### Environment Variable Configuration

Override any configuration setting using environment variables prefixed with `WORK_JOURNAL_`. These take precedence over all configuration files.

```bash
# Example: Override holidayCutoffDay for the current command
export WORK_JOURNAL_HOLIDAY_CUTOFF_DAY=19
work-journal new # Uses 19 for the holiday cutoff calculation for this run
```

| Environment Variable              | Maps to Config Key | Example Value |
| --------------------------------- | ------------------ | ------------- |
| `WORK_JOURNAL_HOLIDAY_CUTOFF_DAY` | `holidayCutoffDay` | `22`          |

---

## 📖 CLI Reference

<details>
<summary><code>work-journal --help</code> (click to expand)</summary>

```text
work-journal <command>

Commands:
  work-journal init           Seed default templates into your project or user
                              directory.
                                --force: Overwrite existing templates directory
                                --user: Copy to user config dir instead of project
  work-journal new            Create or append to today's journal entry.
                                --offset: Day offset from today (e.g., -1 for
                                  yesterday, 1 for tomorrow)
                                --open: Open the journal entry after creation
                                --force: Force overwrite if journal entry already
                                  exists
  work-journal config         Manage configuration settings.
                                get [key]: Read a specific or all config values
                                set <key> <value>: Set a config value
                                  --user: Save to user config instead of project

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

</details>

---

## 🧑‍💻 Developing & Contributing

Contributions are welcome!

### Project Setup

1.  **Fork & Clone:** Fork the repository and clone it locally.
2.  **Install Dependencies:** This project uses pnpm for package management.
    ```bash
    pnpm install
    ```
    > **Note for Node 20+ users**: If you don't have pnpm installed, run `corepack enable` to use the version pinned in the repository.

### Development Workflow

1.  **Build the CLI:**

    ```bash
    pnpm -r run build
    ```

    This compiles the TypeScript source in `packages/cli/src` to JavaScript in `packages/cli/dist` and copies templates.

2.  **Run Tests:**

    ```bash
    pnpm test
    ```

    This runs the Vitest unit and integration test suite. Tests are also run automatically via GitHub Actions on push and PRs across multiple platforms and Node versions.

3.  **Making Changes:**

    - Create a feature branch for your changes.
    - Add or update tests as necessary.

4.  **Add a Changeset:** For any user-facing change (features, bug fixes), add a changeset file. This helps automate versioning and changelog generation.

    - Interactive mode: `pnpm changeset`
    - Quick patch with default message: `pnpm run changeset:patch`
    - For more control (e.g., minor/major bump, custom message): `./create-changeset.sh work-journal <patch|minor|major> "Your detailed message"`

5.  **Commit & Push:** Commit your changes along with any generated changeset files.
6.  **Open a Pull Request:** CI checks must pass before your PR can be merged.

### Release Process

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and publishing to npm.

1.  When PRs containing changeset files are merged into the `main` branch, a GitHub Action ("Release Please CI") detects these and creates or updates a "Version Package" PR. This PR includes version bumps in relevant `package.json` files and an updated `CHANGELOG.md`.
2.  Once this "Version Package" PR is reviewed and merged, another GitHub Action automatically publishes the updated package(s) to npm.

### Repository Layout

```
WorkJournal/
├── .changeset/            # Changeset files for versioning and changelogs
├── .github/workflows/     # GitHub Actions CI/CD workflows
├── docs/                  # Documentation assets (e.g., SVGs for README)
├── packages/
│   └── cli/               # The CLI package (published as "work-journal")
│       ├── src/           # TypeScript source code for the CLI
│       ├── templates/     # Default templates (copied here during CLI build)
│       ├── dist/          # Compiled JavaScript output of the CLI
│       ├── CHANGELOG.md   # Changelog specific to the CLI package
│       └── package.json   # CLI package configuration
├── templates/             # Master copy of templates (source for CLI's bundled templates)
├── test/                  # Root-level tests (e.g., for template placeholder validation)
├── create-changeset.sh    # Helper script for creating changeset files
├── LICENSE
├── package.json           # Monorepo root package.json (manages workspaces)
├── pnpm-lock.yaml
├── pnpm-workspace.yaml    # Defines pnpm workspace packages
└── README.md              # This file
```

### Pre-commit Hook (Recommended)

To ensure code quality and run tests before pushing (requires [Husky](https://typicode.github.io/husky/)):

```bash
# If you don't have husky, add it: pnpm add -D husky
npx husky add .husky/pre-push "pnpm test && npx markdownlint-cli2 ."
git add .husky/pre-push
```

---

## 🤔 Considering Alternatives: Work-Journal vs. Obsidian

While Work-Journal aims for streamlined, developer-centric journaling, you might be familiar with other powerful note-taking tools like **Obsidian**. Here's a brief comparison to help you decide if Work-Journal fits your needs:

**Obsidian** is a fantastic and versatile tool for building a "second brain." It excels at:

- Creating highly interconnected notes and knowledge graphs.
- Extensive customization through a vast plugin ecosystem.
- Serving as an all-in-one solution for notes, research, and writing.

**Work-Journal offers a different approach, focusing on:**

- **Simplicity First:** If you find Obsidian's setup, extensive features, or plugin management overwhelming for the primary task of daily/weekly journaling, Work-Journal provides a lean, focused alternative.
- **Developer Workflow Native:**
  - **Plain Markdown & Git:** Your journal lives as simple Markdown files, perfect for version control with Git. No proprietary formats or databases.
  - **CLI-Driven:** Manage your journal from the command line, easily integrating with scripts, aliases, or tools like VS Code tasks.
  - **Editor Agnostic:** Use it with any text editor you prefer.
- **Automation, Not Manual Organization:** Work-Journal automates file creation and template selection based on dates. You don't need to manually create folders, link daily notes, or manage complex tagging systems for basic journaling.
- **Low Cognitive Overhead:** The goal is to get your thoughts down quickly. Work-Journal tries to stay out of your way.

**When might Obsidian (or similar tools) be a better fit?**

- You need extensive backlinking, graph visualization, and complex knowledge management features.
- You want a single, GUI-centric application for all your note-taking, research, and writing needs, not just a work journal.
- You enjoy deep customization with numerous plugins and themes.

**In short:** If you want a dedicated, no-fuss tool to quickly create and manage templated Markdown journal entries within your existing developer environment, Work-Journal is for you. If you're looking for an all-encompassing knowledge management system, tools like Obsidian are strong contenders.

---

## 🗺️ Roadmap

Future enhancements under consideration:

- [ ] _No roadmap as of now_

---

## 📜 License

This project is licensed under the [Apache 2.0 License](LICENSE).
