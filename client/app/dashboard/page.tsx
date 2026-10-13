"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity, ArrowRight, Bookmark, Briefcase, Building2, FileText, Flag, Plus, RefreshCw,
  Users, UserRound, Newspaper,
} from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { StageBadge, STAGES } from "@/components/ui/Stage";
import PipelineRail from "@/components/jobs/PipelineRail";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchMyApplications, fetchStats } from "@/redux/slice/applicationSlice";
import { fetchJobs, fetchMyJobs, fetchSavedJobs } from "@/redux/slice/jobSlice";
import { timeAgo, fmtSalary } from "@/lib/utils";
import api, { errText } from "@/api/axios";
import { ep } from "@/api/endpoints";

interface AdminAnalytics {
  totals: {
    totalUsers: number;
    totalCompanies: number;
    totalJobs: number;
    totalApplications: number;
    totalPosts: number;
    openReports: number;
  };
  usersByRole: Record<string, number>;
  jobsByStatus: Record<string, number>;
  applicationsByStatus: Record<string, number>;
  monthlySignups: Array<{ _id: string; count: number }>;
  monthlyApplications: Array<{ _id: string; count: number }>;
  topCompanies: Array<{ companyId: string; name: string; jobCount: number; applications: number }>;
}

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const role = user?.role;

  useEffect(() => {
    if (!role) return;
    if (role === "jobseeker") {
      dispatch(fetchMyApplications({ limit: 5 }));
      dispatch(fetchStats());
      dispatch(fetchSavedJobs());
      dispatch(fetchJobs({ limit: 4 }));
    } else if (role === "recruiter") {
      dispatch(fetchMyJobs({ limit: 20 }));
      dispatch(fetchStats());
    }
  }, [dispatch, role]);

  const first = user?.name?.split(" ")[0];

  return (
    <>
      <Topbar
        title={role === "admin" ? "Admin overview" : first ? `Hello, ${first}` : "Dashboard"}
        subtitle={
          role === "recruiter" ? "Your openings and candidate flow"
          : role === "admin" ? "Platform analytics and activity"
          : "Where your search stands today"
        }
        action={
          role === "recruiter" ? (
            <Link href="/dashboard/jobs/new"><Button size="sm"><Plus size={15} /> Post a job</Button></Link>
          ) : role === "jobseeker" ? (
            <Link href="/jobs"><Button size="sm"><Briefcase size={15} /> Find jobs</Button></Link>
          ) : null
        }
      />

      <div className="w-full px-5 lg:px-9 py-7">
        {role === "jobseeker" && <SeekerView />}
        {role === "recruiter" && <RecruiterView />}
        {role === "admin" && <AdminView />}
        {!role && <LoadingView />}
      </div>
    </>
  );
}

function LoadingView() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-36 w-full" />
      <div className="grid sm:grid-cols-2 gap-4">
        <Skeleton className="h-44" /><Skeleton className="h-44" />
      </div>
    </div>
  );
}

