"use client";
import { useCallback, useEffect, useState } from "react";
import { CalendarClock, X } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api, { errText } from "@/api/axios";
import { ep } from "@/api/endpoints";

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
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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