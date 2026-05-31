# Contributing an extension

Thanks for building for Muxy. This guide takes you from idea to a merged,
published extension.

## 1. Fork and scaffold

Fork this repo, then copy the starter into the `extensions/` folder. The
directory name **must** equal `manifest.name` (letters, digits, dash,
underscore, dot; no leading dot).

> **Don't full-clone.** This repo holds every published extension and grows
> large over time. Use a partial + sparse checkout so you only download your own
> extension and the tooling:
>
> ```bash
> git clone --filter=blob:none --sparse https://github.com/muxy-app/extensions
> cd extensions
> git sparse-checkout set extensions/my-extension scripts schema examples
> ```

```bash
cp -R examples/hello-world extensions/my-extension
# edit extensions/my-extension/manifest.json → "name": "my-extension"
```

Keep the `"$schema"` line at the top of `manifest.json` — it gives editors
autocomplete and inline validation against
[`schema/manifest.schema.json`](schema/manifest.schema.json). The Muxy app
ignores it.

## 2. Build it

An extension is a directory with a `manifest.json` and its resources (tab /
panel / popover HTML, an optional `background.js`, `runScript` scripts, icons,
assets). Two surfaces are available:

- **UI pages** (tabs, panels, popovers) get the full `window.muxy` API.
- **`background.js`** (optional) gets a small `muxy` global for events and shell
  commands.

The complete author guide — every manifest field, the `window.muxy` API,
permissions, and theming — ships inside Muxy and is mirrored at
[muxy.app](https://muxy.app). Follow it; CI enforces the same rules the app does.

### Rules CI enforces

- `manifest.json` matches [`schema/manifest.schema.json`](schema/manifest.schema.json).
- Directory name equals `manifest.name`.
- Every referenced file (`background`, tab/panel/popover `entry`, command
  `script`, SVG icons) exists and stays inside your directory.
- Commands reference real `tabTypes` / `panels` / `popovers`; topbar and status
  bar items reference real commands.
- IDs and setting keys are unique.
- A `README.md` is present.
- A **`marketplace` block** is present with a **listing icon** and **at least one
  screenshot** (see §4) — both are required for the store listing.

### Advisory checks (surfaced to reviewers)

Use of `commands:exec`, network calls (`fetch`, `WebSocket`, …), `eval`, and
minified/obfuscated code are flagged for human review. Ship **readable source**
and declare only the permissions you actually use.

## 3. Validate locally

```bash
npm install
node scripts/validate.mjs my-extension     # one extension
node scripts/validate.mjs                   # all extensions
node scripts/pack.mjs --dry-run my-extension  # prove it zips + see its hash
```

## 4. Listing metadata, icon, and screenshots (required)

Every extension must carry a `marketplace` block in `manifest.json` with a
**listing icon** and **at least one screenshot**. CI rejects PRs without them.

```json
"marketplace": {
  "author": "Your Name",
  "github": "your-handle",
  "homepage": "https://example.com",
  "repository": "https://github.com/you/your-ext",
  "categories": ["git", "productivity"],
  "icon": "assets/icon.svg",
  "screenshots": ["assets/screenshot-1.png", "assets/screenshot-2.png"]
}
```

This block is used only for the marketplace listing; the app loader ignores it.

### Icon — required

- **SVG (preferred)**, or a **square PNG at least 256×256**.
- Size limits: SVG ≤ 512 KB, PNG ≤ 1 MB.

### Screenshots — at least one required

- **PNG, exactly 1600×1000 (16:10)** — Muxy's window aspect.
- 1 to 6 screenshots, each ≤ 3 MB.

The icon and screenshots are uploaded to the marketplace alongside your signed
extension, each with its own SHA-256.

## 5. Write a good README

Each extension also needs a `README.md` with:

- A one or two sentence description.
- The permissions it uses and why.
- (Optional) an embedded screenshot/GIF for readers browsing the repo.

## 6. Open a pull request

Push your branch and open a PR. Fill in the PR template. CI runs validation; a
Muxy maintainer reviews for safety and quality, then merges. On merge, your
extension is packaged, hashed, signed into the index, and listed.

## Versioning

Published versions are **immutable**. To change an extension after it is merged,
bump `manifest.version` — the previous version's bytes and hash never change, so
already-installed users are never surprised.

## Updating an existing extension

Open a PR that bumps `version` and changes the files. The same review and
publish flow applies.

## Removing an extension

Open a PR deleting the `extensions/<name>/` directory, or file a
[report](.github/ISSUE_TEMPLATE/report-extension.yml) if it is not yours and
should be taken down.
