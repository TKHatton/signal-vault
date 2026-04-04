"use client";

import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  Shield,
  MessageSquare,
  CheckCheck,
  XOctagon,
  Send,
  Clock,
} from "lucide-react";
import { ApprovalDecision } from "@/lib/types";

interface ProposedChangeItem {
  field: string;
  current: string;
  proposed: string;
  platform: string;
  decision: ApprovalDecision;
}

const DEMO_CHANGES: ProposedChangeItem[] = [
  {
    field: "Business Description",
    current:
      "We are a digital marketing agency helping businesses grow online.",
    proposed:
      "Signal & Structure AI helps local businesses become discoverable by AI assistants like ChatGPT, Gemini, and Perplexity. We optimize Google Business Profiles, structured data, and content for the AI-first search landscape. Serving the greater metro area with transparent, auditable AI-powered marketing.",
    platform: "Google Business Profile",
    decision: "pending",
  },
  {
    field: "Business Categories",
    current: "Marketing agency",
    proposed:
      'Marketing agency, Internet marketing service, Business management consultant — Adding "Internet marketing service" and "Business management consultant" as secondary categories to increase visibility across AI-powered search and local discovery.',
    platform: "Google Business Profile",
    decision: "pending",
  },
  {
    field: "Business Hours",
    current: "Mon-Fri 9:00 AM - 5:00 PM",
    proposed:
      "Mon-Fri 8:00 AM - 6:00 PM, Sat 10:00 AM - 2:00 PM — Expanding hours to capture early morning and weekend search intent. AI assistants prioritize businesses with broader availability when recommending options.",
    platform: "Google Business Profile",
    decision: "pending",
  },
];

