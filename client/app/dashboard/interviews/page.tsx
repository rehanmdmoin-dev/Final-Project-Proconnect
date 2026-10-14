"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CalendarClock, CalendarPlus, X } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { useAppSelector } from "@/lib/hooks";
import api, { errText } from "@/api/axios";
import { ep } from "@/api/endpoints";

interface JobOption {
  _id: string;
  title: string;
  company?: { name: string };
}

interface ApplicantOption {
  _id: string;
  status: string;
  candidate?: { name?: string; email?: string };
}

interface Interview {
  _id: string;
  candidate?: { name: string; email: string };
  job?: { title: string };
  scheduledAt: string;
  durationMinutes: number;
  mode: string;
  meetingLink?: string;
  address?: string;
  status: string;
}

export default function InterviewsPage() {
  const role = useAppSelector((state) => state.auth.user?.role);
  const canSchedule = role === "recruiter" || role === "admin";
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [applicants, setApplicants] = useState<ApplicantOption[]>([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [selectedApplication, setSelectedApplication] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [mode, setMode] = useState("Online");
  const [meetingLink, setMeetingLink] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadInterviews = useCallback(async () => {
    try {
      const { data } = await api.get(ep.interviews.list, { params: { limit: 100 } });
      setInterviews(data.data || []);
      setError("");
    } catch (cause) {
      setError(errText(cause, "Could not load interviews"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadInterviews(); }, [loadInterviews]);

  useEffect(() => {
    if (!canSchedule) {
      setJobsLoading(false);
      return;
    }

    let active = true;
    setJobsLoading(true);
    api.get(ep.jobs.mine, { params: { limit: 100 } })
      .then(({ data }) => {
        if (active) setJobs(data.data || []);
      })
      .catch((cause) => {
        if (active) setError(errText(cause, "Could not load your jobs"));
      })
      .finally(() => {
        if (active) setJobsLoading(false);
      });

    return () => { active = false; };
  }, [canSchedule]);

  useEffect(() => {
    setApplicants([]);
    setSelectedApplication("");
    if (!selectedJob) return;

    let active = true;
    setApplicantsLoading(true);
    api.get(ep.jobs.applicants(selectedJob), { params: { limit: 100 } })
      .then(({ data }) => {
        if (active) {
          setApplicants((data.data || []).filter((applicant: ApplicantOption) =>
            !["Rejected", "Withdrawn"].includes(applicant.status)
          ));
        }
      })
      .catch((cause) => {
        if (active) setError(errText(cause, "Could not load applicants for this job"));
      })
      .finally(() => {
        if (active) setApplicantsLoading(false);
      });

    return () => { active = false; };
  }, [selectedJob]);

  const scheduleInterview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await api.post(ep.interviews.create, {
        application: selectedApplication,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: Number(durationMinutes),
        mode,
        meetingLink: mode === "Online" ? meetingLink : "",
        address: mode === "Offline" ? address : "",
        notes,
      });
      setSelectedApplication("");
      setScheduledAt("");
      setDurationMinutes("30");
      setMode("Online");
      setMeetingLink("");
      setAddress("");
      setNotes("");
      setSuccess("Interview scheduled. You can schedule another one below.");
      await loadInterviews();
    } catch (cause) {
      setError(errText(cause, "Could not schedule this interview"));
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (interview: Interview) => {
    if (!window.confirm(`Cancel the interview for ${interview.candidate?.name || "this candidate"}?`)) return;
    try {
      await api.delete(ep.interviews.byId(interview._id));
      await loadInterviews();
    } catch (cause) {
      setError(errText(cause, "Could not cancel this interview"));
    }
  };

  return (
    <>
      <Topbar title="Interviews" subtitle="Your scheduled candidate conversations" />
      <main className="w-full px-5 py-7 lg:px-9">
        {error && <p role="alert" className="mb-4 text-sm text-stage-rejected">{error}</p>}
        {success && <p role="status" className="mb-4 text-sm text-primary">{success}</p>}
        {canSchedule && <Card className="mb-5 p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="flex items-center gap-2 font-display text-lg text-ink"><CalendarPlus size={19} className="text-primary" /> Schedule an interview</h2>
            <p className="mt-1 text-sm text-muted">Choose a job and applicant, then set the interview details.</p>
          </div>
          <form onSubmit={(event) => void scheduleInterview(event)} className="grid gap-4 sm:grid-cols-2">
            <Select label="Job" value={selectedJob} required disabled={jobsLoading || jobs.length === 0}
              onChange={(event) => { setSelectedJob(event.target.value); setError(""); setSuccess(""); }}>
              <option value="">{jobsLoading ? "Loading jobs..." : jobs.length ? "Select a job" : "No jobs available"}</option>
              {jobs.map((job) => <option key={job._id} value={job._id}>{job.title}{job.company?.name ? ` · ${job.company.name}` : ""}</option>)}
            </Select>
            <Select label="Applicant" value={selectedApplication} required disabled={!selectedJob || applicantsLoading || applicants.length === 0}
              onChange={(event) => setSelectedApplication(event.target.value)}>
              <option value="">{applicantsLoading ? "Loading applicants..." : applicants.length ? "Select an applicant" : "No eligible applicants"}</option>
              {applicants.map((applicant) => (
                <option key={applicant._id} value={applicant._id}>
                  {applicant.candidate?.name || applicant.candidate?.email || "Candidate"} · {applicant.status}
                </option>
              ))}
            </Select>
            <Input label="Date and time" type="datetime-local" value={scheduledAt} required
              min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
              onChange={(event) => setScheduledAt(event.target.value)} />
            <Input label="Duration (minutes)" type="number" min={5} max={480} step={1}
              value={durationMinutes} required onChange={(event) => setDurationMinutes(event.target.value)} />
            <Select label="Interview mode" value={mode}
              onChange={(event) => setMode(event.target.value)}>
              <option value="Online">Online</option><option value="Offline">Offline</option><option value="Phone">Phone</option>
            </Select>
            {mode === "Online" && <Input label="Meeting link" type="url" value={meetingLink} required
              placeholder="https://..." onChange={(event) => setMeetingLink(event.target.value)} />}
            {mode === "Offline" && <Input label="Address" value={address} required maxLength={300}
              onChange={(event) => setAddress(event.target.value)} />}
            <div className="sm:col-span-2">
              <Textarea label="Notes (optional)" value={notes} maxLength={1000}
                onChange={(event) => setNotes(event.target.value)} placeholder="Add any details for the candidate." />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" loading={submitting} disabled={jobsLoading || applicantsLoading || !jobs.length || !applicants.length}>
                Schedule interview
              </Button>
            </div>
          </form>
        </Card>}
        <Card className="overflow-hidden">
          {loading ? <p className="p-5 text-sm text-muted">Loading interviews...</p> : interviews.length === 0 ?
            <div className="p-8 text-center"><CalendarClock size={22} className="mx-auto mb-2 text-muted-2" /><p className="text-sm text-muted">No interviews scheduled yet.</p></div> :
            <ul className="divide-y divide-line-soft">
              {interviews.map((interview) => <li key={interview._id} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-primary/10 text-primary"><CalendarClock size={18} /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{interview.candidate?.name || "Candidate"} <span className="font-normal text-muted">· {interview.job?.title || "Job"}</span></p>
                  <p className="mt-1 text-[13px] text-muted">{new Date(interview.scheduledAt).toLocaleString()} · {interview.durationMinutes} min · {interview.mode}</p>
                  {interview.meetingLink && <a className="mt-1 inline-block text-[13px] text-primary hover:underline" href={interview.meetingLink} target="_blank" rel="noreferrer">Meeting link</a>}
                  {interview.address && <p className="mt-1 text-[13px] text-muted">{interview.address}</p>}
                </div>
                <span className="text-xs text-muted">{interview.status}</span>
                {!["Cancelled", "Completed"].includes(interview.status) && <Button variant="danger" size="sm" onClick={() => void cancel(interview)} aria-label={`Cancel interview with ${interview.candidate?.name || "candidate"}`}><X size={14} /> Cancel</Button>}
              </li>)}
            </ul>}
        </Card>
      </main>
    </>
  );
}