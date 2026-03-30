"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileCheck, ChevronRight, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ReportSummary {
  id: string;
  connection: string;
  action_summary: string | null;
  overall_status: "passed" | "failed" | "partial";
  pre_check: { passed: boolean } | null;
  human_approval: { passed: boolean } | null;
  permission_validation: { passed: boolean } | null;
  execution: { passed: boolean } | null;
  post_check: { passed: boolean } | null;
  session_id: string;
  created_at: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/reports");
        if (res.ok) {
          const data = await res.json();
          setReports(data.reports);
        }
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-copper" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title mb-2">Trust Reports</h1>
        <p className="text-warm-gray">
          Every agent session generates a trust report showing all 7
          verification steps passed or failed. This is your proof that
          credentials were handled safely.
        </p>
      </div>

      {/* Report cards */}
      <div className="space-y-4">
        {reports.map((report) => {
          const checks = [
            report.pre_check,
            report.human_approval,
            report.permission_validation,
            report.execution,
            report.post_check,
          ];
          const passedCount = checks.filter((c) => c?.passed).length;

          return (
            <Link
              key={report.id}
              href={`/reports/${report.id}`}
              className="card p-5 block"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      report.overall_status === "passed"
                        ? "bg-green/10"
                        : "bg-red/10"
                    }`}
                  >
                    {report.overall_status === "passed" ? (
                      <CheckCircle size={20} className="text-green" />
                    ) : (
                      <XCircle size={20} className="text-red" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy">
                      {report.action_summary || "Agent verification session"}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className={`status-badge ${
                          report.overall_status === "passed"
                            ? "bg-green/10 text-green"
                            : "bg-red/10 text-red"
                        }`}
                      >
                        {report.overall_status}
                      </span>
                      <span className="text-xs font-mono text-warm-gray">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-xs font-mono text-warm-gray">
                        Session: {report.session_id.slice(0, 12)}...
                      </span>
                    </div>

                    {/* Mini verification summary */}
                    <div className="flex items-center gap-1.5 mt-3">
                      {checks.map((check, i) => (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            check?.passed
                              ? "bg-green/10 text-green"
                              : "bg-red/10 text-red"
                          }`}
                        >
                          {check?.passed ? (
                            <CheckCircle size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                        </div>
                      ))}
                      <span className="text-[10px] text-warm-gray ml-2">
                        {passedCount}/5 checks passed
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-warm-gray mt-2" />
              </div>
            </Link>
          );
        })}

        {reports.length === 0 && (
          <div className="card-static p-8 text-center">
            <FileCheck size={32} className="text-warm-gray/40 mx-auto mb-3" />
            <p className="text-warm-gray">
              No trust reports yet. Run an agent task to generate your first
              report.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
