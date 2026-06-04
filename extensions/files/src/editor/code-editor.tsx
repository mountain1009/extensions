// CodeMirror wrapper for non-markdown files. Presentational: the parent
// (editor.tsx) owns load/save/dirty and reads the current text through the
// imperative getValue() handle. We lazy-load the language grammar per file and
// theme via var(--muxy-*). @uiw/react-codemirror annotates programmatic value
// swaps as ExternalChange, so onChange fires on user edits only — safe to mark
// dirty there without a false positive on file switch.

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import CodeMirror from "@uiw/react-codemirror";
import { indentUnit } from "@codemirror/language";
import { EditorView, keymap } from "@codemirror/view";
import { Prec, type Extension } from "@codemirror/state";
import { search, searchKeymap, openSearchPanel } from "@codemirror/search";
import { muxy_cm_theme } from "@/lib/editor-theme";
import { muxy_highlight_style } from "@/lib/syntax-theme";
import { language_for } from "@/lib/languages";
import type { EditorChildProps, EditorHandle } from "@/editor/editor";
import type { EditorConfig } from "@/hooks/use-editor-config";

interface CodeEditorProps extends EditorChildProps {
  /** File path — drives which language grammar to load. */
  filePath: string;
  config: EditorConfig;
}

export const CodeEditor = forwardRef<EditorHandle, CodeEditorProps>(
  function CodeEditor({ value, isDark, filePath, config, onDirty, onSave }, ref) {
    // Live text, read synchronously on save. Seeded from the loaded value.
    const valueRef = useRef(value);
    const [lang, setLang] = useState<Extension | null>(null);
    // The live EditorView, captured on mount so the window-level Cmd+F handler
    // can open search even when focus sits outside the CodeMirror DOM.
    const viewRef = useRef<EditorView | null>(null);

    const openSearch = useCallback(() => {
      const view = viewRef.current;
      if (!view) return;
      openSearchPanel(view);
      view.focus();
    }, []);

    useImperativeHandle(
      ref,
      () => ({ getValue: () => valueRef.current, openSearch }),
      [openSearch],
    );

    // Open the find panel on Ctrl+F (Linux/Windows). On macOS Cmd+F is a Muxy
    // command shortcut (files-find) that never reaches the webview — editor.tsx
    // routes it here via the command subscription. The in-editor keymap only
    // fires while CodeMirror holds focus, so we also listen at the window in
    // capture phase, mirroring the Cmd+S path in editor.tsx.
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return;
        if (e.key.toLowerCase() !== "f") return;
        if (!viewRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        openSearch();
      };
      window.addEventListener("keydown", handler, true);
      return () => window.removeEventListener("keydown", handler, true);
    }, [openSearch]);

    // Lazy-load the grammar for this file; ignore a stale resolution if the
    // file changed before the dynamic import settled.
    useEffect(() => {
      let cancelled = false;
      setLang(null);
      void language_for(filePath).then((ext) => {
        if (!cancelled) setLang(ext);
      });
      return () => {
        cancelled = true;
      };
    }, [filePath]);

    const theme = useMemo(
      () =>
        EditorView.theme({
          "&": { fontSize: `${config.fontSize}px` },
          ".cm-scroller": { fontSize: `${config.fontSize}px` },
          ".cm-content": { fontFamily: '"SF Mono", Menlo, monospace' },
        }),
      [config.fontSize],
    );

    const extensions = useMemo(() => {
      const exts: Extension[] = [
        Prec.highest(
          keymap.of([
            {
              key: "Mod-s",
              preventDefault: true,
              run: () => {
                void onSave();
                return true;
              },
            },
            // Open the find panel. Bound at highest precedence so it wins over
            // the host webview's default Cmd+F before any panel is mounted.
            {
              key: "Mod-f",
              preventDefault: true,
              run: openSearchPanel,
            },
          ]),
        ),
        // Find/replace panel docked at the top; styled in muxy_cm_theme.
        search({ top: true }),
        keymap.of(searchKeymap),
        muxy_cm_theme(isDark),
        muxy_highlight_style(),
        theme,
        indentUnit.of(" ".repeat(config.tabSize)),
      ];
      if (config.wordWrap) exts.push(EditorView.lineWrapping);
      if (lang) exts.push(lang);
      return exts;
    }, [isDark, theme, config.tabSize, config.wordWrap, lang, onSave]);

    return (
      <CodeMirror
        className="editor-host"
        value={value}
        theme="none"
        height="100%"
        extensions={extensions}
        basicSetup={{
          lineNumbers: config.lineNumbers,
          foldGutter: false,
          tabSize: config.tabSize,
        }}
        onCreateEditor={(view) => {
          viewRef.current = view;
        }}
        onChange={(next) => {
          valueRef.current = next;
          onDirty();
        }}
      />
    );
  },
);
