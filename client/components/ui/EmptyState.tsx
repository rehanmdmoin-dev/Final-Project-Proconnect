import { LucideIcon } from "lucide-react";

/** Empty screens are an invitation to act, so they always carry an action. */
export default function EmptyState({
  icon: Icon, title, body, action,
}: { icon: LucideIcon; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-16">
      <span className="grid place-items-center h-12 w-12 rounded-[var(--radius-md)] bg-primary-soft text-primary mb-4">
        <Icon size={22} />
      </span>
      <p className="font-display text-[17px] font-semibold text-ink mb-1">{title}</p>
      <p className="text-[13.5px] text-muted max-w-[42ch] mb-5">{body}</p>
      {action}
    </div>
  );
}
