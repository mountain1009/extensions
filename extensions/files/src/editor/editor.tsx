import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Ref,
} from "react";
import {
  basename,
  error_message,
  open_externally,
  reveal_in_finder,
  try_action,
} from "@/lib/files";
import { is_markdown } from "@/lib/languages";
import { CodeEditor } from "@/editor/code-editor";
import { MarkdownEditor, type MarkdownMode } from "@/editor/markdown-editor";
import { SettingsSheet } from "@/editor/settings-sheet";
import {
  SaveIcon,
  RevealIcon,
  OpenIcon,
  SettingsIcon,
} from "@/editor/icons";
import { use_editor_config } from "@/hooks/use-editor-config";

/** Imperative handle every editor child exposes so save() is editor-agnostic. */
export interface EditorHandle {
  getValue(): string;
}

/** Props shared by both editor children. */
export interface EditorChildProps {
  value: string;
  isDark: boolean;
  onDirty: () => void;
}

interface EditorData {
  filePath?: string;
}

function read_data(): EditorData {
  return (window.muxy?.data ?? {}) as EditorData;
}

export function Editor() {
  const [data, setData] = useState<EditorData>(read_data);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDark, setIsDark] = useState(
    () => muxy.theme?.colorScheme === "dark",
  );
  const [showSettings, setShowSettings] = useState(false);
  const [mdMode, setMdMode] = useState<MarkdownMode>("preview");
  const [config, updateConfig] = use_editor_config();

  // The mounted child reassigns this ref; save() reads whichever is live.
  const editorRef = useRef<EditorHandle | null>(null);

  // Keep local state in sync with the tab's pushed data.
  useEffect(() => {
    const unsubscribe = muxy.onDataChange((next) => {
      setData((next ?? {}) as EditorData);
    });
    return unsubscribe;
  }, []);

  // Follow the host theme; the editors need only the light/dark base flag.
  useEffect(() => {
    const unsubscribe = muxy.onThemeChange((theme) => {
      setIsDark(theme.colorScheme === "dark");
    });
    return unsubscribe;
  }, []);

  const { filePath } = data;

  // Load the file whenever the target path changes. A freshly loaded file is
  // clean; both editors avoid firing onDirty on programmatic value/remount.
  useEffect(() => {
    if (!filePath) {
      setContent(null);
      setError(null);
      setLoading(false);
      setDirty(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    muxy.files
      .read(filePath)
      .then((file) => {
        if (cancelled) return;
        setContent(file.content);
        setDirty(false);
        setMdMode("preview");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setContent(null);
        setError(error_message(err));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filePath]);

  const markDirty = useCallback(() => setDirty(true), []);

  // Explicit save only — never autosave, so we don't race the file.changed watcher.
  const onSave = useCallback(async () => {
    if (!filePath || !editorRef.current || saving) return;
    const next = editorRef.current.getValue();
    setSaving(true);
    const ok = await try_action(
      () => muxy.files.write(filePath, next),
      "Save failed",
    );
    setSaving(false);
    if (ok) setDirty(false);
  }, [filePath, saving]);

  // Cmd/Ctrl+S anywhere in the tab webview.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void onSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSave]);

  const onReveal = useCallback(() => {
    if (filePath) void reveal_in_finder(filePath);
  }, [filePath]);

  const onOpen = useCallback(() => {
    if (filePath) void open_externally(filePath);
  }, [filePath]);

  if (!filePath) {
    return (
      <div className="editor">
        <div className="editor-empty">No file open</div>
      </div>
    );
  }

  const markdown = is_markdown(filePath);

  return (
    <div className="editor">
      <div className="topbar">
        <div className="editor-title">
          <span className="editor-name">{basename(filePath)}</span>
          {dirty ? <span className="editor-dirty" aria-label="Unsaved" /> : null}
        </div>
        <div className="toolbar-actions">
          {markdown ? (
            <>
              <div className="segmented topbar-segmented" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mdMode === "preview"}
                  className={`segment${mdMode === "preview" ? " segment-active" : ""}`}
                  onClick={() => setMdMode("preview")}
                >
                  Preview
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mdMode === "edit"}
                  className={`segment${mdMode === "edit" ? " segment-active" : ""}`}
                  onClick={() => setMdMode("edit")}
                >
                  Edit
                </button>
              </div>
              <span className="toolbar-divider" />
            </>
          ) : null}
          <button
            className={`tool-button${dirty ? " tool-button-accent" : ""}`}
            type="button"
            aria-label="Save"
            title="Save"
            disabled={!dirty || saving}
            onClick={() => void onSave()}
          >
            <SaveIcon />
          </button>
          <button
            className="tool-button"
            type="button"
            aria-label="Reveal in Finder"
            title="Reveal in Finder"
            onClick={onReveal}
          >
            <RevealIcon />
          </button>
          <button
            className="tool-button"
            type="button"
            aria-label="Open externally"
            title="Open externally"
            onClick={onOpen}
          >
            <OpenIcon />
          </button>
          <span className="toolbar-divider" />
          <button
            className="tool-button"
            type="button"
            aria-label="Editor settings"
            title="Editor settings"
            onClick={() => setShowSettings(true)}
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
      <div className="editor-body">
        {loading ? (
          <div className="editor-status">Loading…</div>
        ) : error ? (
          <div className="editor-status editor-error">{error}</div>
        ) : content === null ? null : markdown ? (
          <MarkdownEditor
            key={filePath}
            ref={editorRef as Ref<EditorHandle>}
            filePath={filePath}
            value={content}
            isDark={isDark}
            config={config}
            mode={mdMode}
            onDirty={markDirty}
          />
        ) : (
          <CodeEditor
            ref={editorRef as Ref<EditorHandle>}
            filePath={filePath}
            value={content}
            isDark={isDark}
            config={config}
            onDirty={markDirty}
          />
        )}
      </div>
      {showSettings ? (
        <SettingsSheet
          config={config}
          update={updateConfig}
          onClose={() => setShowSettings(false)}
        />
      ) : null}
    </div>
  );
}

