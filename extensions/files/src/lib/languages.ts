// File-type detection for the editor tab. Two concerns:
//   1. is_markdown — route markdown files to the WYSIWYG (Milkdown) editor.
//   2. language_for — lazy-load a CodeMirror grammar for everything else.
// Grammars are loaded on demand via @codemirror/language-data's dynamic imports,
// so each language lands in its own Vite chunk and only ships when first opened.

import { LanguageDescription, type LanguageSupport } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import type { Extension } from "@codemirror/state";
import { basename } from "@/lib/files";

const MARKDOWN_EXT = new Set([".md", ".markdown", ".mdx"]);

/** Does this path get the WYSIWYG markdown editor rather than CodeMirror? */
export function is_markdown(path: string): boolean {
  const name = basename(path).toLowerCase();
  const dot = name.lastIndexOf(".");
  return dot !== -1 && MARKDOWN_EXT.has(name.slice(dot));
}

/**
 * Resolve a CodeMirror language extension for a file, lazy-loading its grammar.
 * Returns null when no language matches (plain-text editing still works).
 */
export async function language_for(path: string): Promise<Extension | null> {
  const desc = LanguageDescription.matchFilename(languages, basename(path));
  if (!desc) return null;
  return desc.load();
}

/**
 * Resolve a grammar from a markdown fence's language token (e.g. "js", "python",
 * "ts"). Returns the loaded LanguageSupport so the preview can parse + highlight
 * the code, or null when the name is unknown.
 */
export async function language_for_name(
  name: string,
): Promise<LanguageSupport | null> {
  const desc =
    LanguageDescription.matchLanguageName(languages, name, true) ??
    LanguageDescription.matchFilename(languages, `x.${name.toLowerCase()}`);
  if (!desc) return null;
  return desc.load();
}