/* ---------------- Job seeker ---------------- */
function SeekerView() {
  const { items, stats, loading } = useAppSelector((s) => s.application);
  const { saved, jobs } = useAppSelector((s) => s.job);

  const counts = stats?.byStatus || {};
  const active = items.filter((i) => !["Rejected", "Withdrawn"].includes(i.status));
  const latest = active[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Hero: the pipeline, not a stat block. */}
      <Card className="p-6 lg:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-7">
          <div>
            <h2 className="font-display text-[19px] text-ink">Your pipeline</h2>
            <p className="text-[13px] text-muted mt-0.5">
              {stats?.total
                ? `${stats.total} application${stats.total === 1 ? "" : "s"} sent so far`
                : "Nothing sent yet"}
            </p>
          </div>
          <Link href="/applications" className="text-[13px] font-medium text-primary hover:underline">
            See all applications
          </Link>
        </div>

        <PipelineRail counts={STAGES.reduce((a, s) => ({ ...a, [s]: counts[s] || 0 }), {})} />
      </Card>

      <div className="grid lg:grid-cols-[1.35fr_1fr] gap-5">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line-soft">
            <h3 className="font-display text-[15.5px] text-ink">Most recent</h3>
            {latest && <StageBadge stage={latest.status} />}
          </div>

          {loading ? (
            <div className="p-5 flex flex-col gap-3">
              <Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No applications yet"
              body="Once you apply to a role, it shows up here and you can follow it through every stage."
              action={<Link href="/jobs"><Button size="sm">Browse open roles</Button></Link>}
            />
          ) : (
            <ul className="divide-y divide-line-soft">
              {items.slice(0, 5).map((a) => (
                <li key={a._id}>
                  <Link href="/applications" className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-2 transition-colors">
                    <span className="grid place-items-center h-9 w-9 rounded-[var(--radius-sm)] bg-line-soft text-muted shrink-0">
                      <Building2 size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium text-ink truncate">{a.job?.title}</p>
                      <p className="text-[12px] text-muted truncate">{a.company?.name} · {timeAgo(a.createdAt)}</p>
                    </div>
                    <StageBadge stage={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-5">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Bookmark size={16} className="text-primary" />
              <h3 className="font-display text-[15.5px] text-ink">Saved</h3>
            </div>
            <p className="num text-[30px] leading-tight text-ink">{saved.length}</p>
            <p className="text-[13px] text-muted mb-4">
              {saved.length === 0 ? "Nothing saved yet" : "roles on your shortlist"}
            </p>
            <Link href="/dashboard/saved">
              <Button variant="secondary" size="sm" full>Open shortlist</Button>
            </Link>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-line-soft">
              <h3 className="font-display text-[15.5px] text-ink">Fresh postings</h3>
            </div>
            {jobs.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-muted">No openings to show right now.</p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {jobs.slice(0, 4).map((j) => (
                  <li key={j._id}>
                    <Link href={`/jobs/${j._id}`} className="block px-5 py-3.5 hover:bg-surface-2 transition-colors">
                      <p className="text-[13.5px] font-medium text-ink truncate">{j.title}</p>
                      <p className="text-[12px] text-muted truncate">
                        {j.company?.name} · {j.workMode}
                        {fmtSalary(j.salary) ? <span className="num"> · {fmtSalary(j.salary)}</span> : null}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/jobs" className="flex items-center justify-center gap-1.5 px-5 py-3 text-[13px] font-medium text-primary hover:bg-surface-2 border-t border-line-soft transition-colors">
              See all jobs <ArrowRight size={14} />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Recruiter ---------------- */
function RecruiterView() {
  const { mine } = useAppSelector((s) => s.job);
  const { stats } = useAppSelector((s) => s.application);

  const live = mine.filter((j) => j.status === "active");
  const drafts = mine.filter((j) => j.status === "draft");
  const totalApplicants = mine.reduce((n, j) => n + (j.applicationCount || 0), 0);
  const counts = stats?.byStatus || {};

  const tiles = [
    { label: "Live openings", value: live.length, icon: Briefcase },
    { label: "In draft", value: drafts.length, icon: FileText },
    { label: "Applicants received", value: totalApplicants, icon: Users },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6 lg:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-7">
          <div>
            <h2 className="font-display text-[19px] text-ink">Candidate flow</h2>
            <p className="text-[13px] text-muted mt-0.5">Across every job you've posted</p>
          </div>
        </div>
        <PipelineRail counts={STAGES.reduce((a, s) => ({ ...a, [s]: counts[s] || 0 }), {})} />
      </Card>

      <div className="grid sm:grid-cols-3 gap-4">
        {tiles.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5">
            <Icon size={17} className="text-primary mb-3" />
            <p className="num text-[30px] leading-tight text-ink">{value}</p>
            <p className="text-[13px] text-muted">{label}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line-soft">
          <h3 className="font-display text-[15.5px] text-ink">Your openings</h3>
          <Link href="/dashboard/jobs" className="text-[13px] font-medium text-primary hover:underline">Manage</Link>
        </div>
        {mine.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs posted yet"
            body="Publish your first opening and applicants will start landing in your pipeline."
            action={<Link href="/dashboard/jobs/new"><Button size="sm"><Plus size={15} /> Post a job</Button></Link>}
          />
        ) : (
          <ul className="divide-y divide-line-soft">
            {mine.slice(0, 6).map((j) => (
              <li key={j._id}>
                <Link href={`/dashboard/jobs/${j._id}/applicants`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-2 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium text-ink truncate">{j.title}</p>
                    <p className="text-[12px] text-muted truncate">{j.location || "—"} · {j.workMode}</p>
                  </div>
                  <span className="num text-[13px] text-ink">{j.applicationCount || 0}</span>
                  <span className="text-[12px] text-muted-2 w-16 text-right">
                    {j.status === "active" ? "Live" : j.status === "draft" ? "Draft" : "Closed"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Admin ---------------- */
function AdminView() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(ep.admin.analytics);
      setAnalytics(data.data);
      setError("");
    } catch (cause) {
      setError(errText(cause, "Could not load platform analytics"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadAnalytics(); }, [loadAnalytics]);

  if (loading && !analytics) {
    return (
      <div className="flex flex-col gap-5" aria-label="Loading platform analytics">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <Skeleton className="h-80" /><Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="flex flex-col items-start gap-3 p-6" role="alert">
        <p className="text-sm text-stage-rejected">{error || "Platform analytics are unavailable."}</p>
        <Button size="sm" variant="secondary" onClick={() => void loadAnalytics()}>
          <RefreshCw size={14} /> Try again
        </Button>
      </Card>
    );
  }

  const { totals } = analytics;
  const recruiterCount = analytics.usersByRole.recruiter || 0;
  const jobSeekerCount = analytics.usersByRole.jobseeker || 0;
  const activeJobs = analytics.jobsByStatus.active || 0;
  const stats = [
    { label: "Total users", value: totals.totalUsers, detail: "All registered accounts", icon: Users, href: "/admin/users", color: "bg-primary-soft text-primary" },
    { label: "Recruiters", value: recruiterCount, detail: "Hiring on the platform", icon: UserRound, href: "/admin/users", color: "bg-violet-soft text-violet" },
    { label: "Job seekers", value: jobSeekerCount, detail: "Candidate accounts", icon: Users, href: "/admin/users", color: "bg-primary-soft text-primary" },
    { label: "Companies", value: totals.totalCompanies, detail: "Registered organizations", icon: Building2, color: "bg-amber-soft text-primary" },
    { label: "Jobs", value: totals.totalJobs, detail: `${activeJobs.toLocaleString()} currently active`, icon: Briefcase, href: "/admin/jobs", color: "bg-violet-soft text-violet" },
    { label: "Applications", value: totals.totalApplications, detail: "Across all job listings", icon: FileText, href: "/admin/jobs", color: "bg-primary-soft text-primary" },
    { label: "Community posts", value: totals.totalPosts, detail: "Published posts", icon: Newspaper, href: "/feed", color: "bg-amber-soft text-primary" },
    { label: "Open reports", value: totals.openReports, detail: "Waiting for review", icon: Flag, href: "/admin/reports", color: "bg-stage-rejected-soft text-stage-rejected" },
  ];
  const trend = buildMonthlyTrend(analytics.monthlySignups, analytics.monthlyApplications);

  return (
    <div className="flex flex-col gap-6">
      {error && <p role="alert" className="text-sm text-stage-rejected">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[19px] text-ink">Platform at a glance</h2>
          <p className="text-[13px] text-muted">A live view of members, hiring activity, and community health.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => void loadAnalytics()} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, detail, icon: Icon, href, color }) => {
          const content = (
            <Card className={`flex h-full items-start gap-4 p-5 ${href ? "transition-colors hover:border-primary/40" : ""}`}>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${color}`}><Icon size={18} /></span>
              <span className="min-w-0">
                <span className="block text-[12px] font-medium text-muted">{label}</span>
                <span className="num mt-1 block text-[27px] leading-tight text-ink">{value.toLocaleString()}</span>
                <span className="mt-1 block text-[12px] text-muted-2">{detail}</span>
              </span>
            </Card>
          );
          return href
            ? <Link href={href} key={label} className="block rounded-[var(--radius-md)] focus-visible:outline-primary">{content}</Link>
            : <div key={label}>{content}</div>;
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card className="p-5 lg:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-[16px] text-ink">Growth and applications</h3>
              <p className="mt-1 text-[12px] text-muted">Monthly signups and applications over the last 12 months</p>
            </div>
            <div className="flex gap-4 text-[12px] text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Signups</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-violet" /> Applications</span>
            </div>
          </div>
          <MonthlyTrendChart rows={trend} />
        </Card>

        <Card className="p-5 lg:p-6">
          <div className="mb-5">
            <h3 className="font-display text-[16px] text-ink">Community by role</h3>
            <p className="mt-1 text-[12px] text-muted">{totals.totalUsers.toLocaleString()} registered user accounts</p>
          </div>
          <BreakdownBars
            rows={[
              { label: "Job seekers", count: jobSeekerCount, color: "bg-primary" },
              { label: "Recruiters", count: recruiterCount, color: "bg-violet" },
              { label: "Admins", count: analytics.usersByRole.admin || 0, color: "bg-amber" },
            ]}
            total={totals.totalUsers}
          />
          <div className="mt-6 border-t border-line-soft pt-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-display text-[14px] text-ink">Job listings</h4>
              <Link href="/admin/jobs" className="text-[12px] font-medium text-primary hover:underline">Review jobs <ArrowRight size={12} className="inline" /></Link>
            </div>
            <BreakdownBars rows={[
              { label: "Active", count: analytics.jobsByStatus.active || 0, color: "bg-stage-selected" },
              { label: "Draft", count: analytics.jobsByStatus.draft || 0, color: "bg-amber" },
              { label: "Closed", count: analytics.jobsByStatus.closed || 0, color: "bg-muted-2" },
            ]} total={totals.totalJobs} />
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5 lg:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-display text-[16px] text-ink">Application pipeline</h3>
              <p className="mt-1 text-[12px] text-muted">Current status of all applications</p>
            </div>
            <Activity size={18} className="text-primary" />
          </div>
          <BreakdownBars
            rows={Object.entries(analytics.applicationsByStatus)
              .sort(([, a], [, b]) => b - a)
              .map(([status, count], index) => ({
                label: status.replace(/([A-Z])/g, " $1"),
                count,
                color: ["bg-primary", "bg-violet", "bg-stage-interview", "bg-stage-selected", "bg-stage-rejected"][index % 5],
              }))}
            total={totals.totalApplications}
          />
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
            <div>
              <h3 className="font-display text-[16px] text-ink">Top companies</h3>
              <p className="mt-1 text-[12px] text-muted">Ranked by job listings</p>
            </div>
            <Building2 size={18} className="text-primary" />
          </div>
          {analytics.topCompanies.length === 0 ? (
            <p className="p-5 text-sm text-muted">Company activity will appear here as jobs are posted.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="bg-line-soft text-[11px] uppercase text-muted">
                  <tr><th className="px-5 py-3 font-medium">Company</th><th className="px-4 py-3 font-medium">Jobs</th><th className="px-4 py-3 font-medium">Applications</th></tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {analytics.topCompanies.map((company, index) => (
                    <tr key={company.companyId}>
                      <td className="px-5 py-3.5"><span className="mr-3 text-[11px] text-muted-2">{String(index + 1).padStart(2, "0")}</span><span className="font-medium text-ink">{company.name}</span></td>
                      <td className="num px-4 py-3.5 text-muted">{company.jobCount.toLocaleString()}</td>
                      <td className="num px-4 py-3.5 text-muted">{company.applications.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/admin/users"><Button variant="secondary" size="sm" full><Users size={15} /> Manage people</Button></Link>
        <Link href="/admin/jobs"><Button variant="secondary" size="sm" full><Briefcase size={15} /> Moderate jobs</Button></Link>
        <Link href="/admin/reports"><Button variant="secondary" size="sm" full><Flag size={15} /> Review reports ({totals.openReports.toLocaleString()})</Button></Link>
      </div>
    </div>
  );
}

function buildMonthlyTrend(
  signups: AdminAnalytics["monthlySignups"],
  applications: AdminAnalytics["monthlyApplications"],
) {
  const signupCounts = new Map(signups.map(({ _id, count }) => [_id, count]));
  const applicationCounts = new Map(applications.map(({ _id, count }) => [_id, count]));
  const now = new Date();
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: new Intl.DateTimeFormat(undefined, { month: "short" }).format(date),
      signups: signupCounts.get(key) || 0,
      applications: applicationCounts.get(key) || 0,
    };
  });
}

function MonthlyTrendChart({ rows }: { rows: ReturnType<typeof buildMonthlyTrend> }) {
  const maxValue = Math.max(1, ...rows.flatMap(({ signups, applications }) => [signups, applications]));
  return (
    <div role="img" aria-label={`Monthly trend chart: ${rows.map(({ label, signups, applications }) => `${label}: ${signups} signups, ${applications} applications`).join("; ")}`}>
      <div className="grid h-52 grid-cols-12 items-end gap-2 border-b border-line-soft px-1 sm:gap-3">
        {rows.map(({ label, signups, applications }) => (
          <div key={label} className="flex h-full min-w-0 flex-col justify-end">
            <div className="flex h-[calc(100%-22px)] items-end justify-center gap-1">
              <div title={`${label}: ${signups} signups`} className="w-2/5 max-w-5 rounded-t bg-primary transition-all" style={{ height: `${Math.max(signups ? 4 : 0, signups / maxValue * 100)}%` }} />
              <div title={`${label}: ${applications} applications`} className="w-2/5 max-w-5 rounded-t bg-violet transition-all" style={{ height: `${Math.max(applications ? 4 : 0, applications / maxValue * 100)}%` }} />
            </div>
            <span className="mt-2 truncate text-center text-[10px] text-muted-2">{label}</span>
          </div>
        ))}
      </div>
      {maxValue === 1 && rows.every(({ signups, applications }) => signups === 0 && applications === 0) && (
        <p className="mt-3 text-center text-xs text-muted">No signup or application trends to show yet.</p>
      )}
    </div>
  );
}

function BreakdownBars({ rows, total }: { rows: Array<{ label: string; count: number; color: string }>; total: number }) {
  if (rows.length === 0) return <p className="text-sm text-muted">No activity to show yet.</p>;
  return (
    <div className="flex flex-col gap-4">
      {rows.map(({ label, count, color }) => (
        <div key={label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-[12px]">
            <span className="capitalize text-muted">{label}</span>
            <span className="num font-medium text-ink">{count.toLocaleString()} <span className="font-normal text-muted-2">{total ? `${Math.round(count / total * 100)}%` : "0%"}</span></span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-line-soft">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${total ? count / total * 100 : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
