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
} from "lucide-react";
import { VerificationStepState, StepStatus } from "@/lib/types";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runDemo = async (mode: "success" | "revocation") => {
    if (isRunning) return;
    setIsRunning(true);

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

      // Update steps based on results
      const updatedSteps = [...INITIAL_STEPS];
      for (let i = 0; i < STEP_KEYS.length; i++) {
        const key = STEP_KEYS[i];
        const result = data.stepResults?.[key];
        if (result) {
          updatedSteps[i] = {
            ...updatedSteps[i],
            status: result.passed ? "passed" : "failed",
            details: result.details || updatedSteps[i].details,
            timestamp: result.timestamp,
          };
        }
      }
      setSteps(updatedSteps);

      // Add assistant messages
      if (data.messages) {
        const assistantMsgs: Message[] = data.messages
          .filter((m: { role: string }) => m.role === "assistant")
          .map((m: { content: string }) => ({
            role: "assistant" as const,
            content: m.content,
            timestamp: new Date().toISOString(),
          }));
        setMessages((prev) => [...prev, ...assistantMsgs]);
      }

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Pipeline error: ${data.error}`,
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
    <div>
      <div className="mb-6">
        <h1 className="page-title mb-2">Agent Workspace</h1>
        <p className="text-warm-gray">
          Tell the agent what needs updating. Every action goes through 7
          verification steps.
        </p>
      </div>

      {/* Demo mode buttons */}
      <div className="mb-4 flex flex-wrap gap-3">
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
        <span className="text-xs text-warm-gray self-center">
          Demos simulate the pipeline with realistic data and timing
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat panel */}
        <div className="lg:col-span-2 card-static flex flex-col" style={{ height: "calc(100vh - 260px)" }}>
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
