"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Bookmark, Building2, MapPin, Clock, Briefcase, Users, CheckCircle2,
} from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Field";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchJob, toggleSave, applyToJob, clearCurrent } from "@/redux/slice/jobSlice";
import { cn, fmtDate, fmtSalary, timeAgo } from "@/lib/utils";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { current: job, loading } = useAppSelector((s) => s.job);
  const { user } = useAppSelector((s) => s.auth);

  const [showApply, setShowApply] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    dispatch(fetchJob(id));
    return () => { dispatch(clearCurrent()); };
  }, [dispatch, id]);

  const submitApplication = async () => {
    setApplying(true);
    const res = await dispatch(applyToJob({ id, coverLetter }));
    setApplying(false);
    if (applyToJob.fulfilled.match(res)) {
      setApplied(true);
      setShowApply(false);
    }
  };

  if (loading || !job) {
    return (
      <>
        <Topbar title="Job" />
        <div className="w-full px-5 lg:px-9 py-7 flex flex-col gap-4">
          <Skeleton className="h-32" /><Skeleton className="h-64" />
        </div>
      </>
    );
  }

  const salary = fmtSalary(job.salary);
  const deadlinePassed = job.deadline ? new Date(job.deadline) < new Date() : false;
  const canApply = user?.role === "jobseeker" && job.status === "active" && !deadlinePassed;

  const facts = [
    { icon: MapPin, label: job.location || "Not specified" },
    { icon: Briefcase, label: job.jobType },
    { icon: Clock, label: job.deadline ? `Apply by ${fmtDate(job.deadline)}` : "No deadline" },
    { icon: Users, label: `${job.applicationCount || 0} applied` },
  ];

  return (
    <>
      <Topbar
        title="Job details"
        action={
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[13px] text-muted hover:text-ink cursor-pointer">
            <ArrowLeft size={15} /> Back
          </button>
        }
      />

      <div className="w-full px-5 lg:px-9 py-7 flex flex-col gap-5">
        <Card className="p-6 lg:p-7 rise">
          <div className="flex items-start gap-4">
            {job.company?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={job.company.logo} alt={job.company.name} className="h-14 w-14 rounded-[var(--radius-md)] object-cover border border-line shrink-0" />
            ) : (
              <span className="grid place-items-center h-14 w-14 rounded-[var(--radius-md)] bg-ink text-white shrink-0">
                <Building2 size={22} />
              </span>
            )}

            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[23px] leading-tight text-ink mb-1">{job.title}</h2>
              <p className="text-[14px] text-muted">
                {job.company?.name}
                {job.company?.industry ? ` · ${job.company.industry}` : ""}
              </p>
            </div>

            {user?.role === "jobseeker" && (
              <button
                onClick={() => dispatch(toggleSave({ id: job._id, saved: !!job.isSaved }))}
                aria-label={job.isSaved ? "Remove from saved" : "Save this job"}
                className={cn("grid place-items-center h-10 w-10 rounded-[var(--radius-sm)] border transition-colors cursor-pointer shrink-0",
                  job.isSaved ? "border-primary text-primary bg-primary-soft" : "border-line text-muted-2 hover:text-ink")}
              >
                <Bookmark size={17} fill={job.isSaved ? "currentColor" : "none"} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 mt-5 pt-5 border-t border-line-soft">
            {facts.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-[13px] text-muted">
                <Icon size={14.5} className="text-muted-2" /> {label}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mt-5">
            <div>
              {salary ? (
                <p className="num text-[19px] font-medium text-ink">{salary}</p>
              ) : (
                <p className="text-[14px] text-muted-2">Salary not disclosed</p>
              )}
              <p className="text-[12.5px] text-muted-2">Posted {timeAgo(job.createdAt)}</p>
            </div>

            {applied ? (
              <span className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-stage-selected-soft px-4 py-2.5 text-[13.5px] font-medium text-stage-selected">
                <CheckCircle2 size={16} /> Application sent
              </span>
            ) : canApply ? (
              <Button size="lg" onClick={() => setShowApply(true)}>Apply for this role</Button>
            ) : deadlinePassed ? (
              <span className="rounded-[var(--radius-sm)] bg-line-soft px-4 py-2.5 text-[13.5px] text-muted">Applications closed</span>
            ) : !user ? (
              <Link href="/login"><Button size="lg">Sign in to apply</Button></Link>
            ) : null}
          </div>
        </Card>

        {showApply && (
          <Card className="p-6 rise border-primary/30">
            <h3 className="font-display text-[17px] text-ink mb-1.5">Send your application</h3>
            <p className="text-[13.5px] text-muted mb-5">
              Your profile and the resume on file go across with this. Add a note if you'd like.
            </p>
            <Textarea
              label="Cover note (optional)"
              placeholder="Why this role, and what you'd bring to it."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
            <div className="flex gap-2.5 mt-4">
              <Button onClick={submitApplication} loading={applying}>Send application</Button>
              <Button variant="ghost" onClick={() => setShowApply(false)}>Cancel</Button>
            </div>
          </Card>
        )}

        <Card className="p-6 lg:p-7">
          <h3 className="font-display text-[17px] text-ink mb-3">About this role</h3>
          <p className="text-[14.5px] leading-[1.75] text-muted whitespace-pre-line">{job.description}</p>

          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="mt-7">
              <h4 className="font-display text-[15px] text-ink mb-3">What you'll do</h4>
              <ul className="flex flex-col gap-2">
                {job.responsibilities.map((r, i) => (
                  <li key={i} className="flex gap-2.5 text-[14px] text-muted leading-relaxed">
                    <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.requirements && job.requirements.length > 0 && (
            <div className="mt-7">
              <h4 className="font-display text-[15px] text-ink mb-3">What they're looking for</h4>
              <ul className="flex flex-col gap-2">
                {job.requirements.map((r, i) => (
                  <li key={i} className="flex gap-2.5 text-[14px] text-muted leading-relaxed">
                    <CheckCircle2 size={15} className="text-stage-selected mt-1 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.skills?.length > 0 && (
            <div className="mt-7 pt-6 border-t border-line-soft">
              <h4 className="font-display text-[15px] text-ink mb-3">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <span key={s} className="rounded-[var(--radius-sm)] bg-primary-soft px-2.5 py-1.5 text-[13px] font-medium text-primary">{s}</span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
