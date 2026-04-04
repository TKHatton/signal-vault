import { StateGraph, MemorySaver } from "@langchain/langgraph";
import { VaultAgentState } from "./state";
import { preCheckNode } from "./nodes/pre-check";
import { contentGenNode } from "./nodes/content-gen";
import { humanReviewNode } from "./nodes/human-review";
import { permissionValidateNode } from "./nodes/permission-validate";
import { executeNode } from "./nodes/execute";
import { postCheckNode } from "./nodes/post-check";
import { auditNode } from "./nodes/audit";

// ============================================================
// Signal Vault — Multi-Pass Verification Graph
// ============================================================
//
// This is the core differentiator. A 7-node pipeline that
// ensures every agent action is:
//   1. Pre-validated (scope check + dry run)
//   2. Content-generated (proposed changes)
//   3. Human-approved (explicit consent)
//   4. Permission re-validated (double-check before execution)
//   5. Executed (via Token Vault token)
//   6. Post-verified (changes correct, no leaks)
//   7. Audited (trust report generated)
//
// Flow:
//   pre_check → content_gen → human_review → permission_validate → execute → post_check → audit → END
//
// If any step fails, the graph routes directly to audit to
// generate a failure report. Nothing happens without a trace.
//

function shouldContinueAfterPreCheck(
  state: typeof VaultAgentState.State
): string {
  if (state.preCheck && !state.preCheck.passed) return "step_audit";
  return "step_content_gen";
}

function shouldContinueAfterHumanReview(
  state: typeof VaultAgentState.State
): string {
  if (state.humanReview && !state.humanReview.approved) return "step_audit";
  return "step_permission_validate";
}

function shouldContinueAfterPermissionValidate(
  state: typeof VaultAgentState.State
): string {
  if (state.permissionValidate && !state.permissionValidate.passed) return "step_audit";
  return "step_execute";
}

function shouldContinueAfterExecute(
  state: typeof VaultAgentState.State
): string {
  if (state.execute && !state.execute.success) return "step_audit";
  return "step_post_check";
}

// Build the graph
const workflow = new StateGraph(VaultAgentState)
  // Add all 7 nodes (node names use "step_" prefix to avoid state field conflicts)
  .addNode("step_pre_check", preCheckNode)
  .addNode("step_content_gen", contentGenNode)
  .addNode("step_human_review", humanReviewNode)
  .addNode("step_permission_validate", permissionValidateNode)
  .addNode("step_execute", executeNode)
  .addNode("step_post_check", postCheckNode)
  .addNode("step_audit", auditNode)

  // Define edges with conditional routing
  .addEdge("__start__", "step_pre_check")
  .addConditionalEdges("step_pre_check", shouldContinueAfterPreCheck)
  .addEdge("step_content_gen", "step_human_review")
  .addConditionalEdges("step_human_review", shouldContinueAfterHumanReview)
  .addConditionalEdges("step_permission_validate", shouldContinueAfterPermissionValidate)
  .addConditionalEdges("step_execute", shouldContinueAfterExecute)
  .addEdge("step_post_check", "step_audit")
  .addEdge("step_audit", "__end__");

// Compile with in-memory checkpointing (no external DB needed for hackathon)
const checkpointer = new MemorySaver();

export const vaultGraph = workflow.compile({
  checkpointer,
});

/**
 * Run the full verification pipeline for a user request.
 */
export async function runVerificationPipeline(
  userRequest: string,
  connection: string,
  threadId: string,
  vaultToken?: { accessToken: string; expiresAt: number } | null
) {
  const config = {
    configurable: {
      thread_id: threadId,
    },
  };

  const initialState = {
    messages: [],
    userRequest,
    connection,
    currentStep: "pre_check",
    preCheck: null,
    contentGen: null,
    humanReview: null,
    permissionValidate: null,
    execute: null,
    postCheck: null,
    audit: null,
    error: null,
    vaultToken: vaultToken || null,
  };

  const result = await vaultGraph.invoke(initialState, config);

  return result;
}

/**
 * Phase 1: Run pre-check + content-gen only.
 * Returns proposed changes for client review.
 */
