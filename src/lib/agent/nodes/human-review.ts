import { VaultAgentStateType } from "../state";
import { AIMessage } from "@langchain/core/messages";

/**
 * HUMAN REVIEW NODE
 * Step 3 of 7 in the multi-pass verification pipeline.
 *
 * This is the human-in-the-loop step.
 * The agent pauses here and waits for the user to:
 * - Review proposed changes
 * - Approve or reject them
 *
 * In LangGraph, this uses an interrupt to pause execution.
 * The UI shows a HumanApprovalCard with the proposed changes.
 */
export async function humanReviewNode(
  state: VaultAgentStateType
): Promise<Partial<VaultAgentStateType>> {
  const timestamp = new Date().toISOString();

  console.log("[Human Review] Waiting for user approval...");

  // TODO: In production, this node would:
  // 1. Use LangGraph interrupt() to pause the graph
  // 2. The UI would show the HumanApprovalCard
  // 3. User clicks Approve/Reject
  // 4. Graph resumes with the decision

  // For demo, simulate approval after delay
  await new Promise((r) => setTimeout(r, 1000));

  // Simulate approval
  const approved = true;

  if (!approved) {
    return {
      currentStep: "audit",
      humanReview: {
        passed: false,
        approved: false,
        details: "User rejected the proposed changes.",
        timestamp,
      },
      messages: [
        new AIMessage(
          "Changes rejected. No modifications will be made. Generating audit report..."
        ),
      ],
    };
  }

  return {
    currentStep: "permission_validate",
    humanReview: {
      passed: true,
      approved: true,
      details: `User approved ${state.contentGen?.changes?.length || 0} proposed changes.`,
      timestamp,
    },
    messages: [
      new AIMessage(
        "Changes approved. Re-validating permissions before execution..."
      ),
    ],
  };
}
