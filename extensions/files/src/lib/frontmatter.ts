// Split YAML frontmatter (a leading `---` … `---` block) off a markdown source.
// react-markdown / remark-gfm don't parse frontmatter, so we peel it here: the
// preview renders the parsed key/values as a properties table, then the body
// below. Parsing is tolerant — malformed YAML just falls back to "no
// frontmatter" so the raw `---` block renders as ordinary markdown.

import { parse as parseYaml } from "yaml";

export interface FrontmatterField {
  key: string;
  value: string;
}

export interface SplitDocument {
  fields: FrontmatterField[];
  body: string;
}

// Leading `---\n … \n---` at the very start of the file. Tolerates CRLF and a
// trailing newline after the closing fence.
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** Render a parsed YAML value as a compact one-line string for the table. */
function format_value(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(format_value).join(", ");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${format_value(v)}`)
      .join(", ");
  }
  return String(value);
}

export function split_frontmatter(source: string): SplitDocument {
  const match = FRONTMATTER_RE.exec(source);
  if (!match) return { fields: [], body: source };

  try {
    const data = parseYaml(match[1]) as unknown;
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { fields: [], body: source };
    }
    const fields = Object.entries(data as Record<string, unknown>).map(
      ([key, value]) => ({ key, value: format_value(value) }),
    );
    return { fields, body: source.slice(match[0].length) };
  } catch {
    // Malformed YAML — leave the source untouched.
    return { fields: [], body: source };
  }
}
