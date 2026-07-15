import type { ReactNode } from "react";

/** Renders inline **bold** and `code` within a line of assistant text. */
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*|`([^`]+)`/g;
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[1] !== undefined) {
      nodes.push(
        <strong key={key++} className="font-semibold text-foreground">
          {match[1]}
        </strong>,
      );
    } else if (match[2] !== undefined) {
      nodes.push(
        <code
          key={key++}
          className="rounded bg-surface px-1 py-0.5 font-mono text-[0.85em] tnum"
          dir="ltr"
        >
          {match[2]}
        </code>,
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/**
 * Minimal, dependency-free Markdown renderer scoped to what the assistant
 * emits: paragraphs, bullet / numbered lists, and inline bold / code. Text is
 * rendered as React nodes (never dangerouslySetInnerHTML), so it's injection-safe.
 */
export function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flush = () => {
    if (!list) return;
    const items = list.items.map((it, i) => (
      <li key={i} className="leading-relaxed">
        {renderInline(it)}
      </li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={key++} className="ms-4 list-decimal space-y-1 ps-1">
          {items}
        </ol>
      ) : (
        <ul key={key++} className="ms-1 list-disc space-y-1 ps-4 marker:text-subtle-foreground">
          {items}
        </ul>
      ),
    );
    list = null;
  };

  for (const line of lines) {
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (bullet) {
      if (!list || list.ordered) {
        flush();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1]);
    } else if (numbered) {
      if (!list || !list.ordered) {
        flush();
        list = { ordered: true, items: [] };
      }
      list.items.push(numbered[1]);
    } else {
      flush();
      if (line.trim() !== "") {
        blocks.push(
          <p key={key++} className="leading-relaxed">
            {renderInline(line)}
          </p>,
        );
      }
    }
  }
  flush();

  return <div className="space-y-2">{blocks}</div>;
}
