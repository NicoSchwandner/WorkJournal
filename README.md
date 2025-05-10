# 🗒️ Work-Journal

_Generate, organise, and reflect on your work journal—cross-platform, open-source, zero-friction._

---

## Why?

Keeping a lightweight text journal helps you…

- stay focussed instead of juggling half-finished tasks in your head
- surface blockers early and record decisions for future you
- give crystal-clear stand-up updates without scrolling Slack history
- see long-term progress (weekly / quarterly reflections)

Traditional "note apps" feel heavy, manual, or vendor-locked.  
**Work-Journal** lives in plain Markdown, plays nicely with Git, and automates the boring bits.

---

## Quick Start

> **Node 18 +** is the only runtime requirement.

### Option A — _no tooling at all_

```bash
git clone --depth 1 https://github.com/<you>/work-journal.git
cp work-journal/templates/daily_template.md .
# open in any editor, start writing
```

### Option B — _auto-generate today's entry_

```bash
# one-shot (no global install)
npx work-journal new           # creates Journal/2025/05/2025-05-02.md

# or add a VS Code task
```

`.vscode/tasks.json`

```jsonc
{
  "label": "Journal: New Entry",
  "type": "shell",
  "command": "npx work-journal new",
  "presentation": { "reveal": "never" }
}
```

Hit <kbd>⌘⇧B</kbd> (or your build key) and the file opens ready for typing.

---

## Features

| ✔   | What                             | Notes                                                          |
| --- | -------------------------------- | -------------------------------------------------------------- |
| ✅  | **Template engine**              | Daily, weekly, monthly, quarterly, yearly                      |
| ✅  | **Three-level lookup**           | `./templates/` → `~/.config/work-journal/` → packaged defaults |
| ✅  | **Cross-platform**               | Works on macOS, Linux, Windows (no Bash)                       |
| ✅  | **Configurable vacation cutoff** | `work-journal config set vacationStartDay 17`                  |
| 🏗   | **Binary release**               | Planned (skip for v1)                                          |
| 🏗   | **Custom placeholder variables** | Road-mapped                                                    |

---

## Placeholder Reference

| Token        | Example      | Description            |
| ------------ | ------------ | ---------------------- |
| `$date`      | `2025-05-02` | ISO date (local TZ)    |
| `$week`      | `18`         | ISO-8601 week number   |
| `$monthName` | `May`        | Localised long month   |
| `$quarter`   | `2`          | Calendar quarter (1-4) |
| `$year`      | `2025`       | Four-digit year        |

---

## Repository Layout

```
work-journal/
├─ templates/          # default Markdown templates
├─ packages/
│   └─ cli/            # TypeScript CLI (published as "work-journal")
├─ .cursor/rules/      # Cursor AI coding rules
├─ .github/workflows/  # CI matrix & release
└─ README.md
```

---

## Developing & Testing

```bash
pnpm install
pnpm -r run build      # compile CLI
pnpm test              # Vitest unit + integration suite
```

GitHub Actions runs the same tests on Ubuntu, macOS, and Windows with Node 18 & 20.

---

## Contributing

1. Fork & create a feature branch.
2. Make your changes and add a changeset:
   - Interactive mode: `pnpm changeset`
   - Non-interactive: `./create-changeset.sh work-journal patch "Description of your change"`
3. Add or update tests.
4. Open a PR — CI must pass before merge.

Once merged to main, the GitHub Actions workflow will:

1. Detect any changeset files and create a Version Package PR
2. When that PR is merged, automatically publish the package to npm

### Release Process

We use [Changesets](https://github.com/changesets/changesets) to manage versioning and publishing:

1. When making a change, create a changeset file using one of these commands:

   - `pnpm changeset` - Interactive mode
   - `pnpm run changeset:patch` - Non-interactive patch version bump with default message
   - `pnpm run changeset:minor` - Non-interactive minor version bump with default message
   - `pnpm run changeset:major` - Non-interactive major version bump with default message
   - `./create-changeset.sh work-journal patch "Your specific message"` - Custom message

2. Commit the generated file in `.changeset/` with your changes

3. On merge to main, a GitHub Action will automatically:
   - Use the changesets to determine the next version
   - Create a PR to update all package versions
   - When that PR is merged, publish packages to npm

---

## Roadmap

- [ ] Bundle single-file binaries via `pkg`
- [ ] Internationalisation (date format + template language)
- [ ] Optional daily cron GitHub Action that PRs tomorrow's entry
- [ ] Editor snippets for JetBrains / Vim

---

## Licence

[Apache 2.0](LICENSE)
