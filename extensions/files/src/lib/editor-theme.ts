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
      // Search-match highlights: a soft accent fill, the active match stronger.
      ".cm-searchMatch": {
        backgroundColor: "var(--muxy-accent-soft)",
        outline:
          "1px solid color-mix(in srgb, var(--muxy-accent) 45%, transparent)",
      },
      ".cm-searchMatch.cm-searchMatch-selected": {
        backgroundColor:
          "color-mix(in srgb, var(--muxy-accent) 40%, transparent)",
      },
      // The find/replace panel, themed to match Muxy chrome rather than CM's
      // default OS-grey. It docks at the top of the editor (top: true below).
      ".cm-panels": {
        backgroundColor: "var(--muxy-background)",
        color: "var(--muxy-foreground)",
      },
      ".cm-panels.cm-panels-top": {
        borderBottom: "1px solid var(--muxy-border)",
      },
      ".cm-search": {
        padding: "8px 10px",
        fontFamily: "inherit",
      },
      ".cm-search label": {
        fontSize: "12px",
        color: "var(--muxy-foreground-muted)",
      },
      ".cm-textfield": {
        backgroundColor: "var(--muxy-surface)",
        color: "var(--muxy-foreground)",
        border: "1px solid var(--muxy-border)",
        borderRadius: "5px",
        padding: "3px 6px",
      },
      ".cm-textfield:focus": {
        outline: "none",
        borderColor: "var(--muxy-accent)",
      },
      ".cm-button": {
        backgroundColor: "var(--muxy-surface)",
        backgroundImage: "none",
        color: "var(--muxy-foreground)",
        border: "1px solid var(--muxy-border)",
        borderRadius: "5px",
        padding: "3px 8px",
      },
      ".cm-button:hover": {
        backgroundColor: "var(--muxy-hover)",
      },
      ".cm-panel button[name=close]": {
        color: "var(--muxy-foreground-muted)",
        fontSize: "18px",
      },
    },
    { dark: is_dark },
  );
}
