// Markdown editor = Preview | Edit over the shared CodeEditor. The mode toggle
// itself lives in the editor topbar (editor.tsx) for a single unified frame, so
// mode is a controlled prop here. Raw markdown is the source of truth — the
// buffer is just text edited in CodeEditor, no round-trip.
//
// Same EditorHandle contract as CodeEditor; getValue() delegates to the inner
// CodeEditor so editor.tsx's single Cmd+S path works unchanged. Leaving Edit
// snapshots the live source so Preview reflects in-progress edits.

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { CodeEditor } from "@/editor/code-editor";
import { MarkdownView } from "@/editor/markdown-view";
import type { EditorChildProps, EditorHandle } from "@/editor/editor";
import type { EditorConfig } from "@/hooks/use-editor-config";

export type MarkdownMode = "preview" | "edit";

interface MarkdownEditorProps extends EditorChildProps {
  filePath: string;
  config: EditorConfig;
  mode: MarkdownMode;
}

export const MarkdownEditor = forwardRef<EditorHandle, MarkdownEditorProps>(
  function MarkdownEditor({ value, isDark, filePath, config, mode, onDirty }, ref) {
    // Source shown in Preview. Seeded from the loaded value; refreshed from the
    // live CodeEditor buffer whenever we leave Edit.
    const [source, setSource] = useState(value);
    const codeRef = useRef<EditorHandle | null>(null);
    const prevMode = useRef<MarkdownMode>(mode);

    // Snapshot the live buffer when transitioning edit -> preview.
    useEffect(() => {
      if (prevMode.current === "edit" && mode === "preview" && codeRef.current) {
        setSource(codeRef.current.getValue());
      }
      prevMode.current = mode;
    }, [mode]);

    // Save reads the live buffer when editing, else the last snapshot.
    useImperativeHandle(
      ref,
      () => ({ getValue: () => codeRef.current?.getValue() ?? source }),
      [source],
    );

    if (mode === "preview") {
      return <MarkdownView source={source} fontSize={config.fontSize} />;
    }
    return (
      <CodeEditor
        ref={codeRef}
        filePath={filePath}
        value={source}
        isDark={isDark}
        config={config}
        onDirty={onDirty}
      />
    );
  },
);