export async function runProposalPhase(
  userRequest: string,
  connection: string,
  threadId: string,
  vaultToken?: { accessToken: string; expiresAt: number } | null
) {
  const initialState = {
    messages: [],
    userRequest,
    connection,
    currentStep: "pre_check" as const,
    preCheck: null,
    contentGen: null,
    humanReview: null,
    permissionValidate: null,
    execute: null,
    postCheck: null,
    audit: null,
    error: null,
    vaultToken: vaultToken || null,
  };

  // Run pre-check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let state: any = { ...initialState };
  const preCheckResult = await preCheckNode(state);
  state = { ...state, ...preCheckResult };

  // If pre-check failed, return early
  if (state.preCheck && !state.preCheck.passed) {
    return state;
  }

  // Run content-gen
  const contentGenResult = await contentGenNode(state);
  state = { ...state, ...contentGenResult };

  return state;
}

/**
 * Phase 2: Run human-review through audit with real approval decisions.
 */
export async function runExecutionPhase(
  userRequest: string,
  connection: string,
  threadId: string,
  vaultToken?: { accessToken: string; expiresAt: number } | null,
  approvalDecisions?: { field: string; decision: string }[],
  approvalComment?: string
) {
  const approved = approvalDecisions || [];
  const approvedCount = approved.filter((d) => d.decision === "approved").length;
  const rejectedCount = approved.filter((d) => d.decision === "rejected").length;
  const totalCount = approved.length;

  const initialState = {
    messages: [],
    userRequest,
    connection,
    currentStep: "human_review" as const,
    preCheck: null,
    contentGen: null,
    humanReview: null,
    permissionValidate: null,
    execute: null,
    postCheck: null,
    audit: null,
    error: null,
    vaultToken: vaultToken || null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let state: any = { ...initialState };

  // Human review — use real approval decisions
  const { AIMessage } = await import("@langchain/core/messages");

  if (approvedCount === 0) {
    // All rejected
    state = {
      ...state,
      currentStep: "audit",
      humanReview: {
        passed: false,
        approved: false,
        details: `Client rejected all ${totalCount} proposed changes.${approvalComment ? ` Note: "${approvalComment}"` : ""}`,
        timestamp: new Date().toISOString(),
      },
      messages: [
        ...state.messages,
        new AIMessage(
          `All ${totalCount} changes were rejected by the client.${approvalComment ? `\n\nClient note: "${approvalComment}"` : ""}\n\nNo changes will be made. Generating audit report.`
        ),
      ],
    };

    // Skip to audit
    const auditResult = await auditNode(state);
    state = { ...state, ...auditResult };
    return state;
  }

  // Some or all approved
  state = {
    ...state,
    currentStep: "permission_validate",
    humanReview: {
      passed: true,
      approved: true,
      details: `Client reviewed: ${approvedCount} approved, ${rejectedCount} rejected.${approvalComment ? ` Note: "${approvalComment}"` : ""}`,
      timestamp: new Date().toISOString(),
    },
    messages: [
      ...state.messages,
      new AIMessage(
        `Review received: ${approvedCount} changes approved, ${rejectedCount} rejected.${approvalComment ? `\n\nClient note: "${approvalComment}"` : ""}\n\nRe-checking permissions before executing approved changes...`
      ),
    ],
  };

  // Permission validate
  const permResult = await permissionValidateNode(state);
  state = { ...state, ...permResult };

  if (state.permissionValidate && !state.permissionValidate.passed) {
    const auditResult = await auditNode(state);
    state = { ...state, ...auditResult };
    return state;
  }

  // Execute
  const execResult = await executeNode(state);
  state = { ...state, ...execResult };

  if (state.execute && !state.execute.success) {
    const auditResult = await auditNode(state);
    state = { ...state, ...auditResult };
    return state;
  }

  // Post-check
  const postResult = await postCheckNode(state);
  state = { ...state, ...postResult };

  // Audit
  const auditResult = await auditNode(state);
  state = { ...state, ...auditResult };

  return state;
}
