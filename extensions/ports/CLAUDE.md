# ports

Muxy extension scaffolded from a starter kit. This is an npm + Vite project.

## Layout

- `package.json` — npm manifest. Identity (`name`, `version`) is at the
  top level; all Muxy fields live under the `muxy` key. A `build` script
  (Vite) is required.
- `vite.config.js` — builds to `dist/`, the directory Muxy installs.
- `panel/` + `src/` — your source. The kit ships a working panel, a topbar
  item, and a command; edit them or add your own.

Add a `"background"` script (e.g. `background.js`) under the `muxy` key
only if the extension needs to receive pushed workspace events or run
shell commands in the background. Muxy runs it as a long-lived process
that subscribes to events with `muxy.events.subscribe` and runs commands
with `muxy.exec`. Command, topbar, status bar, tab, and runScript
extensions need no background script.

## Building & editing

Install deps with `npm install`, then `npm run build` to produce
`dist/`. After rebuilding, click "Reload" in the Muxy Extensions modal to
pick up the changes. (`npm run dev` runs Vite's dev server for fast
iteration.)

## Skill

Coding agents in this directory should consult the `muxy-extension`
skill in `.claude/skills/` or `.agents/skills/` before generating
manifest or runtime changes.

<!-- headroom:rtk-instructions -->
# RTK (Rust Token Killer) - Token-Optimized Commands

When running shell commands, **always prefix with `rtk`**. This reduces context
usage by 60-90% with zero behavior change. If rtk has no filter for a command,
it passes through unchanged — so it is always safe to use.

## Key Commands
```bash
# Git (59-80% savings)
rtk git status          rtk git diff            rtk git log

# Files & Search (60-75% savings)
rtk ls <path>           rtk read <file>         rtk grep <pattern>
rtk find <pattern>      rtk diff <file>

# Test (90-99% savings) — shows failures only
rtk pytest tests/       rtk cargo test          rtk test <cmd>

# Build & Lint (80-90% savings) — shows errors only
rtk tsc                 rtk lint                rtk cargo build
rtk prettier --check    rtk mypy                rtk ruff check

# Analysis (70-90% savings)
rtk err <cmd>           rtk log <file>          rtk json <file>
rtk summary <cmd>       rtk deps                rtk env

# GitHub (26-87% savings)
rtk gh pr view <n>      rtk gh run list         rtk gh issue list

# Infrastructure (85% savings)
rtk docker ps           rtk kubectl get         rtk docker logs <c>

# Package managers (70-90% savings)
rtk pip list            rtk pnpm install        rtk npm run <script>
```

## Rules
- In command chains, prefix each segment: `rtk git add . && rtk git commit -m "msg"`
- For debugging, use raw command without rtk prefix
- `rtk proxy <cmd>` runs command without filtering but tracks usage
<!-- /headroom:rtk-instructions -->
