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
 *
 * @param userRequest - What the user wants done (e.g., "Update my business hours")
 * @param connection - Which connection to use (e.g., "google-oauth2")
 * @param threadId - Unique thread ID for this session
 * @returns The final state with all verification results
 */
export async function runVerificationPipeline(
  userRequest: string,
  connection: string,
  threadId: string
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
  };

  // Stream through the graph to get step-by-step updates
  const result = await vaultGraph.invoke(initialState, config);

  return result;
}
