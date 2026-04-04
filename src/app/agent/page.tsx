"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  User,
  Bot,
  Play,
  ShieldOff,
  ClipboardCheck,
} from "lucide-react";
import { VerificationStepState, StepStatus, ApprovalDecision } from "@/lib/types";

const INITIAL_STEPS: VerificationStepState[] = [
  { step: "pre_check", label: "Pre-Check", status: "pending", details: "Validate token scope and simulate request" },
  { step: "content_gen", label: "Content Generation", status: "pending", details: "AI creates proposed changes" },
  { step: "human_review", label: "Human Approval", status: "pending", details: "Review and approve changes" },
  { step: "permission_validate", label: "Permission Validation", status: "pending", details: "Re-verify OAuth is valid" },
  { step: "execute", label: "Execution", status: "pending", details: "Apply changes via Token Vault" },
  { step: "post_check", label: "Post-Check", status: "pending", details: "Verify changes applied correctly" },
  { step: "audit", label: "Audit", status: "pending", details: "Generate trust report" },
];

const STEP_KEYS = [
  "preCheck",
  "contentGen",
  "humanReview",
  "permissionValidate",
  "execute",
  "postCheck",
  "audit",
] as const;

function StepIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "passed":
      return <CheckCircle size={18} className="text-green" />;
    case "failed":
      return <XCircle size={18} className="text-red" />;
    case "active":
      return <Loader2 size={18} className="text-copper animate-spin" />;
    case "waiting":
      return <Clock size={18} className="text-amber" />;
    default:
      return <div className="w-[18px] h-[18px] rounded-full border-2 border-border" />;
  }
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

// Demo simulation data
const DEMO_STEPS_SUCCESS = [
  {
    delay: 1200,
    stepIndex: 0,
    status: "passed" as StepStatus,
    details: "Token validated. Scope: google-oauth2. Expiry: valid for 52 minutes.",
    message: "Pre-check passed. Token Vault token is fresh, correctly scoped for Google OAuth2, and not expired. Proceeding to content generation.",
  },
  {
    delay: 2000,
    stepIndex: 1,
    status: "passed" as StepStatus,
    details: "Generated 3 proposed changes using S&S methodology.",
    message: "Content generated using Signal & Structure methodology.\n\nProposed changes:\n1. Business Description — Update to include AI discoverability keywords and service areas\n2. Business Hours — Add holiday hours for upcoming period\n3. Business Categories — Add \"Internet marketing service\" as secondary category\n\nPlease review and approve these changes to proceed.",
  },
  {
    delay: 1500,
    stepIndex: 2,
    status: "passed" as StepStatus,
    details: "Client approved all 3 proposed changes.",
    message: "Changes approved. Re-validating permissions before execution...",
  },
  {
    delay: 1000,
    stepIndex: 3,
    status: "passed" as StepStatus,
    details: "Token re-validated. Still active and scoped correctly.",
    message: "Permission re-validation passed. Token is still valid and scopes match. The client has not revoked access. Executing approved changes...",
  },
  {
    delay: 2200,
    stepIndex: 4,
    status: "passed" as StepStatus,
    details: 'Connected to "Signal & Structure AI" via Token Vault. Found 3 issues. Applied 2 changes in 1847ms.',
    message: 'Execution complete using Token Vault token.\n\nBusiness: Signal & Structure AI\nCompleteness Score: 72/100\n\nIssues found:\n- Description is generic (missing AI discoverability focus)\n- No holiday hours set\n- Missing secondary business category\n\nChanges applied:\n1. Updated description: "Signal & Structure AI helps businesses become discoverable by AI systems..."\n2. Added secondary category: "Internet marketing service"\n\nRunning post-execution verification...',
  },
  {
    delay: 1000,
    stepIndex: 5,
    status: "passed" as StepStatus,
    details: "All changes verified. No scope violations. No data leaks.",
    message: "Post-check passed. Changes verified against approved list. No unauthorized modifications detected. No data leaked outside approved scope.",
  },
  {
    delay: 800,
    stepIndex: 6,
    status: "passed" as StepStatus,
    details: "Trust report generated and saved. Report ID: TR-demo-001.",
    message: "Audit complete. Trust report generated.\n\nSummary:\n- Steps passed: 7/7\n- Scope violations: 0\n- Data leaks: 0\n- Changes applied: 2\n- Duration: 9.7s\n\nAll actions have been logged to your Activity Log. View the full Trust Report in the Reports tab.",
  },
];

