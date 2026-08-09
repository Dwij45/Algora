import type { ReactNode } from "react";

const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: "text-ok border-ok/40 bg-ok/10",
  Medium: "text-warning border-warning/40 bg-warning/10",
  Hard: "text-danger border-danger/40 bg-danger/10",
};

export function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
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
