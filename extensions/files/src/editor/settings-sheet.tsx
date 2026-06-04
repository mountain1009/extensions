// Editor settings sheet — slides in from the right edge. There is no Muxy modal
// primitive, so this is a plain overlay + side panel rendered into the tab.
// Changes write straight through to the persisted config (use_editor_config), so
// there is no apply/cancel — edits take effect live and survive reloads.

import { useEffect } from "react";
import {
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  type EditorConfig,
} from "@/hooks/use-editor-config";

interface SettingsSheetProps {
  config: EditorConfig;
  update: (patch: Partial<EditorConfig>) => void;
  onClose: () => void;
}

const TAB_SIZES = [2, 4, 8];

export function SettingsSheet({ config, update, onClose }: SettingsSheetProps) {
  // Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const setFont = (n: number) =>
    update({ fontSize: Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, n)) });

  return (
    <div className="sheet-overlay" onMouseDown={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-label="Editor settings"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sheet-header">
          <span className="sheet-title">Editor settings</span>
          <button className="button" type="button" onClick={onClose}>
            Done
          </button>
        </div>

        <div className="sheet-row">
          <label className="sheet-label">Font size</label>
          <div className="stepper">
            <button
              className="button stepper-btn"
              type="button"
              onClick={() => setFont(config.fontSize - 1)}
              disabled={config.fontSize <= FONT_SIZE_MIN}
            >
              −
            </button>
            <span className="stepper-value">{config.fontSize}px</span>
            <button
              className="button stepper-btn"
              type="button"
              onClick={() => setFont(config.fontSize + 1)}
              disabled={config.fontSize >= FONT_SIZE_MAX}
            >
              +
            </button>
          </div>
        </div>

        <div className="sheet-row">
          <label className="sheet-label" htmlFor="cfg-line-numbers">
            Line numbers
          </label>
          <input
            id="cfg-line-numbers"
            type="checkbox"
            checked={config.lineNumbers}
            onChange={(e) => update({ lineNumbers: e.target.checked })}
          />
        </div>

        <div className="sheet-row">
          <label className="sheet-label" htmlFor="cfg-word-wrap">
            Word wrap
          </label>
          <input
            id="cfg-word-wrap"
            type="checkbox"
            checked={config.wordWrap}
            onChange={(e) => update({ wordWrap: e.target.checked })}
          />
        </div>

        <div className="sheet-row">
          <label className="sheet-label">Tab size</label>
          <div className="segmented">
            {TAB_SIZES.map((n) => (
              <button
                key={n}
                type="button"
                className={`segment${config.tabSize === n ? " segment-active" : ""}`}
                onClick={() => update({ tabSize: n })}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
