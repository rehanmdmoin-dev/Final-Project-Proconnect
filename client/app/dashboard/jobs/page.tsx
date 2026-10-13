"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import api, { errText } from "@/api/axios";
import { ep } from "@/api/endpoints";

interface JobRow {
  _id: string;
  title: string;
  company?: { name: string };
  status: "draft" | "active" | "closed";
  moderationStatus?: string;
  applicationCount?: number;
  createdAt: string;
}

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadJobs = useCallback(async () => {
    try {
      const { data } = await api.get(ep.jobs.mine, { params: { limit: 100 } });
      setJobs(data.data || []);
      setError("");
    } catch (cause) {
      setError(errText(cause, "Could not load your jobs"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadJobs(); }, [loadJobs]);

  const updateStatus = async (job: JobRow, status: JobRow["status"]) => {
    try {
      await api.patch(ep.jobs.status(job._id), { status });
      await loadJobs();
    } catch (cause) {
      setError(errText(cause, "Could not update this job"));
    }
  };

  return (
    <>
      <Topbar title="My jobs" subtitle="Manage your openings and applicant activity"
        action={<Link href="/dashboard/jobs/new"><Button size="sm"><Plus size={15} /> Post a job</Button></Link>} />
      <main className="w-full px-5 py-7 lg:px-9 full-width">
        {error && <p role="alert" className="mb-4 text-sm text-stage-rejected">{error}</p>}
        <Card className="overflow-hidden">
          {loading ? <p className="p-5 text-sm text-muted">Loading jobs...</p> : jobs.length === 0 ?
            <p className="p-5 text-sm text-muted">No jobs yet. Create your first opening to get started.</p> :
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-line-soft text-[12px] uppercase text-muted">
                  <tr><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Applications</th><th className="px-4 py-3 font-medium">Review</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Listing</th></tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {jobs.map((job) => <tr key={job._id}>
                    <td className="px-4 py-3"><p className="font-medium text-ink">{job.title}</p><p className="text-xs text-muted">{job.company?.name || "Company"}</p></td>
                    <td className="px-4 py-3 text-muted">{job.applicationCount || 0}</td>
                    <td className="px-4 py-3 capitalize text-muted">{job.moderationStatus || "pending"}</td>
                    <td className="px-4 py-3">
                      <Select aria-label={`Status for ${job.title}`} value={job.status} onChange={(event) => void updateStatus(job, event.target.value as JobRow["status"])}>
                        <option value="draft">Draft</option><option value="active">Active</option><option value="closed">Closed</option>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-muted">{new Date(job.createdAt).toLocaleDateString()}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>}
        </Card>
      </main>
    </>
  );
}