"use client";
import { useCallback, useEffect, useState } from "react";
import Topbar from "@/components/layout/Topbar";
import Card from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import api, { errText } from "@/api/axios";
import { ep } from "@/api/endpoints";

interface ReportRow {
  _id: string;
  reporter?: { name: string; email: string };
  targetType: string;
  targetId: string;
  reason: string;
  description?: string;
  status: "open" | "under_review" | "resolved" | "dismissed";
  resolutionNote?: string;
  createdAt: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    try {
      const { data } = await api.get(ep.admin.reports, { params: { limit: 100 } });
      setReports(data.data || []);
      setError("");
    } catch (cause) {
      setError(errText(cause, "Could not load reports"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadReports(); }, [loadReports]);

  const updateStatus = async (report: ReportRow, status: ReportRow["status"]) => {
    try {
      await api.patch(ep.admin.report(report._id), { status, resolutionNote: report.resolutionNote || "" });
      await loadReports();
    } catch (cause) {
      setError(errText(cause, "Could not update this report"));
    }
  };

  return (
    <>
      <Topbar title="Reports" subtitle="Review and resolve community reports" />
      <main className="w-full px-5 py-7 lg:px-9 full-width">
        {error && <p role="alert" className="mb-4 text-sm text-stage-rejected">{error}</p>}
        <Card className="overflow-hidden">
          {loading ? <p className="p-5 text-sm text-muted">Loading reports...</p> : reports.length === 0 ? <p className="p-5 text-sm text-muted">No reports to review.</p> :
            <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-line-soft text-[12px] uppercase text-muted"><tr><th className="px-4 py-3 font-medium">Report</th><th className="px-4 py-3 font-medium">Target</th><th className="px-4 py-3 font-medium">Submitted by</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Status</th></tr></thead>
              <tbody className="divide-y divide-line-soft">{reports.map((report) => <tr key={report._id}>
                <td className="max-w-[360px] px-4 py-3"><p className="font-medium text-ink">{report.reason}</p>{report.description && <p className="mt-1 text-xs text-muted">{report.description}</p>}</td>
                <td className="px-4 py-3"><p className="capitalize text-ink">{report.targetType}</p><p className="max-w-[140px] truncate text-xs text-muted">{report.targetId}</p></td>
                <td className="px-4 py-3 text-muted">{report.reporter?.name || report.reporter?.email || "Unknown"}</td>
                <td className="px-4 py-3 text-muted">{new Date(report.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3"><Select aria-label={`Report status for ${report.reason}`} value={report.status} onChange={(event) => void updateStatus(report, event.target.value as ReportRow["status"])}>
                  <option value="open">Open</option><option value="under_review">Under review</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option>
                </Select></td>
              </tr>)}</tbody>
            </table></div>}
        </Card>
      </main>
    </>
  );
}