"use client";
import { use, useEffect, useState } from "react";
import { Search, SlidersHorizontal, X, Briefcase } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import JobCard from "@/components/jobs/JobCard";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchJobs } from "@/redux/slice/jobSlice";
import { cn } from "@/lib/utils";

const MODES = ["Remote", "Hybrid", "On-site"];
const TYPES = ["Full Time", "Part Time", "Internship", "Contract"];

export default function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string | string[]; location?: string | string[] }>;
}) {
  const query = use(searchParams);
  const initialKeyword = typeof query.keyword === "string" ? query.keyword : "";
  const initialLocation = typeof query.location === "string" ? query.location : "";
  const dispatch = useAppDispatch();
  const { jobs, loading, total, page, totalPages } = useAppSelector((s) => s.job);

  const [keyword, setKeyword] = useState(initialKeyword);
  const [location, setLocation] = useState(initialLocation);
  const [modes, setModes] = useState<string[]>([]);
  const [jobType, setJobType] = useState("");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [current, setCurrent] = useState(1);

  // Debounced so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(fetchJobs({
        keyword: keyword || undefined,
        location: location || undefined,
        workMode: modes.length ? modes.join(",") : undefined,
        jobType: jobType || undefined,
        sort, page: current, limit: 12,
      }));
    }, 350);
    return () => clearTimeout(t);
  }, [dispatch, keyword, location, modes, jobType, sort, current]);

  const toggleMode = (m: string) => {
    setCurrent(1);
    setModes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const activeCount = modes.length + (jobType ? 1 : 0) + (location ? 1 : 0);
  const clearAll = () => { setModes([]); setJobType(""); setLocation(""); setCurrent(1); };

  return (
    <>
      <Topbar title="Find jobs" subtitle={total ? `${total} open role${total === 1 ? "" : "s"}` : "Search every open role"} />

      <div className="w-full px-5 lg:px-9 py-6">
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-2" />
            <input
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setCurrent(1); }}
              placeholder="Job title, skill or company"
              className="w-full h-11 rounded-[var(--radius-sm)] border border-line bg-surface pl-10 pr-3.5 text-[14px] text-ink placeholder:text-muted-2 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
            />
          </div>

          <Button variant={showFilters ? "dark" : "secondary"} onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal size={15} />
            Filters
            {activeCount > 0 && (
              <span className="num ml-0.5 rounded-full bg-primary text-white px-1.5 text-[11px]">{activeCount}</span>
            )}
          </Button>

          <Select value={sort} onChange={(e) => { setSort(e.target.value); setCurrent(1); }} className="w-auto">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="salaryHigh">Highest salary</option>
            <option value="salaryLow">Lowest salary</option>
          </Select>
        </div>

        {showFilters && (
          <Card className="p-5 mb-5 rise">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <p className="text-[13px] font-medium text-ink mb-2.5">Work mode</p>
                <div className="flex flex-wrap gap-2">
                  {MODES.map((m) => (
                    <button key={m} onClick={() => toggleMode(m)} aria-pressed={modes.includes(m)}
                      className={cn("rounded-full border px-3 py-1.5 text-[13px] transition-all cursor-pointer",
                        modes.includes(m) ? "border-primary bg-primary-soft text-primary font-medium" : "border-line text-muted hover:border-muted-2")}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[13px] font-medium text-ink mb-2.5">Location</p>
                <input value={location} onChange={(e) => { setLocation(e.target.value); setCurrent(1); }}
                  placeholder="City or region"
                  className="w-full h-10 rounded-[var(--radius-sm)] border border-line bg-surface px-3 text-[13.5px] focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" />
              </div>

              <div className="sm:col-span-2">
                <p className="text-[13px] font-medium text-ink mb-2.5">Employment type</p>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((t) => (
                    <button key={t} onClick={() => { setJobType(jobType === t ? "" : t); setCurrent(1); }}
                      aria-pressed={jobType === t}
                      className={cn("rounded-full border px-3 py-1.5 text-[13px] transition-all cursor-pointer",
                        jobType === t ? "border-primary bg-primary-soft text-primary font-medium" : "border-line text-muted hover:border-muted-2")}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeCount > 0 && (
              <button onClick={clearAll} className="mt-5 flex items-center gap-1.5 text-[13px] text-muted hover:text-ink cursor-pointer">
                <X size={14} /> Clear filters
              </button>
            )}
          </Card>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[196px]" />)}
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <EmptyState
              icon={Briefcase}
              title="No roles match those filters"
              body="Try widening the work mode or clearing the location to see more openings."
              action={activeCount > 0 ? <Button size="sm" variant="secondary" onClick={clearAll}>Clear filters</Button> : undefined}
            />
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              {jobs.map((j) => <JobCard key={j._id} job={j} />)}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setCurrent(page - 1)}>Previous</Button>
                <span className="num text-[13px] text-muted px-3">{page} of {totalPages}</span>
                <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setCurrent(page + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
