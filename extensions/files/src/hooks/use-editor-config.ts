// Editor configuration, persisted globally (one localStorage key, shared across
// all files) and exposed as a small reactive store. Mirrors the git extension's
// localStorage-backed persistence pattern; JSON-encoded since we hold several
// fields rather than a single string.

import { useCallback, useEffect, useState } from "react";

export interface EditorConfig {
  fontSize: number;
  lineNumbers: boolean;
  wordWrap: boolean;
  tabSize: number;
}

export const DEFAULT_CONFIG: EditorConfig = {
  fontSize: 13,
  lineNumbers: true,
  wordWrap: false,
  tabSize: 2,
};

export const FONT_SIZE_MIN = 10;
export const FONT_SIZE_MAX = 24;

const STORAGE_KEY = "muxy.files.editor.config";

function load_config(): EditorConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<EditorConfig>;
    // Merge over defaults so a newly-added field is filled in for old saves.
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

// Cross-instance sync: the editor tab and a future settings surface (or a second
// editor tab) share one config. We broadcast changes via the storage event and
// a same-tab custom event so every mounted hook updates together.
const SYNC_EVENT = "muxy-files-editor-config";

export function use_editor_config() {
  const [config, setConfig] = useState<EditorConfig>(load_config);

  useEffect(() => {
    const reload = () => setConfig(load_config());
    window.addEventListener("storage", reload);
    window.addEventListener(SYNC_EVENT, reload);
    return () => {
      window.removeEventListener("storage", reload);
      window.removeEventListener(SYNC_EVENT, reload);
    };
  }, []);

  const update = useCallback((patch: Partial<EditorConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event(SYNC_EVENT));
      } catch {
        void 0;
      }
      return next;
    });
  }, []);

  return [config, update] as const;
}
