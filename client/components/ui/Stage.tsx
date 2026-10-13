import { cn } from "@/lib/utils";
import type { Stage } from "@/redux/slice/applicationSlice";

/** The ordered hiring pipeline. Order matters — the rail renders from it. */
export const STAGES: Stage[] = ["Applied", "Under Review", "Shortlisted", "Interview", "Selected"];

export const stageToken: Record<string, { text: string; bg: string; dot: string; hex: string }> = {
  Applied:        { text: "text-stage-applied",   bg: "bg-stage-applied-soft",   dot: "bg-stage-applied",   hex: "var(--color-stage-applied)" },
  "Under Review": { text: "text-stage-review",     bg: "bg-stage-review-soft",     dot: "bg-stage-review",     hex: "var(--color-stage-review)" },
  Shortlisted:    { text: "text-stage-short",      bg: "bg-stage-short-soft",      dot: "bg-stage-short",      hex: "var(--color-stage-short)" },
  Interview:      { text: "text-stage-interview",  bg: "bg-stage-interview-soft",  dot: "bg-stage-interview",  hex: "var(--color-stage-interview)" },
  Selected:       { text: "text-stage-selected",   bg: "bg-stage-selected-soft",   dot: "bg-stage-selected",   hex: "var(--color-stage-selected)" },
  Rejected:       { text: "text-stage-rejected",   bg: "bg-stage-rejected-soft",   dot: "bg-stage-rejected",   hex: "var(--color-stage-rejected)" },
  Withdrawn:      { text: "text-muted",            bg: "bg-line-soft",             dot: "bg-muted-2",          hex: "var(--color-muted-2)" },
};

export function StageBadge({ stage, className }: { stage: string; className?: string }) {
  const t = stageToken[stage] || stageToken.Applied;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium", t.bg, t.text, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />
      {stage}
    </span>
  );
}
