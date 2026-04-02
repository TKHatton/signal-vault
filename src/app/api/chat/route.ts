import { NextRequest, NextResponse } from "next/server";
import { runVerificationPipeline } from "@/lib/agent/graph";
import { getSessionUser } from "@/lib/session";
import { getTokenForConnection } from "@/lib/auth0-ai";

/**
 * POST /api/chat
 *
 * Invokes the multi-pass verification pipeline.
 * Accepts a user message and connection, runs all 7 steps,
 * and returns the final state with all verification results.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, connection, threadId } = body;

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

    // Run the full verification pipeline (pass token so nodes don't need cookie context)
    const result = await runVerificationPipeline(
      message,
      connectionName,
      thread,
      vaultToken
    );

    // Extract step results for the UI
    const stepResults = {
      preCheck: result.preCheck,
      contentGen: result.contentGen,
      humanReview: result.humanReview,
      permissionValidate: result.permissionValidate,
      execute: result.execute,
      postCheck: result.postCheck,
      audit: result.audit,
    };

    // Extract messages for the chat
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
