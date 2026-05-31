import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

export const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
export const extensionsDir = path.join(repoRoot, "extensions");

// The manifest schema is owned by the Muxy app repo (muxy-app/muxy). This repo no
// longer keeps a local copy; the tooling fetches it from there at validation time.
export const schemaURL =
  "https://raw.githubusercontent.com/muxy-app/muxy/main/docs/extensions/schema/manifest.schema.json";

export async function fetchSchema() {
  const res = await fetch(schemaURL);
  if (!res.ok) {
    throw new Error(`failed to fetch manifest schema from ${schemaURL} (HTTP ${res.status})`);
  }
  return res.json();
}

export function listExtensionNames() {
  if (!fs.existsSync(extensionsDir)) return [];
  return fs
    .readdirSync(extensionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();
}

export function extensionDir(name) {
  return path.join(extensionsDir, name);
}

export function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function resolveInside(baseDir, relative) {
  const resolved = path.resolve(baseDir, relative);
  const normalizedBase = path.resolve(baseDir) + path.sep;
  const inside = resolved === path.resolve(baseDir) || resolved.startsWith(normalizedBase);
  return { resolved, inside };
}
