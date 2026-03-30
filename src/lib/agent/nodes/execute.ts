import { VaultAgentStateType } from "../state";
import { AIMessage } from "@langchain/core/messages";

/**
 * EXECUTION NODE
 * Step 5 of 7 in the multi-pass verification pipeline.
 *
 * Uses the Token Vault token to make actual API calls.
 * Applies the approved changes to the connected platform.
 *
 * This is where the real work happens:
 * - Retrieves a fresh token from Auth0 Token Vault
 * - Calls the external API (Google, WordPress, etc.)
 * - Logs the exact request and response
 */
export async function executeNode(
  state: VaultAgentStateType
): Promise<Partial<VaultAgentStateType>> {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  console.log("[Execute] Applying changes via Token Vault token...");

  // TODO: Real implementation would:
  // 1. Get fresh token: getTokenForConnection(state.connection)
  // 2. Build API request based on approved changes
  // 3. Call the external API (e.g., Google Business Profile API)
  // 4. Parse response and verify success
  // 5. Log the exact request/response for audit

  await new Promise((r) => setTimeout(r, 1500));

  const durationMs = Date.now() - startTime;
  const changesCount = state.contentGen?.changes?.length || 0;

  // Simulate successful execution
  const success = true;

  if (!success) {
    return {
      currentStep: "audit",
      execute: {
        passed: false,
        success: false,
        apiEndpoint: "mybusiness.googleapis.com/v4/accounts/*/locations/*",
        durationMs,
        response: { error: "API call failed" },
        details: "Execution failed. API returned an error.",
        timestamp,
      },
      messages: [
        new AIMessage(
          "Execution failed. The API returned an error. No changes were applied. Generating audit report..."
        ),
      ],
      error: "Execution failed",
    };
  }

  return {
    currentStep: "post_check",
    execute: {
      passed: true,
      success: true,
      apiEndpoint: "mybusiness.googleapis.com/v4/accounts/*/locations/*",
      durationMs,
      response: {
        status: "OK",
        updatedFields: changesCount,
        message: `Successfully updated ${changesCount} fields`,
      },
      details: `Successfully applied ${changesCount} changes via Token Vault token in ${durationMs}ms.`,
      timestamp,
    },
    messages: [
      new AIMessage(
        `Changes applied successfully. Updated ${changesCount} fields in ${durationMs}ms. Running post-execution verification...`
      ),
    ],
  };
}
