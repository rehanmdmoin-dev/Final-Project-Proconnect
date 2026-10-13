"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { StageBadge } from "@/components/ui/Stage";
import api, { errText } from "@/api/axios";
import { ep } from "@/api/endpoints";
import type { Stage } from "@/redux/slice/applicationSlice";

interface Applicant {
  _id: string;
  status: Stage;
  createdAt: string;
  coverLetter?: string;
  candidate?: {
    name?: string;
    email?: string;
    headline?: string;
    avatar?: string;
    profileImage?: string;
    user?: { name?: string; email?: string; avatar?: string; profileImage?: string };
  };
}

const STAGES: Stage[] = ["Applied", "Under Review", "Shortlisted", "Interview", "Selected", "Rejected"];

export default function JobApplicantsPage() {
  const { id: jobId } = useParams<{ id: string }>();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    api.get(ep.jobs.applicants(jobId), { params: { limit: 100 } })
      .then(({ data }) => {
        if (active) setApplicants(data.data || []);
      })
      .catch((cause) => {
        if (active) setError(errText(cause, "Could not load applicants"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [jobId]);

  const updateStatus = async (applicant: Applicant, status: Stage) => {
    setUpdatingId(applicant._id);
    setError("");
    try {
      await api.patch(ep.applications.status(applicant._id), { status });
      setApplicants((current) => current.map((item) =>
        item._id === applicant._id ? { ...item, status } : item
      ));
    } catch (cause) {
      setError(errText(cause, "Could not update this applicant"));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <Topbar title="Applicants" subtitle="Review candidates and update their stage" />
      <main className="w-full px-5 py-7 lg:px-9">
        <Link href="/dashboard/jobs" className="mb-5 inline-flex items-center gap-2 text-[13px] font-medium text-muted hover:text-ink">
          <ArrowLeft size={15} /> Back to jobs
        </Link>
        {error && <p role="alert" className="mb-4 text-sm text-stage-rejected">{error}</p>}
        <Card className="overflow-hidden">
          {loading ? (
            <p className="p-5 text-sm text-muted">Loading applicants...</p>
          ) : applicants.length === 0 ? (
            <EmptyState icon={Users} title="No applicants yet" body="Applicants for this opening will appear here." />
          ) : (
            <ul className="divide-y divide-line-soft">
              {applicants.map((applicant) => {
                const candidate = applicant.candidate;
                const name = candidate?.name || candidate?.user?.name || "Candidate";
                const email = candidate?.email || candidate?.user?.email;
                const avatar = candidate?.avatar || candidate?.profileImage || candidate?.user?.avatar || candidate?.user?.profileImage;

                return (
                  <li key={applicant._id} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                    <Avatar name={name} src={avatar} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{name}</p>
                      {email && <p className="mt-0.5 text-[13px] text-muted">{email}</p>}
                      {candidate?.headline && <p className="mt-0.5 text-[13px] text-muted">{candidate.headline}</p>}
                      <p className="mt-1 text-xs text-muted-2">Applied {new Date(applicant.createdAt).toLocaleDateString()}</p>
                      {applicant.coverLetter && <p className="mt-3 max-w-3xl whitespace-pre-wrap text-[13px] leading-relaxed text-muted">{applicant.coverLetter}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <StageBadge stage={applicant.status} />
                      <Select
                        aria-label={`Update stage for ${name}`}
                        value={applicant.status}
                        disabled={updatingId === applicant._id}
                        onChange={(event) => void updateStatus(applicant, event.target.value as Stage)}
                        className="w-[160px]"
                      >
                        {STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                      </Select>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </main>
    </>
  );
}