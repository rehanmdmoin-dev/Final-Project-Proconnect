"use client";
import Link from "next/link";
import { Bookmark, MapPin, Building2 } from "lucide-react";
import { cn, fmtSalary, timeAgo } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { toggleSave, type Job } from "@/redux/slice/jobSlice";

const modeTone: Record<string, string> = {
  Remote: "bg-stage-selected-soft text-stage-selected",
  Hybrid: "bg-violet-soft text-violet",
  "On-site": "bg-line-soft text-muted",
};

export default function JobCard({ job }: { job: Job }) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const salary = fmtSalary(job.salary);

  return (
    <Link
      href={`/jobs/${job._id}`}
      className="dashboard-job-card group block rounded-[var(--radius-md)] border border-line bg-surface p-5 transition-all duration-200 hover:border-primary/35 hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3.5">
        {job.company?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={job.company.logo} alt={job.company.name} className="h-11 w-11 rounded-[var(--radius-sm)] object-cover border border-line shrink-0" />
        ) : (
          <span className="grid place-items-center h-11 w-11 rounded-[var(--radius-sm)] bg-ink text-white shrink-0">
            <Building2 size={18} />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="font-display text-[15.5px] text-ink leading-snug group-hover:text-primary transition-colors truncate">
            {job.title}
          </p>
          <p className="text-[13px] text-muted truncate">{job.company?.name}</p>
        </div>

        {user?.role === "jobseeker" && (
          <button
            onClick={(e) => { e.preventDefault(); dispatch(toggleSave({ id: job._id, saved: !!job.isSaved })); }}
            aria-label={job.isSaved ? "Remove from saved" : "Save this job"}
            className={cn(
              "grid place-items-center h-8 w-8 rounded-[var(--radius-sm)] transition-colors cursor-pointer shrink-0",
              job.isSaved ? "text-primary bg-primary-soft" : "text-muted-2 hover:text-ink hover:bg-line-soft"
            )}
          >
            <Bookmark size={16} fill={job.isSaved ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-medium", modeTone[job.workMode] || modeTone["On-site"])}>
          {job.workMode}
        </span>
        <span className="rounded-full bg-line-soft px-2.5 py-1 text-[12px] text-muted">{job.jobType}</span>
        {job.location && (
          <span className="flex items-center gap-1 text-[12.5px] text-muted">
            <MapPin size={13} /> {job.location}
          </span>
        )}
      </div>

      {job.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {job.skills.slice(0, 4).map((s) => (
            <span key={s} className="rounded-[6px] border border-line px-2 py-0.5 text-[11.5px] text-muted">{s}</span>
          ))}
          {job.skills.length > 4 && (
            <span className="text-[11.5px] text-muted-2 self-center">+{job.skills.length - 4}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-line-soft">
        {salary ? (
          <span className="num text-[13.5px] font-medium text-ink">{salary}</span>
        ) : (
          <span className="text-[12.5px] text-muted-2">Salary not disclosed</span>
        )}
        <span className="text-[12px] text-muted-2">{timeAgo(job.createdAt)}</span>
      </div>
    </Link>
  );
}
