// Syntax highlighting derived from Muxy's chrome theme vars. Extension webviews
// only receive the 8 --muxy-* chrome vars — Muxy's real syntax palette is
// computed Swift-side and isn't reachable here — so we build a tasteful palette
// from what we have using color-mix(). Because every color is a var(--muxy-*),
// the highlighting follows the host theme automatically and re-derives when it
// flips light/dark (CSS resolves the vars live; no JS recompute needed).
//
// The same Highlighter drives both the CodeMirror editor (via syntaxHighlighting)
// and the markdown preview's fenced code blocks (via highlightCode) so they match.

import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { tags as t, type Tag } from "@lezer/highlight";

// color-mix helpers — kept here so the palette reads declaratively below.
const mix = (a: string, b: string, pct: number) =>
  `color-mix(in srgb, ${a} ${pct}%, ${b})`;

const ACCENT = "var(--muxy-accent)";
const FG = "var(--muxy-foreground)";
const MUTED = "var(--muxy-foreground-muted)";

// Derived hues. With only accent + greys to work from we lean on accent
// variations and weight/emphasis rather than a wide rainbow.
const KEYWORD = ACCENT;
const STRING = mix(ACCENT, FG, 45); // softer than pure accent
const NUMBER = mix(ACCENT, FG, 70);
const COMMENT = MUTED;
const FUNCTION = mix(ACCENT, FG, 85);
const TYPE = mix(ACCENT, FG, 60);
const CONSTANT = mix(ACCENT, FG, 75);
const PUNCT = MUTED;

interface SyntaxRule {
  tag: Tag | readonly Tag[];
  color?: string;
  fontStyle?: string;
  fontWeight?: string;
  textDecoration?: string;
}

/**
 * The shared highlight specification (an array of tag→style rules). Exported so
 * the preview can build a Highlighter from the same source of truth.
 */
export const SYNTAX_SPEC: SyntaxRule[] = [
  { tag: [t.keyword, t.modifier, t.controlKeyword, t.operatorKeyword], color: KEYWORD },
  { tag: [t.string, t.special(t.string), t.regexp], color: STRING },
  { tag: [t.escape, t.character], color: mix(ACCENT, FG, 55) },
  { tag: [t.number, t.bool, t.integer, t.float], color: NUMBER },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: COMMENT, fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.macroName], color: FUNCTION },
  { tag: [t.typeName, t.className, t.namespace], color: TYPE },
  { tag: [t.constant(t.variableName), t.standard(t.name), t.atom], color: CONSTANT },
  { tag: [t.definitionKeyword, t.self], color: KEYWORD },
  { tag: [t.propertyName, t.attributeName], color: mix(ACCENT, FG, 80) },
  { tag: [t.tagName], color: KEYWORD },
  { tag: [t.attributeValue], color: STRING },
  { tag: [t.punctuation, t.separator, t.bracket, t.operator], color: PUNCT },
  { tag: [t.meta, t.processingInstruction], color: MUTED },
  { tag: [t.link], color: ACCENT, textDecoration: "underline" },
  { tag: [t.heading], color: FG, fontWeight: "bold" },
  { tag: [t.strong], fontWeight: "bold" },
  { tag: [t.emphasis], fontStyle: "italic" },
  { tag: [t.strikethrough], textDecoration: "line-through" },
  { tag: [t.invalid], color: "var(--muxy-diff-remove, var(--muxy-foreground))" },
];

/** CodeMirror editor extension: theme-driven syntax highlighting. */
export function muxy_highlight_style(): Extension {
  return syntaxHighlighting(HighlightStyle.define(SYNTAX_SPEC));
}

// --- Preview parity ---------------------------------------------------------
// The markdown preview highlights fenced blocks with the SAME spec, emitting
// `tok-<i>` classes (one per SYNTAX_SPEC rule). We generate their CSS from the
// same spec so editor and preview never drift. Injected once by the preview.

const PREVIEW_STYLE_ID = "muxy-files-syntax";

export function ensure_preview_highlight_css(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(PREVIEW_STYLE_ID)) return;
  const css = SYNTAX_SPEC.map((rule, i) => {
    const decls: string[] = [];
    if (rule.color) decls.push(`color: ${rule.color}`);
    if (rule.fontStyle) decls.push(`font-style: ${rule.fontStyle}`);
    if (rule.fontWeight) decls.push(`font-weight: ${rule.fontWeight}`);
    if (rule.textDecoration) decls.push(`text-decoration: ${rule.textDecoration}`);
    return `.md-preview .tok-${i}{${decls.join(";")}}`;
  }).join("\n");
  const style = document.createElement("style");
  style.id = PREVIEW_STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);
}
