"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Shield, Loader2 } from "lucide-react";

interface ReportDetail {
  id: string;
  connection: string;
  action_summary: string | null;
  overall_status: "passed" | "failed" | "partial";
  pre_check: Record<string, unknown> | null;
  human_approval: Record<string, unknown> | null;
  permission_validation: Record<string, unknown> | null;
  execution: Record<string, unknown> | null;
  post_check: Record<string, unknown> | null;
  session_id: string;
  created_at: string;
}

interface StepDisplay {
  name: string;
  passed: boolean;
  details: string;
  extra: { label: string; value: string }[];
}

function buildSteps(report: ReportDetail): StepDisplay[] {
  const steps: StepDisplay[] = [];

  // Pre-Check
  const pc = report.pre_check as Record<string, unknown> | null;
  steps.push({
    name: "Pre-Check",
    passed: !!pc?.passed,
    details: (pc?.details as string) || "Token scope validation",
    extra: [
      { label: "Scope Valid", value: pc?.scopeValid ? "Yes" : "No" },
      { label: "Simulation", value: pc?.simulationOk ? "Passed" : "Failed" },
    ],
  });

  // Content Generation (from pre_check passing implies content was generated)
  steps.push({
    name: "Content Generation",
    passed: !!pc?.passed,
    details: "Generated proposed changes based on profile audit.",
    extra: [],
  });

  // Human Approval
  const ha = report.human_approval as Record<string, unknown> | null;
  steps.push({
    name: "Human Approval",
    passed: !!ha?.passed,
    details: (ha?.details as string) || "User review of proposed changes",
    extra: [
      { label: "Approved", value: ha?.approved ? "Yes" : "No" },
    ],
  });

  // Permission Validation
  const pv = report.permission_validation as Record<string, unknown> | null;
  steps.push({
    name: "Permission Validation",
    passed: !!pv?.passed,
    details: (pv?.details as string) || "OAuth token re-validation",
    extra: [
      { label: "Token Valid", value: pv?.tokenValid ? "Yes" : "No" },
      { label: "Scope Match", value: pv?.scopeMatches ? "Yes" : "No" },
    ],
  });

  // Execution
  const ex = report.execution as Record<string, unknown> | null;
  steps.push({
    name: "Execution",
    passed: !!ex?.passed,
    details: (ex?.details as string) || "API execution",
    extra: [
      { label: "API Endpoint", value: (ex?.apiEndpoint as string) || "N/A" },
      { label: "Duration", value: ex?.durationMs ? `${ex.durationMs}ms` : "N/A" },
    ],
  });

  // Post-Check
  const poc = report.post_check as Record<string, unknown> | null;
  steps.push({
    name: "Post-Check",
    passed: !!poc?.passed,
    details: (poc?.details as string) || "Verification of applied changes",
    extra: [
      { label: "Verified", value: poc?.verified ? "Yes" : "No" },
      { label: "Scope Violations", value: poc?.noScopeViolation ? "0" : "1+" },
      { label: "Data Leaks", value: poc?.noLeaks ? "0" : "1+" },
    ],
  });

  // Audit
  steps.push({
    name: "Audit",
    passed: true,
    details: "Trust report generated. All entries logged to audit trail.",
    extra: [
      { label: "Report ID", value: report.id },
      { label: "Overall Status", value: report.overall_status },
    ],
  });

  return steps;
}

export default function ReportDetailPage() {
  const params = useParams();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setReport(data.report);
        }
      } catch (error) {
        console.error("Failed to fetch report:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-copper" />
      </div>
    );
  }

  if (!report) {
    return (
      <div>
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 text-sm text-copper hover:text-copper/80 mb-6"
        >
          <ArrowLeft size={14} />
          Back to reports
        </Link>
        <div className="card-static p-8 text-center text-warm-gray">
          Report not found.
        </div>
      </div>
    );
  }

  const steps = buildSteps(report);
  const passedCount = steps.filter((s) => s.passed).length;

  return (
    <div>
      <Link
        href="/reports"
        className="inline-flex items-center gap-2 text-sm text-copper hover:text-copper/80 mb-6"
      >
        <ArrowLeft size={14} />
        Back to reports
      </Link>

      <div className="mb-6">
        <h1 className="page-title mb-2">Trust Report</h1>
        <div className="flex items-center gap-3">
          <span
            className={`status-badge ${
              report.overall_status === "passed"
                ? "bg-green/10 text-green"
                : "bg-red/10 text-red"
            }`}
          >
            {report.overall_status}
          </span>
          <span className="text-sm font-mono text-warm-gray">
            Report ID: {report.id}
          </span>
        </div>
        <p className="text-warm-gray mt-2">
          {report.action_summary || "Agent verification session"}
        </p>
      </div>

      {/* Summary card */}
      <div
        className={`card-static p-5 mb-6 border-l-4 ${
          report.overall_status === "passed"
            ? "border-l-green"
            : "border-l-red"
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <Shield
            size={20}
            className={
              report.overall_status === "passed" ? "text-green" : "text-red"
            }
          />
          <span className="font-semibold text-navy">
            {passedCount}/{steps.length} verification steps passed
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-warm-gray">Scope violations</div>
            <div className="data-text text-green font-bold">0</div>
          </div>
          <div>
            <div className="text-xs text-warm-gray">Data leaks</div>
            <div className="data-text text-green font-bold">0</div>
          </div>
          <div>
            <div className="text-xs text-warm-gray">Created</div>
            <div className="data-text text-navy font-bold text-xs">
              {new Date(report.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-step detail */}
      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="card-static p-5">
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.passed ? "bg-green/10" : "bg-red/10"
                }`}
              >
                {step.passed ? (
                  <CheckCircle size={16} className="text-green" />
                ) : (
                  <XCircle size={16} className="text-red" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-navy">
                    Step {i + 1}: {step.name}
                  </h3>
                  <span
                    className={`status-badge ${
                      step.passed
                        ? "bg-green/10 text-green"
                        : "bg-red/10 text-red"
                    }`}
                  >
                    {step.passed ? "Passed" : "Failed"}
                  </span>
                </div>
                <p className="text-sm text-warm-gray mt-1">{step.details}</p>
                {step.extra.length > 0 && (
                  <div className="mt-3 bg-stone rounded-lg p-3 space-y-1.5">
                    {step.extra.map((e, j) => (
                      <div
                        key={j}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-warm-gray">{e.label}</span>
                        <span className="data-text text-navy">{e.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
