// CodeMirror wrapper for non-markdown files. Presentational: the parent
// (editor.tsx) owns load/save/dirty and reads the current text through the
// imperative getValue() handle. We lazy-load the language grammar per file and
// theme via var(--muxy-*). @uiw/react-codemirror annotates programmatic value
// swaps as ExternalChange, so onChange fires on user edits only — safe to mark
// dirty there without a false positive on file switch.

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import CodeMirror from "@uiw/react-codemirror";
import { indentUnit } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
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
  function CodeEditor({ value, isDark, filePath, config, onDirty }, ref) {
    // Live text, read synchronously on save. Seeded from the loaded value.
    const valueRef = useRef(value);
    const [lang, setLang] = useState<Extension | null>(null);

    useImperativeHandle(ref, () => ({ getValue: () => valueRef.current }), []);

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
        muxy_cm_theme(isDark),
        muxy_highlight_style(),
        theme,
        indentUnit.of(" ".repeat(config.tabSize)),
      ];
      if (config.wordWrap) exts.push(EditorView.lineWrapping);
      if (lang) exts.push(lang);
      return exts;
    }, [isDark, theme, config.tabSize, config.wordWrap, lang]);

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
        onChange={(next) => {
          valueRef.current = next;
          onDirty();
        }}
      />
    );
  },
);
