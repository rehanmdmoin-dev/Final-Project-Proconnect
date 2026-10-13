"use client";
import { useCallback, useEffect, useState } from "react";
import Topbar from "@/components/layout/Topbar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import api, { errText } from "@/api/axios";
import { ep } from "@/api/endpoints";

interface JobRow {
  _id: string;
  title: string;
  status: string;
  moderationStatus: "pending" | "approved" | "rejected";
  company?: { name: string };
  createdBy?: { name: string; email: string };
  createdAt: string;
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadJobs = useCallback(async () => {
    try {
      const { data } = await api.get(ep.admin.jobs, { params: { limit: 100 } });
      setJobs(data.data || []);
      setError("");
    } catch (cause) {
      setError(errText(cause, "Could not load job listings"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadJobs(); }, [loadJobs]);

  const moderate = async (job: JobRow, moderationStatus: JobRow["moderationStatus"]) => {
    try {
      await api.patch(ep.admin.jobModerate(job._id), { moderationStatus });
      await loadJobs();
    } catch (cause) {
      setError(errText(cause, "Could not moderate this job"));
    }
  };

  const remove = async (job: JobRow) => {
    if (!window.confirm(`Remove "${job.title}" from the platform?`)) return;
    try {
      await api.delete(ep.admin.jobDelete(job._id));
      await loadJobs();
    } catch (cause) {
      setError(errText(cause, "Could not remove this job"));
    }
  };

  return (
    <>
      <Topbar title="Job moderation" subtitle="Review active and pending listings" />
      <main className="w-full px-5 py-7 lg:px-9 full-width">
        {error && <p role="alert" className="mb-4 text-sm text-stage-rejected">{error}</p>}
        <Card className="overflow-hidden ">
          {loading ? <p className="p-5 text-sm text-muted">Loading listings...</p> : jobs.length === 0 ? <p className="p-5 text-sm text-muted">No listings found.</p> :
            <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-line-soft text-[12px] uppercase text-muted"><tr><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Company</th><th className="px-4 py-3 font-medium">Recruiter</th><th className="px-4 py-3 font-medium">Listing</th><th className="px-4 py-3 font-medium">Moderation</th><th className="px-4 py-3 font-medium">Action</th></tr></thead>
              <tbody className="divide-y divide-line-soft">{jobs.map((job) => <tr key={job._id}>
                <td className="px-4 py-3 font-medium text-ink">{job.title}</td>
                <td className="px-4 py-3 text-muted">{job.company?.name || "-"}</td>
                <td className="px-4 py-3 text-muted">{job.createdBy?.name || job.createdBy?.email || "-"}</td>
                <td className="px-4 py-3 capitalize text-muted">{job.status}</td>
                <td className="px-4 py-3"><Select aria-label={`Moderation status for ${job.title}`} value={job.moderationStatus} onChange={(event) => void moderate(job, event.target.value as JobRow["moderationStatus"])}>
                  <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
                </Select></td>
                <td className="px-4 py-3"><Button size="sm" variant="danger" onClick={() => void remove(job)}>Remove</Button></td>
              </tr>)}</tbody>
            </table></div>}
        </Card>
      </main>
    </>
  );
}