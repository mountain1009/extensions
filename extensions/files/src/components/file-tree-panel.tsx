import type { CSSProperties, MouseEvent } from "react";
import { useCallback, useEffect } from "react";
import { FileTree } from "@pierre/trees/react";
import type { FilesTreeOps } from "@/hooks/use-files-tree";
import { useFilesTree } from "@/hooks/use-files-tree";
import { FileContextMenu } from "@/components/file-context-menu";
import { basename } from "@/lib/files";

interface FileTreePanelProps {
  reloadKey: number;
  registerOps: (ops: FilesTreeOps | null) => void;
}

// Drive the @pierre/trees `*-override` custom properties from the live Muxy
// theme + sizing scale for a minimal, on-theme tree. These cascade into the
// tree's shadow root and update automatically when the Muxy theme changes (CSS
// variables inherit across the shadow boundary), so no JS re-render is needed.
const TREE_THEME_STYLE: CSSProperties = {
  // Colors → Muxy theme.
  "--trees-bg-override": "var(--muxy-background)",
  "--trees-fg-override": "var(--muxy-foreground)",
  "--trees-fg-muted-override": "var(--muxy-foreground-muted)",
  "--trees-bg-muted-override": "var(--muxy-surface)",
  "--trees-border-color-override": "var(--muxy-border)",
  "--trees-accent-override": "var(--muxy-accent)",
  "--trees-selected-bg-override": "var(--muxy-hover)",
  "--trees-selected-fg-override": "var(--muxy-foreground)",
  "--trees-selected-focused-border-color-override": "transparent",
  "--trees-focus-ring-width-override": "0px",
  "--trees-indent-guide-bg-override": "var(--muxy-border)",
  "--trees-scrollbar-thumb-override": "var(--muxy-border)",
  "--trees-git-ignored-color-override": "var(--muxy-foreground-muted)",
  // Sizing → our scale: smaller rows, body font, tighter indents.
  "--trees-item-height": "24px",
  "--trees-font-size-override": "var(--font-body)",
  "--trees-icon-width-override": "14px",
  "--trees-padding-inline-override": "var(--s3)",
  "--trees-item-padding-x-override": "var(--s3)",
  "--trees-item-margin-x-override": "var(--s1, 2px)",
  "--trees-level-gap-override": "var(--s5)",
  "--trees-border-radius-override": "var(--s2)",
} as CSSProperties;

function clicked_file_path(event: MouseEvent<HTMLElement>): string | null {
  if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return null;
  }

  for (const target of event.nativeEvent.composedPath()) {
    if (!(target instanceof HTMLElement)) continue;
    if (target.dataset.fileTreeContextMenuRoot === "true") return null;
    if (target.dataset.type === "context-menu-anchor" || target.dataset.type === "context-menu-trigger") {
      return null;
    }
    if (target.dataset.type !== "item") continue;
    if (target.dataset.itemType !== "file") return null;
    return target.dataset.itemPath ?? null;
  }

  return null;
}

export function FileTreePanel({ reloadKey, registerOps }: FileTreePanelProps) {
  const { model, ops } = useFilesTree(reloadKey, registerOps);

  const reopenSelectedFile = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const path = clicked_file_path(event);
      if (path == null) return;
      if (!model.getSelectedPaths().includes(path)) return;
      void ops.openInEditor(path);
    },
    [model, ops],
  );

  // Suppress the native webview context menu anywhere in the panel.
  useEffect(() => {
    const onContextMenu = (e: globalThis.MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", onContextMenu);
    return () => document.removeEventListener("contextmenu", onContextMenu);
  }, []);

  return (
    <div className="file-tree-wrap">
      <FileTree
        className="file-tree"
        style={TREE_THEME_STYLE}
        model={model}
        onClickCapture={reopenSelectedFile}
        renderContextMenu={(item, ctx) => (
          <FileContextMenu
            item={{ kind: item.kind, name: basename(item.path), path: item.path }}
            ops={ops}
            close={() => ctx.close()}
          />
        )}
      />
    </div>
  );
}
