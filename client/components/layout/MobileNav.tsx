"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import { navFor } from "./Sidebar";
import { cn } from "@/lib/utils";

/** Mobile gets a bottom tab bar (thumb-reachable) rather than a drawer. */
export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useAppSelector((s) => s.auth);
  const items = navFor(user?.role).flatMap((s) => s.items).slice(0, 5);

  return (
    <nav className="dashboard-mobile-nav lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}>
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={cn("flex flex-col items-center gap-1 py-2.5 text-[10.5px] transition-colors",
                active ? "text-primary" : "text-muted-2")}>
              <Icon size={19} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
