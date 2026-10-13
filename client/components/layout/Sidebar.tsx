"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/lib/hooks";
import {
  LayoutDashboard, Briefcase, Bookmark, FileText, Users, Newspaper,
  Building2, UsersRound, ShieldCheck, CalendarClock, Sparkles,
} from "lucide-react";

export const navFor = (role?: string) => {
  if (role === "recruiter")
    return [
      { group: "Hiring", items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/jobs", label: "My jobs", icon: Briefcase },
        { href: "/dashboard/jobs/new", label: "Post a job", icon: Sparkles },
        { href: "/dashboard/interviews", label: "Interviews", icon: CalendarClock },
        { href: "/dashboard/company", label: "Company", icon: Building2 },
      ]},
      { group: "Network", items: [
        { href: "/feed", label: "Feed", icon: Newspaper },
        { href: "/network", label: "Network", icon: Users },
      ]},
    ];
  if (role === "admin")
    return [
      { group: "Platform", items: [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/admin/users", label: "People", icon: UsersRound },
        { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
        { href: "/admin/reports", label: "Reports", icon: ShieldCheck },
      ]},
    ];
  return [
    { group: "Your search", items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/jobs", label: "Find jobs", icon: Briefcase },
      { href: "/applications", label: "Applications", icon: FileText },
      { href: "/dashboard/saved", label: "Saved", icon: Bookmark },
    ]},
    { group: "Network", items: [
      { href: "/feed", label: "Feed", icon: Newspaper },
      { href: "/network", label: "Network", icon: Users },
    ]},
  ];
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAppSelector((s) => s.auth);
  const sections = navFor(user?.role);

  return (
    <aside className="dashboard-sidebar hidden lg:flex w-[236px] shrink-0 flex-col bg-white text-ink sticky top-0 h-screen border-r border-line-soft">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-5 h-[68px] border-b border-line-soft">
        <span className="grid place-items-center h-8 w-8 rounded-[9px] bg-[linear-gradient(135deg,#30b88e,#087f68)] font-display font-bold text-[15px] text-white shadow-[0_5px_12px_rgba(8,127,104,0.16)]">
          P
        </span>
        <span className="font-display text-[17px] font-semibold tracking-tight text-ink">ProConnect</span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {sections.map((section) => (
          <div key={section.group} className="mb-6">
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.11em] text-muted-2">{section.group}</p>
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
                return (
                  <Link key={href} href={href}
                    className={cn(
                      "dashboard-nav-link group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px]",
                      active ? "bg-primary-soft text-primary font-semibold shadow-[0_3px_10px_rgba(8,127,104,0.07)]" : "text-muted hover:text-primary hover:bg-surface-2"
                    )}>
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r bg-primary" />
                    )}
                    <Icon size={16.5} strokeWidth={2} className="transition-transform duration-200 group-hover:scale-110" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
