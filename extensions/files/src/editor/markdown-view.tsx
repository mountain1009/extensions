// Rendered markdown preview. react-markdown + GFM (tables, task lists,
// strikethrough, autolinks). Fenced code blocks are syntax-highlighted with the
// same theme-derived palette as the editor (see preview-highlight + syntax-theme).
// All styling lives in styles.css under .md-preview using var(--muxy-*), so it
// follows the host theme. Read-only render; editing happens in CodeEditor.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { highlight_code, type HighlightPart } from "@/lib/preview-highlight";
import { ensure_preview_highlight_css } from "@/lib/syntax-theme";
import { split_frontmatter } from "@/lib/frontmatter";

function language_of(className?: string): string | null {
  const match = /language-([\w-]+)/.exec(className ?? "");
  return match ? match[1] : null;
}

/** A fenced code block: highlighted async, falls back to plain text meanwhile. */
function CodeBlock({ code, lang }: { code: string; lang: string | null }) {
  const [parts, setParts] = useState<HighlightPart[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void highlight_code(code, lang).then((next) => {
      if (!cancelled) setParts(next);
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  return (
    <code>
      {parts
        ? parts.map((p, i) =>
            p.cls ? (
              <span key={i} className={p.cls}>
                {p.text}
              </span>
            ) : (
              p.text
            ),
          )
        : code}
    </code>
  );
}

export function MarkdownView({
  source,
  fontSize,
}: {
  source: string;
  fontSize: number;
}) {
  // Inject the preview's syntax classes once (generated from the shared spec).
  useEffect(() => {
    ensure_preview_highlight_css();
  }, []);

  // Peel YAML frontmatter into a properties table; render the body below.
  const { fields, body } = useMemo(() => split_frontmatter(source), [source]);

  return (
    <div
      className="editor-host md-preview"
      style={{ fontSize: `${fontSize}px` }}
    >
      {fields.length > 0 ? (
        <dl className="md-frontmatter">
          {fields.map((f) => (
            <div className="md-frontmatter-row" key={f.key}>
              <dt>{f.key}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, node, ...props }) {
            // Block code (inside <pre>) gets highlighted; inline code stays plain.
            const isBlock = className?.includes("language-");
            if (!isBlock) {
              return <code {...props}>{children as ReactNode}</code>;
            }
            const text = String(children).replace(/\n$/, "");
            return <CodeBlock code={text} lang={language_of(className)} />;
          },
        }}
      >
        {body}
      </Markdown>
    </div>
  );
}