const DEMO_STEPS_REVOCATION = [
  {
    delay: 1200,
    stepIndex: 0,
    status: "passed" as StepStatus,
    details: "Token validated. Scope: google-oauth2. Expiry: valid for 48 minutes.",
    message: "Pre-check passed. Token Vault token is valid and scoped correctly.",
  },
  {
    delay: 2000,
    stepIndex: 1,
    status: "passed" as StepStatus,
    details: "Generated 2 proposed changes using S&S methodology.",
    message: "Content generated.\n\nProposed changes:\n1. Business Description — Rewrite for AI discoverability\n2. Service Area — Expand to include neighboring cities\n\nWaiting for client approval...",
  },
  {
    delay: 1500,
    stepIndex: 2,
    status: "passed" as StepStatus,
    details: "Client approved proposed changes.",
    message: "Changes approved. Re-validating permissions before execution...",
  },
  {
    delay: 1800,
    stepIndex: 3,
    status: "failed" as StepStatus,
    details: "TOKEN REVOKED. Client disconnected during pipeline execution.",
    message: "PERMISSION CHECK FAILED: Token Vault returned no token. The client has revoked access to their Google account.\n\nThe agent has been stopped immediately. No changes were made. The approved changes from Step 2 were never applied.\n\nThis revocation has been logged in the audit trail as proof that execution was blocked.",
  },
  {
    delay: 0, // skip execute
    stepIndex: 4,
    status: "failed" as StepStatus,
    details: "Skipped — access revoked before execution.",
    message: null,
  },
  {
    delay: 0, // skip post-check
    stepIndex: 5,
    status: "failed" as StepStatus,
    details: "Skipped — access revoked before execution.",
    message: null,
  },
  {
    delay: 1000,
    stepIndex: 6,
    status: "passed" as StepStatus,
    details: "Trust report generated. Revocation documented.",
    message: "Audit complete. Trust report generated.\n\nSummary:\n- Pipeline halted at Step 4: Permission Validation\n- Reason: Client revoked access mid-session\n- Changes applied: 0 (execution never reached)\n- Scope violations: 0\n- The revocation timestamp and blocked execution are recorded in the trust report.\n\nThis is exactly how the system is designed to work. The client is always in control.",
  },
];

// Inline review card proposed changes
const REVIEW_DEMO_CHANGES = [
  {
    field: "Business Description",
    current: "We are a digital marketing agency helping businesses grow online.",
    proposed: "Signal & Structure AI helps local businesses become discoverable by AI assistants like ChatGPT, Gemini, and Perplexity. We optimize Google Business Profiles, structured data, and content for the AI-first search landscape.",
    platform: "Google Business Profile",
  },
  {
    field: "Business Categories",
    current: "Marketing agency",
    proposed: 'Marketing agency, Internet marketing service, Business management consultant',
    platform: "Google Business Profile",
  },
  {
    field: "Business Hours",
    current: "Mon-Fri 9:00 AM - 5:00 PM",
    proposed: "Mon-Fri 8:00 AM - 6:00 PM, Sat 10:00 AM - 2:00 PM",
    platform: "Google Business Profile",
  },
];

