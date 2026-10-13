"use client";

import { STAGES, stageToken } from "@/components/ui/Stage";
import { cn } from "@/lib/utils";
import type { Stage } from "@/redux/slice/applicationSlice";
import { Check, X } from "lucide-react";

/**
 * The hiring pipeline, drawn as a progression rail.
 * This is the one place the design spends its boldness — everything else
 * around it stays quiet. Terminal states (Rejected/Withdrawn) break the
 * rail rather than pretending progress continued.
 */
export default function PipelineRail({
  current,
  counts,
  animate = true,
}: {
  current?: Stage;
  counts?: Record<string, number>;
  animate?: boolean;
}) {
  const isTerminal = current === "Rejected" || current === "Withdrawn";
  const activeIndex = current ? STAGES.indexOf(current) : -1;

  return (
    <div className="relative">
      {/* base track */}
      <div className="absolute left-0 right-0 top-[15px] h-[2px] bg-line-soft" aria-hidden />

      {/* filled track up to the current stage */}
      {!isTerminal && activeIndex >= 0 && (
        <div
          className={cn(
            "absolute left-0 top-[15px] h-[2px] bg-[linear-gradient(90deg,var(--color-primary),var(--color-violet))]",
            animate && "rail-line"
          )}
          style={{ width: `${(activeIndex / (STAGES.length - 1)) * 100}%` }}
          aria-hidden
        />
      )}

      <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${STAGES.length}, minmax(0,1fr))` }}>
        {STAGES.map((stage, i) => {
          const done = !isTerminal && activeIndex > i;
          const active = !isTerminal && activeIndex === i;
          const token = stageToken[stage];
          const count = counts?.[stage];

          return (
            <li
              key={stage}
              className={cn("flex flex-col items-start gap-2", animate && "rise")}
              style={animate ? { animationDelay: `${i * 70}ms` } : undefined}
            >
              <span
                className={cn(
                  "grid place-items-center h-8 w-8 rounded-full border-2 bg-surface transition-colors",
                  done && "border-transparent text-white bg-[linear-gradient(135deg,var(--color-primary),var(--color-violet))]",
                  active && "border-primary text-primary pulse-ring",
                  !done && !active && "border-line text-muted-2"
                )}
              >
                {done ? (
                  <Check size={15} strokeWidth={3} />
                ) : count !== undefined ? (
                  <span className="num text-[12px] font-medium">{count}</span>
                ) : (
                  <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-primary" : "bg-line")} />
                )}
              </span>
              <span
                className={cn(
                  "text-[12px] leading-tight pr-2",
                  active ? "text-ink font-medium" : done ? "text-muted" : "text-muted-2"
                )}
              >
                {stage}
              </span>
            </li>
          );
        })}
      </ol>

      {isTerminal && (
        <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-sm)] bg-stage-rejected-soft px-3 py-2">
          <X size={14} className="text-stage-rejected" />
          <span className="text-[13px] text-stage-rejected">
            {current === "Rejected"
              ? "This application didn't move forward."
              : "You withdrew this application."}
          </span>
        </div>
      )}
    </div>
  );
}