export default function ApprovePage() {
  const [changes, setChanges] = useState<ProposedChangeItem[]>(DEMO_CHANGES);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isDemo] = useState(true);

  const approvedCount = changes.filter((c) => c.decision === "approved").length;
  const rejectedCount = changes.filter((c) => c.decision === "rejected").length;
  const pendingCount = changes.filter((c) => c.decision === "pending").length;
  const allDecided = pendingCount === 0;

  const setDecision = (index: number, decision: ApprovalDecision) => {
    setChanges((prev) =>
      prev.map((c, i) => (i === index ? { ...c, decision } : c))
    );
  };

  const approveAll = () => {
    setChanges((prev) => prev.map((c) => ({ ...c, decision: "approved" })));
  };

  const rejectAll = () => {
    setChanges((prev) => prev.map((c) => ({ ...c, decision: "rejected" })));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title mb-2">Review Proposed Changes</h1>
        <p className="text-warm-gray">
          Your AI agent has proposed the following changes. Review each one
          before any action is taken.
        </p>
      </div>

      {/* Context banner */}
      <div className="card-static p-4 mb-6 flex items-start gap-3 border-l-4 border-l-copper">
        <Shield size={20} className="text-copper mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <div className="text-sm font-semibold text-navy">
                Google Business Profile
              </div>
              <div className="text-xs text-warm-gray">
                Agent: content-gen-agent &middot; Pipeline session active
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-warm-gray bg-stone px-2 py-1 rounded">
              <Clock size={12} />
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {isDemo && (
        <div className="mb-4 px-4 py-3 bg-copper/10 border border-copper/20 rounded-lg text-sm text-copper">
          Demo mode: This shows how clients review and approve individual
          changes before the agent executes them.
        </div>
      )}

      {/* Bulk actions */}
      {!submitted && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={approveAll}
            className="flex items-center gap-2 px-4 py-2 bg-green/10 text-green border border-green/20 rounded-lg text-sm font-medium hover:bg-green/20 transition-colors"
          >
            <CheckCheck size={14} />
            Approve All
          </button>
          <button
            onClick={rejectAll}
            className="flex items-center gap-2 px-4 py-2 bg-red/10 text-red border border-red/20 rounded-lg text-sm font-medium hover:bg-red/20 transition-colors"
          >
            <XOctagon size={14} />
            Reject All
          </button>
          <div className="text-sm text-warm-gray ml-auto">
            <span className="font-semibold text-navy">{approvedCount}</span>{" "}
            approved &middot;{" "}
            <span className="font-semibold text-navy">{rejectedCount}</span>{" "}
            rejected &middot;{" "}
            <span className="font-semibold text-navy">{pendingCount}</span>{" "}
            pending
          </div>
        </div>
      )}

      {/* Submitted confirmation */}
      {submitted && (
        <div className="card-static p-4 mb-6 flex items-start gap-3 border-l-4 border-l-green">
          <CheckCircle size={20} className="text-green mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-navy">
              Review submitted
            </div>
            <div className="text-sm text-warm-gray">
              {approvedCount} of {changes.length} changes approved. The agent
              will only execute approved changes. Rejected changes will not be
              applied.
            </div>
            {comment && (
              <div className="mt-2 text-sm text-warm-gray italic">
                Your note: &ldquo;{comment}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}

      {/* Change cards */}
      <div className="space-y-4 mb-8">
        {changes.map((change, index) => (
          <div
            key={index}
            className={`card-static overflow-hidden transition-all duration-300 stagger-item ${
              submitted && change.decision === "rejected"
                ? "opacity-60"
                : ""
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Card header */}
            <div
              className={`px-5 py-3 flex items-center justify-between border-b ${
                submitted
                  ? change.decision === "approved"
                    ? "border-green/30 bg-green/5"
                    : "border-red/30 bg-red/5"
                  : "border-border"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-navy">
                  {change.field}
                </span>
                <span className="text-[10px] font-mono text-warm-gray bg-stone px-1.5 py-0.5 rounded">
                  {change.platform}
                </span>
              </div>
              {submitted && (
                <span
                  className={`status-badge ${
                    change.decision === "approved"
                      ? "bg-green/10 text-green"
                      : "bg-red/10 text-red"
                  }`}
                >
                  {change.decision === "approved" ? "Approved" : "Rejected"}
                </span>
              )}
            </div>

            {/* Current vs Proposed */}
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current */}
                <div>
                  <div className="text-[10px] font-mono text-warm-gray uppercase tracking-wider mb-1.5">
                    Current
                  </div>
                  <div
                    className={`bg-stone rounded-lg p-3 text-sm text-navy/70 ${
                      submitted && change.decision === "approved"
                        ? "line-through opacity-50"
                        : ""
                    }`}
                  >
                    {change.current}
                  </div>
                </div>

                {/* Arrow on desktop */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                {/* Proposed */}
                <div>
                  <div className="text-[10px] font-mono text-warm-gray uppercase tracking-wider mb-1.5">
                    Proposed
                  </div>
                  <div
                    className={`rounded-lg p-3 text-sm ${
                      submitted && change.decision === "rejected"
                        ? "bg-red/5 text-navy/40 line-through"
                        : "bg-copper/5 border border-copper/15 text-navy"
                    }`}
                  >
                    {change.proposed}
                  </div>
                </div>
              </div>

              {/* Approval toggle */}
              {!submitted && (
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => setDecision(index, "approved")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      change.decision === "approved"
                        ? "bg-green text-white shadow-sm"
                        : "bg-green/10 text-green hover:bg-green/20"
                    }`}
                  >
                    <CheckCircle size={14} />
                    Approve
                  </button>
                  <button
                    onClick={() => setDecision(index, "rejected")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      change.decision === "rejected"
                        ? "bg-red text-white shadow-sm"
                        : "bg-red/10 text-red hover:bg-red/20"
                    }`}
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                  {change.decision !== "pending" && (
                    <button
                      onClick={() => setDecision(index, "pending")}
                      className="text-xs text-warm-gray hover:text-navy ml-2"
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Comment section */}
      {!submitted && (
        <div className="card-static p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={16} className="text-copper" />
            <h3 className="text-sm font-semibold text-navy">
              Instructions for the Agent
            </h3>
            <span className="text-xs text-warm-gray">(optional)</span>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g., Don't change the business hours, only update the description and categories"
            className="w-full bg-stone rounded-lg px-4 py-3 text-sm text-navy placeholder:text-warm-gray/60 outline-none focus:ring-2 focus:ring-copper/30 resize-none"
            rows={3}
          />
        </div>
      )}

      {/* Submit button */}
      {!submitted && (
        <div className="flex items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={!allDecided}
            className="btn btn-copper flex items-center gap-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            Submit Review
            {allDecided && (
              <span className="text-xs opacity-80 ml-1">
                ({approvedCount} approved, {rejectedCount} rejected)
              </span>
            )}
          </button>
          {!allDecided && (
            <span className="text-sm text-warm-gray">
              Review all {pendingCount} remaining{" "}
              {pendingCount === 1 ? "change" : "changes"} to submit
            </span>
          )}
        </div>
      )}

      {/* Post-submission: what happens next */}
      {submitted && (
        <div className="card-static p-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight size={16} className="text-copper" />
            <h3 className="text-sm font-semibold text-navy">What happens next</h3>
          </div>
          <div className="space-y-2 text-sm text-warm-gray">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-copper/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-copper">4</span>
              </div>
              <span>
                <span className="font-medium text-navy">Permission Validation</span>{" "}
                — Token Vault token will be re-checked before execution
              </span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-copper/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-copper">5</span>
              </div>
              <span>
                <span className="font-medium text-navy">Execution</span> — Only
                the {approvedCount} approved{" "}
                {approvedCount === 1 ? "change" : "changes"} will be applied
              </span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-copper/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-copper">6-7</span>
              </div>
              <span>
                <span className="font-medium text-navy">
                  Post-Check & Audit
                </span>{" "}
                — Changes verified and trust report generated
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