function InlineApprovalCard({
  changes,
  onSubmit,
}: {
  changes: typeof REVIEW_DEMO_CHANGES;
  onSubmit: (approved: number, rejected: number, comment: string) => void;
}) {
  const [decisions, setDecisions] = useState<ApprovalDecision[]>(
    changes.map(() => "pending")
  );
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const approvedCount = decisions.filter((d) => d === "approved").length;
  const rejectedCount = decisions.filter((d) => d === "rejected").length;
  const allDecided = decisions.every((d) => d !== "pending");

  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit(approvedCount, rejectedCount, comment);
  };

  if (submitted) {
    return (
      <div className="bg-green/5 border border-green/20 rounded-xl p-4 text-sm">
        <div className="flex items-center gap-2 text-green font-medium mb-1">
          <CheckCircle size={14} />
          Review submitted
        </div>
        <div className="text-navy/70">
          {approvedCount} approved, {rejectedCount} rejected.
          {comment && <span className="italic"> Note: &ldquo;{comment}&rdquo;</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-copper/20 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-copper/5 border-b border-copper/15">
        <div className="flex items-center gap-2 text-sm font-semibold text-navy">
          <ClipboardCheck size={14} className="text-copper" />
          Review Proposed Changes
        </div>
        <div className="text-xs text-warm-gray mt-0.5">
          Approve or reject each change individually before the agent proceeds.
        </div>
      </div>

      <div className="divide-y divide-border">
        {changes.map((change, i) => (
          <div key={i} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-navy">{change.field}</span>
              <span className="text-[9px] font-mono text-warm-gray bg-stone px-1.5 py-0.5 rounded">
                {change.platform}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 mb-3">
              <div className="bg-stone rounded-lg p-2.5 text-xs text-navy/60">
                <span className="text-[9px] font-mono text-warm-gray uppercase">Current: </span>
                {change.current}
              </div>
              <div className="bg-copper/5 border border-copper/10 rounded-lg p-2.5 text-xs text-navy">
                <span className="text-[9px] font-mono text-copper uppercase">Proposed: </span>
                {change.proposed}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setDecisions((prev) => prev.map((d, j) => (j === i ? "approved" : d)))
                }
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  decisions[i] === "approved"
                    ? "bg-green text-white"
                    : "bg-green/10 text-green hover:bg-green/20"
                }`}
              >
                <CheckCircle size={12} />
                Approve
              </button>
              <button
                onClick={() =>
                  setDecisions((prev) => prev.map((d, j) => (j === i ? "rejected" : d)))
                }
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  decisions[i] === "rejected"
                    ? "bg-red text-white"
                    : "bg-red/10 text-red hover:bg-red/20"
                }`}
              >
                <XCircle size={12} />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add instructions for the agent (optional)..."
          className="w-full bg-stone rounded-lg px-3 py-2 text-xs text-navy placeholder:text-warm-gray/60 outline-none focus:ring-2 focus:ring-copper/30 resize-none mb-3"
          rows={2}
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={!allDecided}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-copper text-white rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-copper/90 transition-colors"
          >
            <Send size={12} />
            Submit Review ({approvedCount} approved, {rejectedCount} rejected)
          </button>
          {!allDecided && (
            <span className="text-[10px] text-warm-gray">
              Review all changes to submit
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content:
        "Signal Vault Agent ready. Connect your accounts in the Vault tab, then tell me what you need updated. Or try the demo modes below to see the full pipeline in action.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [steps, setSteps] = useState<VerificationStepState[]>(INITIAL_STEPS);
  const [isRunning, setIsRunning] = useState(false);
  const [showReviewCard, setShowReviewCard] = useState(false);
  const [reviewDemoPhase, setReviewDemoPhase] = useState<"idle" | "pre" | "review" | "post">("idle");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runReviewDemo = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setShowReviewCard(false);
    setReviewDemoPhase("pre");

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: "Optimize my Google Business Profile for AI discoverability",
        timestamp: new Date().toISOString(),
      },
      {
        role: "system",
        content: "Running demo: Client reviews and approves individual changes",
        timestamp: new Date().toISOString(),
      },
    ]);

    // Reset steps
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "pending" as StepStatus })));

    // Step 1: Pre-Check
    setSteps((prev) =>
      prev.map((s, i) => (i === 0 ? { ...s, status: "active" as StepStatus } : s))
    );
    await sleep(1200);
    const ts1 = new Date().toISOString();
    setSteps((prev) =>
      prev.map((s, i) =>
        i === 0
          ? { ...s, status: "passed", details: "Token validated. Scope: google-oauth2. Expiry: valid for 55 minutes.", timestamp: ts1 }
          : s
      )
    );
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Pre-check passed. Token Vault token is valid and correctly scoped.", timestamp: ts1 },
    ]);

    // Step 2: Content Generation
    setSteps((prev) =>
      prev.map((s, i) => (i === 1 ? { ...s, status: "active" as StepStatus } : s))
    );
    await sleep(2000);
    const ts2 = new Date().toISOString();
    setSteps((prev) =>
      prev.map((s, i) =>
        i === 1
          ? { ...s, status: "passed", details: "Generated 3 proposed changes using S&S methodology.", timestamp: ts2 }
          : s
      )
    );
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Content generated. 3 proposed changes ready for your review.\n\nPlease review each change individually below. You can approve, reject, or add comments before the agent proceeds.", timestamp: ts2 },
    ]);

    // Step 3: Human Review — show inline approval card
    setSteps((prev) =>
      prev.map((s, i) => (i === 2 ? { ...s, status: "waiting" as StepStatus, details: "Waiting for client to review proposed changes..." } : s))
    );
    setShowReviewCard(true);
    setReviewDemoPhase("review");
    setIsRunning(false); // Allow interaction with the review card
  };

  const handleReviewSubmit = async (approved: number, rejected: number, comment: string) => {
    setIsRunning(true);
    setShowReviewCard(false);
    setReviewDemoPhase("post");

    const ts3 = new Date().toISOString();
    setSteps((prev) =>
      prev.map((s, i) =>
        i === 2
          ? { ...s, status: "passed", details: `Client reviewed: ${approved} approved, ${rejected} rejected.`, timestamp: ts3 }
          : s
      )
    );
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Review received: ${approved} changes approved, ${rejected} rejected.${comment ? `\n\nClient note: "${comment}"` : ""}\n\nRe-validating permissions before executing approved changes...`,
        timestamp: ts3,
      },
    ]);

    // Step 4: Permission Validation
    setSteps((prev) =>
      prev.map((s, i) => (i === 3 ? { ...s, status: "active" as StepStatus } : s))
    );
    await sleep(1000);
    const ts4 = new Date().toISOString();
    setSteps((prev) =>
      prev.map((s, i) =>
        i === 3
          ? { ...s, status: "passed", details: "Token re-validated. Still active and scoped correctly.", timestamp: ts4 }
          : s
      )
    );
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Permission re-validation passed. Token is still valid. Client has not revoked access. Executing only approved changes...", timestamp: ts4 },
    ]);

    // Step 5: Execution (only approved changes)
    setSteps((prev) =>
      prev.map((s, i) => (i === 4 ? { ...s, status: "active" as StepStatus } : s))
    );
    await sleep(2200);
    const ts5 = new Date().toISOString();
    setSteps((prev) =>
      prev.map((s, i) =>
        i === 4
          ? { ...s, status: "passed", details: `Executed ${approved} of 3 changes via Token Vault. ${rejected} rejected changes were NOT applied.`, timestamp: ts5 }
          : s
      )
    );
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Execution complete.\n\nApplied ${approved} approved changes via Token Vault token.\nSkipped ${rejected} rejected ${rejected === 1 ? "change" : "changes"} — not applied per client decision.\n\nNo unauthorized modifications. Running post-check...`,
        timestamp: ts5,
      },
    ]);

    // Step 6: Post-Check
    setSteps((prev) =>
      prev.map((s, i) => (i === 5 ? { ...s, status: "active" as StepStatus } : s))
    );
    await sleep(1000);
    const ts6 = new Date().toISOString();
    setSteps((prev) =>
      prev.map((s, i) =>
        i === 5
          ? { ...s, status: "passed", details: "Verified: only approved changes applied. No scope violations.", timestamp: ts6 }
          : s
      )
    );
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Post-check passed. Only approved changes were applied. No scope violations. No data leaks.", timestamp: ts6 },
    ]);

    // Step 7: Audit
    setSteps((prev) =>
      prev.map((s, i) => (i === 6 ? { ...s, status: "active" as StepStatus } : s))
    );
    await sleep(800);
    const ts7 = new Date().toISOString();
    setSteps((prev) =>
      prev.map((s, i) =>
        i === 6
          ? { ...s, status: "passed", details: "Trust report generated. Report ID: TR-demo-review-001.", timestamp: ts7 }
          : s
      )
    );
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Audit complete. Trust report generated.\n\nSummary:\n- Steps passed: 7/7\n- Changes proposed: 3\n- Changes approved: ${approved}\n- Changes rejected: ${rejected}\n- Changes applied: ${approved}\n- Scope violations: 0\n- Data leaks: 0\n\nThe client reviewed each change individually. Only approved changes were executed. The full decision record is saved in the trust report.`,
        timestamp: ts7,
      },
    ]);

    setIsRunning(false);
    setReviewDemoPhase("idle");
  };

  const runDemo = async (mode: "success" | "revocation") => {
    if (isRunning) return;
    setIsRunning(true);
    setShowReviewCard(false);
    setReviewDemoPhase("idle");

    const demoSteps = mode === "success" ? DEMO_STEPS_SUCCESS : DEMO_STEPS_REVOCATION;
    const demoLabel = mode === "success" ? "Audit my Google Business Profile and suggest improvements" : "Update my business description and service area";

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: demoLabel,
        timestamp: new Date().toISOString(),
      },
      {
        role: "system",
        content: mode === "success"
          ? "Running demo: Full pipeline execution with Token Vault"
          : "Running demo: Mid-session revocation detection",
        timestamp: new Date().toISOString(),
      },
    ]);

    // Reset steps
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "pending" as StepStatus })));

    for (const step of demoSteps) {
      if (step.delay > 0) {
        // Set step active
        setSteps((prev) =>
          prev.map((s, i) =>
            i === step.stepIndex ? { ...s, status: "active" as StepStatus } : s
          )
        );
        await sleep(step.delay);
      }

      // Set step result
      const ts = new Date().toISOString();
      setSteps((prev) =>
        prev.map((s, i) =>
          i === step.stepIndex
            ? { ...s, status: step.status, details: step.details, timestamp: ts }
            : s
        )
      );

      // Add message
      if (step.message) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: step.message!,
            timestamp: ts,
          },
        ]);
      }
    }

    setIsRunning(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isRunning) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsRunning(true);
    setShowReviewCard(false);

    // Reset steps
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "pending" as StepStatus })));

    try {
      // Set first step active
      setSteps((prev) =>
        prev.map((s, i) => (i === 0 ? { ...s, status: "active" as StepStatus } : s))
      );

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          connection: "google-oauth2",
        }),
      });

      if (!res.ok) {
        throw new Error("Pipeline failed");
      }

      const data = await res.json();

      // Extract messages from the API response
      const assistantMessages: string[] = data.messages
        ? data.messages
            .filter((m: { role: string }) => m.role === "assistant")
            .map((m: { content: string }) => m.content)
        : [];

      // Display results progressively with timing — animate each step
      let msgIndex = 0;
      for (let i = 0; i < STEP_KEYS.length; i++) {
        const key = STEP_KEYS[i];
        const result = data.stepResults?.[key];
        if (!result) continue;

        // Set step to active
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: "active" as StepStatus } : s
          )
        );

        // Wait for visual effect
        const delay = i === 1 ? 2000 : i === 4 ? 2200 : 1200;
        await sleep(delay);

        // Set step result
        const ts = new Date().toISOString();
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === i
              ? {
                  ...s,
                  status: result.passed ? ("passed" as StepStatus) : ("failed" as StepStatus),
                  details: result.details || s.details,
                  timestamp: ts,
                }
              : s
          )
        );

        // Add the corresponding message
        if (msgIndex < assistantMessages.length) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: assistantMessages[msgIndex],
              timestamp: ts,
            },
          ]);
          msgIndex++;
        }

        // If this step failed, mark remaining steps as failed and stop
        if (!result.passed) {
          for (let j = i + 1; j < STEP_KEYS.length; j++) {
            const skipKey = STEP_KEYS[j];
            const skipResult = data.stepResults?.[skipKey];
            if (skipResult) {
              setSteps((prev) =>
                prev.map((s, idx) =>
                  idx === j
                    ? {
                        ...s,
                        status: skipResult.passed ? ("passed" as StepStatus) : ("failed" as StepStatus),
                        details: skipResult.details || s.details,
                        timestamp: ts,
                      }
                    : s
                )
              );
            }
          }
          // Add any remaining messages
          while (msgIndex < assistantMessages.length) {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: assistantMessages[msgIndex],
                timestamp: new Date().toISOString(),
              },
            ]);
            msgIndex++;
          }
          break;
        }
      }

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Pipeline note: ${data.error}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Agent error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "An error occurred while running the verification pipeline. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 48px)" }}>
      <div className="mb-4 flex-shrink-0">
        <h1 className="page-title mb-2">Agent Workspace</h1>
        <p className="text-warm-gray">
          Tell the agent what needs updating. Every action goes through 7
          verification steps.
        </p>
      </div>

      {/* Demo mode buttons */}
      <div className="mb-4 flex flex-wrap gap-3 flex-shrink-0">
        <button
          onClick={() => runDemo("success")}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2.5 bg-green/10 text-green border border-green/20 rounded-lg text-sm font-medium hover:bg-green/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={14} />
          Try Demo: Full Pipeline
        </button>
        <button
          onClick={() => runDemo("revocation")}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2.5 bg-red/10 text-red border border-red/20 rounded-lg text-sm font-medium hover:bg-red/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShieldOff size={14} />
          Try Demo: Mid-Session Revocation
        </button>
        <button
          onClick={runReviewDemo}
          disabled={isRunning && reviewDemoPhase !== "review"}
          className="flex items-center gap-2 px-4 py-2.5 bg-copper/10 text-copper border border-copper/20 rounded-lg text-sm font-medium hover:bg-copper/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ClipboardCheck size={14} />
          Try Demo: Client Reviews Changes
        </button>
        <span className="text-xs text-warm-gray self-center">
          Demos simulate the pipeline with realistic data and timing
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Chat panel */}
        <div className="lg:col-span-2 card-static flex flex-col min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === "user"
                      ? "bg-copper"
                      : msg.role === "assistant"
                      ? "bg-navy"
                      : "bg-warm-gray/20"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User size={14} className="text-white" />
                  ) : (
                    <Bot size={14} className={msg.role === "assistant" ? "text-white" : "text-warm-gray"} />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-copper text-white"
                      : msg.role === "system"
                      ? "bg-navy/5 text-warm-gray border border-border"
                      : "bg-stone text-navy"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <div
                    className={`text-[10px] mt-1 font-mono ${
                      msg.role === "user" ? "text-white/60" : "text-warm-gray"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {/* Inline approval card for review demo */}
            {showReviewCard && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-navy">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="max-w-[85%]">
                  <InlineApprovalCard
                    changes={REVIEW_DEMO_CHANGES}
                    onSubmit={handleReviewSubmit}
                  />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-border p-4 flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell the agent what to update..."
              className="flex-1 bg-stone rounded-lg px-4 py-2.5 text-sm text-navy placeholder:text-warm-gray/60 outline-none focus:ring-2 focus:ring-copper/30"
              disabled={isRunning}
            />
            <button
              type="submit"
              disabled={isRunning || !input.trim()}
              className="btn btn-copper px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
        </div>

        {/* Verification Timeline panel */}
        <div className="card-static p-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-copper" />
            <h2 className="font-semibold text-navy text-sm">
              Verification Pipeline
            </h2>
          </div>

          <div className="space-y-1">
            {steps.map((step) => (
              <div
                key={step.step}
                className={`verification-step ${
                  step.status === "pending"
                    ? "step-pending"
                    : step.status === "active"
                    ? "step-active"
                    : step.status === "passed"
                    ? "step-passed"
                    : step.status === "failed"
                    ? "step-failed"
                    : "step-waiting"
                }`}
              >
                <div className="step-icon">
                  <StepIcon status={step.status} />
                </div>
                <div className="py-1">
                  <div className="text-sm font-medium text-navy">
                    {step.label}
                  </div>
                  <div className="text-xs text-warm-gray">{step.details}</div>
                  {step.timestamp && (
                    <div className="text-[10px] font-mono text-warm-gray/60 mt-0.5">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Trust summary */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="text-xs font-mono text-warm-gray uppercase tracking-wider mb-2">
              Trust Summary
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-warm-gray">Steps completed</span>
                <span className="data-text text-navy font-bold">
                  {steps.filter((s) => s.status === "passed").length}/7
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-warm-gray">Scope violations</span>
                <span className="data-text text-green font-bold">0</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-warm-gray">Data leaks</span>
                <span className="data-text text-green font-bold">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
