// Highlight fenced code blocks in the markdown preview, reusing the SAME tag set
// as the editor (SYNTAX_SPEC) so colors match. We emit stable class names
// (tok-<scope>) which are colored in styles.css with the same color-mix(--muxy-*)
// values used by the editor's HighlightStyle — one visual source of truth.
//
// Grammar loading is async (lazy per language), so highlight_code returns a
// promise of HTML-fragment parts. The caller renders the spans.

import { highlightCode, tagHighlighter, type Tag } from "@lezer/highlight";
import { language_for_name } from "@/lib/languages";
import { SYNTAX_SPEC } from "@/lib/syntax-theme";

// Map each SYNTAX_SPEC entry's tags to a class name. The class is derived from
// the rule index so it stays in lockstep with the spec without a second list.
const highlighter = tagHighlighter(
  SYNTAX_SPEC.map((rule, i) => ({
    tag: rule.tag as Tag | readonly Tag[],
    class: `tok-${i}`,
  })),
);

export interface HighlightPart {
  text: string;
  cls: string;
}

/**
 * Highlight `code` for the given markdown fence language. Returns ordered parts
 * (text + class). When no grammar matches, returns a single unclassed part so
 * the caller can render it as-is.
 */
export async function highlight_code(
  code: string,
  lang: string | null,
): Promise<HighlightPart[]> {
  const support = lang ? await language_for_name(lang) : null;
  if (!support) return [{ text: code, cls: "" }];

  const tree = support.language.parser.parse(code);
  const parts: HighlightPart[] = [];
  highlightCode(
    code,
    tree,
    highlighter,
    (text, classes) => parts.push({ text, cls: classes }),
    () => parts.push({ text: "\n", cls: "" }),
  );
  return parts;
}
