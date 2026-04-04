import { NextRequest, NextResponse } from "next/server";
import { runVerificationPipeline, runProposalPhase, runExecutionPhase } from "@/lib/agent/graph";
import { getSessionUser } from "@/lib/session";
import { getTokenForConnection } from "@/lib/auth0-ai";

/**
 * POST /api/chat
 *
 * Invokes the multi-pass verification pipeline.
 *
 * Supports two modes:
 * - phase: "propose" — runs pre-check + content-gen only, returns proposed changes
 * - phase: "execute" — runs human-review through audit with approval decisions
 * - no phase — runs all 7 steps (legacy behavior)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, connection, threadId, phase, approvalDecisions, approvalComment } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get user session for audit trail
    const user = await getSessionUser();

    // Generate thread ID if not provided
    const thread = threadId || `thread-${Date.now().toString(36)}`;

    // Get the Token Vault token here (in request context where cookies are available)
    const connectionName = connection || "google-oauth2";
    let vaultToken: { accessToken: string; expiresAt: number } | null = null;
    try {
      vaultToken = await getTokenForConnection(connectionName);
      console.log("[API /chat] Token Vault token obtained:", !!vaultToken);
    } catch (err) {
      console.error("[API /chat] Failed to get Token Vault token:", err);
    }

    // Phase 1: Propose — run pre-check + content-gen only
    if (phase === "propose") {
      const result = await runProposalPhase(
        message,
        connectionName,
        thread,
        vaultToken
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages = result.messages.map((msg: any) => ({
        role: msg._getType?.() === "human" ? "user" : "assistant",
        content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
      }));

      return NextResponse.json({
        threadId: thread,
        messages,
        stepResults: {
          preCheck: result.preCheck,
          contentGen: result.contentGen,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        proposedChanges: (result.contentGen as any)?.changes || [],
        currentStep: result.currentStep,
        error: result.error,
        userId: user?.userId,
      });
    }

    // Phase 2: Execute — run human-review through audit with real approval decisions
    if (phase === "execute") {
      const result = await runExecutionPhase(
        message,
        connectionName,
        thread,
        vaultToken,
        approvalDecisions || [],
        approvalComment || ""
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages = result.messages.map((msg: any) => ({
        role: msg._getType?.() === "human" ? "user" : "assistant",
        content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
      }));

      return NextResponse.json({
        threadId: thread,
        messages,
        stepResults: {
          humanReview: result.humanReview,
          permissionValidate: result.permissionValidate,
          execute: result.execute,
          postCheck: result.postCheck,
          audit: result.audit,
        },
        currentStep: result.currentStep,
        error: result.error,
        userId: user?.userId,
      });
    }

    // Legacy: Run the full pipeline (all 7 steps, auto-approve)
    const result = await runVerificationPipeline(
      message,
      connectionName,
      thread,
      vaultToken
    );

    const stepResults = {
      preCheck: result.preCheck,
      contentGen: result.contentGen,
      humanReview: result.humanReview,
      permissionValidate: result.permissionValidate,
      execute: result.execute,
      postCheck: result.postCheck,
      audit: result.audit,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = result.messages.map((msg: any) => ({
      role: msg._getType?.() === "human" ? "user" : "assistant",
      content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
    }));

    return NextResponse.json({
      threadId: thread,
      messages,
      stepResults,
      currentStep: result.currentStep,
      error: result.error,
      userId: user?.userId,
    });
  } catch (error) {
    console.error("[API /chat] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
