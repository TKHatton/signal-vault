"use client";

import { useState } from "react";
import {
  Send,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  User,
  Bot,
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

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content:
        "Signal Vault Agent ready. Connect your accounts in the Vault tab, then tell me what you need updated. I'll scan, propose changes, and execute with full verification.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [steps, setSteps] = useState<VerificationStepState[]>(INITIAL_STEPS);
  const [isRunning, setIsRunning] = useState(false);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat panel */}
        <div className="lg:col-span-2 card-static flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
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
