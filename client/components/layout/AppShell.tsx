"use client";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { loadMe } from "@/redux/slice/authSlice";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, booting } = useAppSelector((s) => s.auth);

  // Redux state resets on a hard refresh, but the cookie survives — rehydrate.
  useEffect(() => { if (!user && booting) void dispatch(loadMe()); }, [dispatch, user, booting]);

  return (
    <div className="dashboard-theme">
      <div className="flex min-h-screen bg-canvas">
        <Sidebar />
        <div className="flex-1 min-w-0 pb-16 lg:pb-0">{children}</div>
        <MobileNav />
      </div>
    </div>
  );
}
