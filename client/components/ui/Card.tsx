import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("dashboard-card bg-surface border border-line rounded-[var(--radius-md)] shadow-[var(--shadow-soft)]", className)}
      {...p}
    />
  );
}
