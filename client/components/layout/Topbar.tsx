"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, User as UserIcon, Search } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { logout } from "@/redux/slice/authSlice";
import { fetchUnreadCount } from "@/redux/slice/socialSlice";
import { cn } from "@/lib/utils";

const roleChip: Record<string, string> = {
  jobseeker: "bg-primary-soft text-primary",
  recruiter: "bg-violet-soft text-violet",
  admin: "bg-amber-soft text-primary",
};
const roleName: Record<string, string> = { jobseeker: "Job seeker", recruiter: "Recruiter", admin: "Admin" };

export default function Topbar({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  const { user } = useAppSelector((s) => s.auth);
  const { unread } = useAppSelector((s) => s.social);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { dispatch(fetchUnreadCount()); }, [dispatch]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <header className="dashboard-topbar sticky top-0 z-30 bg-canvas/85 backdrop-blur-md border-b border-line">
      <div className="flex items-center justify-between gap-4 px-5 lg:px-9 h-[68px]">
        <div className="min-w-0">
          <h1 className="font-display text-[20px] leading-tight text-ink truncate">{title}</h1>
          {subtitle && <p className="text-[13px] text-muted truncate">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {action}

          <Link href="/notifications"
            className="relative grid place-items-center h-10 w-10 rounded-[var(--radius-sm)] text-muted hover:text-ink hover:bg-line-soft transition-colors"
            aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] px-1 grid place-items-center rounded-full bg-stage-rejected text-white text-[10px] font-semibold num">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>

          <div className="relative" ref={ref}>
            <button onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full pl-1 pr-2.5 py-1 border border-line bg-surface hover:border-primary/40 transition-colors cursor-pointer">
              <Avatar name={user?.name || "?"} src={user?.profileImage} size="xs" />
              <span className="hidden sm:block text-[13px] font-medium text-ink max-w-[110px] truncate">{user?.name}</span>
              <ChevronDown size={14} className="text-muted-2" />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-60 rounded-[var(--radius-md)] border border-line bg-surface shadow-[var(--shadow-lift)] overflow-hidden rise">
                <div className="px-4 py-3.5 border-b border-line-soft">
                  <p className="text-[14px] font-medium text-ink truncate">{user?.name}</p>
                  <p className="text-[12px] text-muted truncate mb-2">{user?.email}</p>
                  {user?.role && (
                    <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-medium", roleChip[user.role])}>
                      {roleName[user.role]}
                    </span>
                  )}
                </div>
                <Link href="/profile" onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] text-ink hover:bg-line-soft">
                  <UserIcon size={15} /> Your profile
                </Link>
                <button
                  onClick={async () => { await dispatch(logout()); router.replace("/"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] text-stage-rejected hover:bg-stage-rejected-soft cursor-pointer">
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
