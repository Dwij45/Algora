import type { CSSProperties, ReactNode } from "react";
import { topicTone } from "@/lib/ui/topicColors";

const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: "text-ok border-ok/40 bg-ok/10",
  Medium: "text-warning border-warning/40 bg-warning/10",
  Hard: "text-danger border-danger/40 bg-danger/10",
};

export function Badge({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={style}
      className={[
        "inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs text-muted",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const tone = DIFFICULTY_CLASS[difficulty] ?? "text-muted border-border bg-bg2";
  return <Badge className={tone}>{difficulty}</Badge>;
}

/** Colorful topic chip (String, Stack, DP, …). */
export function TopicBadge({
  name,
  slug,
}: {
  name: string;
  slug?: string;
}) {
  const tone = topicTone(slug || name);
  return (
    <Badge
      className="border font-medium mx-0.5 bg-sky-300/10 border-sky-100/30 text-sky-300"
      // style={{
      //   color: tone.text,
      //   borderColor: tone.border,
      //   // backgroundColor: tone.bg,
      // }}
    >
      {name}
    </Badge>
  );
}
