"use client";

import type { ReactNode } from "react";
import type { ProblemApiDto } from "@/lib/leetcode/normalize";
import { Badge, DifficultyBadge, TopicBadge } from "@/components/ui/Badge";

function formatAcRate(acRate: number | null): string | null {
  if (acRate == null || !Number.isFinite(acRate)) return null;
  return `${acRate.toFixed(1)}% AC`;
}

type Block =
  | { kind: "para"; lines: string[] }
  | { kind: "example"; title: string; lines: string[] }
  | { kind: "section"; title: string; lines: string[] };

function parseStatement(text: string): Block[] {
  const raw = text.replace(/\r\n/g, "\n").trim();
  if (!raw) return [];

  const lines = raw.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  const isExample = (s: string) => /^example\s*\d*\s*:?\s*$/i.test(s.trim());
  const isSection = (s: string) =>
    /^(constraints?|notes?|follow[\s-]?up|hint)\s*:?\s*$/i.test(s.trim());

  while (i < lines.length) {
    const t = lines[i].trim();
    if (!t) {
      i += 1;
      continue;
    }

    if (isExample(t)) {
      const title = t.replace(/:$/, "");
      i += 1;
      const body: string[] = [];
      while (i < lines.length) {
        const n = lines[i].trim();
        if (isExample(n) || isSection(n)) break;
        body.push(lines[i]);
        i += 1;
      }
      blocks.push({ kind: "example", title, lines: body });
      continue;
    }

    if (isSection(t)) {
      const title = t.replace(/:$/, "");
      i += 1;
      const body: string[] = [];
      while (i < lines.length) {
        const n = lines[i].trim();
        if (isExample(n) || isSection(n)) break;
        body.push(lines[i]);
        i += 1;
      }
      blocks.push({ kind: "section", title, lines: body });
      continue;
    }

    const body: string[] = [];
    while (i < lines.length) {
      const n = lines[i].trim();
      if (isExample(n) || isSection(n)) break;
      body.push(lines[i]);
      i += 1;
    }
    blocks.push({ kind: "para", lines: body });
  }

  return blocks;
}

/** Warm labels + mono for code-ish chunks (nums = [...], etc.). */
function richText(line: string): ReactNode {
  const labelMatch = line.match(
    /^(Input|Output|Explanation|Note)\s*:\s*(.*)$/i,
  );
  if (labelMatch) {
    const rest = labelMatch[2];
    return (
      <p className="my-1.5 text-[15px] leading-7">
        {/* <span className="stmt-label text-s">{labelMatch[1]}:</span> */}
        <span className=" text-sky-300/70">{labelMatch[1]}:</span>
        {rest ? <> {formatInline(rest)}</> : null}
      </p>
    );
  }

  if (!line.trim()) return <div className="h-2.5" />;

  const bullet = line.match(/^([•\-\*]|\d+\.)\s+(.*)$/);
  if (bullet) {
    return (
      <p className="my-2 text-[15px] leading-7 text-text/90">
        <span className="mr-2 text-muted">{bullet[1]}</span>
        {formatInline(bullet[2])}
      </p>
    );
  }

  return (
    <p className="my-2 text-[15px] leading-7 text-text/90">{formatInline(line)}</p>
  );
}

function formatInline(text: string): ReactNode {
  // Split code-ish tokens: `...`, [arrays], snake/camel identifiers after = 
  const parts = text.split(
    /(`[^`]+`|\[[^\]]*\]|[A-Za-z_][\w]*\s*=\s*\[[^\]]*\]|[A-Za-z_][\w]*(?=\s*[,.]))/g,
  );

  return parts.map((part, idx) => {
    if (!part) return null;
    const isCode =
      /^`[^`]+`$/.test(part) ||
      /^\[[^\]]*\]$/.test(part) ||
      /^[A-Za-z_][\w]*\s*=\s*\[/.test(part);

    if (isCode) {
      const clean = part.replace(/^`|`$/g, "");
      return (
        <span key={idx} className="stmt-inline-code">
          {clean}
        </span>
      );
    }

    // Light emphasis on short key words (k, unique, etc.) when wrapped as whole word length 1-12
    return <span key={idx}>{emphasizeWords(part)}</span>;
  });
}

function emphasizeWords(text: string): ReactNode {
  const words = text.split(/(\s+)/);
  return words.map((w, i) => {
    if (/^\s+$/.test(w)) return w;
    if (/^(non-decreasing|unique|integer|array|return)$/i.test(w)) {
      return (
        <strong key={i} className="font-semibold text-white">
          {w}
        </strong>
      );
    }
    if (/^[a-z]$/i.test(w)) {
      return (
        <strong key={i} className="font-semibold text-white">
          {w}
        </strong>
      );
    }
    return <span key={i}>{w}</span>;
  });
}

function BlockView({ block }: { block: Block }) {
  if (block.kind === "example") {
    return (
      <div className="example-block">
        <h3 className="mb-2 text-[15px] font-semibold text-text">
          {block.title}
        </h3>
        {block.lines.map((line, i) => (
          <div key={i}>{richText(line)}</div>
        ))}
      </div>
    );
  }

  if (block.kind === "section") {
    return (
      <div className="mt-5">
        <h3 className="mb-2 text-[15px] font-semibold text-text">
          {block.title}
        </h3>
        {block.lines.map((line, i) => (
          <div key={i}>{richText(line)}</div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-3">
      {block.lines.map((line, i) => (
        <div key={i}>{richText(line)}</div>
      ))}
    </div>
  );
}

/** Left pane — LeetCode-like description (warm labels, example rails, mono snippets). */
export function ProblemPanel({ problem }: { problem: ProblemApiDto }) {
  const ac = formatAcRate(problem.acRate);
  const blocks = parseStatement(problem.contentText);

  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden bg-bg1">
      <header className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-muted">
              {problem.frontendId ? `#${problem.frontendId}` : "—"} ·{" "}
              <span className="text-muted">{problem.slug}</span>
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-text">
              {problem.title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <DifficultyBadge difficulty={problem.difficulty} />
            {ac ? <Badge className="text-text">{ac}</Badge> : null}
          </div>
        </div>

        {problem.tags.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {problem.tags.map((tag) => (
              <TopicBadge key={tag.slug} name={tag.name} slug={tag.slug} />
            ))}
          </div>
        ) : null}

        {problem.warning ? (
          <p className="mt-2 rounded-md border border-warning/30 bg-warning/10 px-2 py-1.5 text-xs text-warning">
            {problem.warning}
          </p>
        ) : null}
      </header>

      <div className="statement-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="max-w-[42rem]">
          {blocks.map((block, i) => (
            <BlockView key={i} block={block} />
          ))}
          <p className="mt-8 text-sm text-muted/70">Now your turn!</p>
        </div>
      </div>
    </article>
  );
}
