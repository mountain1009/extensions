// CodeMirror theme bound to Muxy's CSS custom properties. All chrome colors are
// var(--muxy-*) so the editor follows the host theme automatically; the only
// JS branch is the { dark } flag, which flips CodeMirror's built-in syntax base
// (the one thing a CSS var can't express). The markdown preview is plain HTML
// themed purely in CSS — see .md-preview in styles.css.

import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";

export function muxy_cm_theme(is_dark: boolean): Extension {
  return EditorView.theme(
    {
      "&": {
        backgroundColor: "var(--muxy-background)",
        color: "var(--muxy-foreground)",
      },
      "&.cm-focused": { outline: "none" },
      ".cm-content": {
        fontFamily: '"SF Mono", Menlo, monospace',
      },
      ".cm-gutters": {
        backgroundColor: "var(--muxy-background)",
        // Line numbers recede: a dimmed blend of the muted foreground.
        color: "color-mix(in srgb, var(--muxy-foreground-muted) 55%, transparent)",
        border: "none",
        borderRight: "1px solid var(--muxy-border)",
      },
      ".cm-activeLine": { backgroundColor: "var(--muxy-hover)" },
      ".cm-activeLineGutter": {
        backgroundColor: "var(--muxy-hover)",
        // The current line's number pops to full strength.
        color: "var(--muxy-foreground)",
      },
      ".cm-lineNumbers .cm-gutterElement": {
        padding: "0 8px",
      },
      ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "var(--muxy-foreground)",
      },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
        {
          backgroundColor: "var(--muxy-accent-soft)",
        },
    },
    { dark: is_dark },
  );
}
