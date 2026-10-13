"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Building2, ChevronDown } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { StageBadge } from "@/components/ui/Stage";
import PipelineRail from "@/components/jobs/PipelineRail";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchMyApplications, withdrawApplication } from "@/redux/slice/applicationSlice";
import { cn, fmtDate, timeAgo } from "@/lib/utils";

const FILTERS = ["All", "Applied", "Under Review", "Shortlisted", "Interview", "Selected", "Rejected"];

export default function ApplicationsPage() {
  const dispatch = useAppDispatch();
  const { items, loading, total } = useAppSelector((s) => s.application);
  const [filter, setFilter] = useState("All");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchMyApplications({ status: filter === "All" ? undefined : filter, limit: 50 }));
  }, [dispatch, filter]);

  return (
    <>
      <Topbar title="Applications" subtitle={total ? `${total} sent in total` : "Everything you've applied to"} />

      <div className="w-full px-5 lg:px-9 py-6">
        <div className="flex flex-wrap gap-2 mb-5">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
              className={cn("rounded-full border px-3.5 py-1.5 text-[13px] transition-all cursor-pointer",
                filter === f ? "border-ink bg-ink text-white font-medium" : "border-line bg-surface text-muted hover:border-muted-2")}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[92px]" />)}
          </div>
        ) : items.length === 0 ? (
          <Card>
            <EmptyState
              icon={FileText}
              title={filter === "All" ? "No applications yet" : `Nothing at ${filter}`}
              body={filter === "All"
                ? "Apply to a role and you'll be able to follow it here from sent through to offer."
                : "Try another stage, or view all of your applications."}
              action={filter === "All"
                ? <Link href="/jobs"><Button size="sm">Find a role</Button></Link>
                : <Button size="sm" variant="secondary" onClick={() => setFilter("All")}>View all</Button>}
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((a) => {
              const open = openId === a._id;
              const canWithdraw = !["Selected", "Rejected", "Withdrawn"].includes(a.status);
              return (
                <Card key={a._id} className="overflow-hidden">
                  <button onClick={() => setOpenId(open ? null : a._id)}
                    className="w-full flex items-center gap-3.5 p-4 text-left hover:bg-surface-2 transition-colors cursor-pointer">
                    <span className="grid place-items-center h-11 w-11 rounded-[var(--radius-sm)] bg-line-soft text-muted shrink-0">
                      <Building2 size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-medium text-ink truncate">{a.job?.title}</p>
                      <p className="text-[12.5px] text-muted truncate">
                        {a.company?.name} · applied {timeAgo(a.createdAt)}
                      </p>
                    </div>
                    <StageBadge stage={a.status} />
                    <ChevronDown size={16} className={cn("text-muted-2 transition-transform shrink-0", open && "rotate-180")} />
                  </button>

                  {open && (
                    <div className="px-5 pb-5 pt-1 border-t border-line-soft rise">
                      <div className="py-5">
                        <PipelineRail current={a.status} animate={false} />
                      </div>

                      {a.statusHistory && a.statusHistory.length > 0 && (
                        <ol className="flex flex-col gap-2 mb-4">
                          {[...a.statusHistory].reverse().map((h, i) => (
                            <li key={i} className="flex items-center gap-2.5 text-[12.5px]">
                              <span className="num text-muted-2 w-[92px] shrink-0">{fmtDate(h.changedAt)}</span>
                              <span className="text-ink">{h.status}</span>
                              {h.note && <span className="text-muted truncate">— {h.note}</span>}
                            </li>
                          ))}
                        </ol>
                      )}

                      <div className="flex gap-2.5">
                        <Link href={`/jobs/${a.job?._id}`}>
                          <Button size="sm" variant="secondary">View the role</Button>
                        </Link>
                        {canWithdraw && (
                          <Button size="sm" variant="ghost"
                            onClick={() => dispatch(withdrawApplication(a._id))}>
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
