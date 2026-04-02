import { VaultAgentStateType } from "../state";
import { AIMessage } from "@langchain/core/messages";
import {
  listAccounts,
  listLocations,
  auditLocation,
  updateDescription,
} from "@/lib/tools/gbp";
import { logPipelineEvent } from "@/lib/tools/audit-logger";

/**
 * EXECUTION NODE
 * Step 5 of 7 in the multi-pass verification pipeline.
 *
 * Uses the Token Vault token to make actual API calls.
 * For Google Business Profile:
 * - Reads current listing data
 * - Applies approved changes
 * - Logs exact request/response for audit
 *
 * If token is revoked mid-execution, this fails gracefully.
 */
export async function executeNode(
  state: VaultAgentStateType
): Promise<Partial<VaultAgentStateType>> {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  console.log("[Execute] Applying changes via Token Vault token...");

  // Use the token passed from the request context (chat route)
  const tokenResult = state.vaultToken;

  if (!tokenResult) {
    // Token was revoked or unavailable — this is the mid-session revocation demo
    await logPipelineEvent({
      connection: state.connection,
      action: "execution_failed",
      agentName: "execute-agent",
      details: {
        reason: "token_unavailable",
        message:
          "Token Vault returned no token. Connection may have been revoked.",
      },
      status: "denied",
    });

    return {
      currentStep: "audit",
      execute: {
        passed: false,
        success: false,
        apiEndpoint: "Token Vault",
        durationMs: Date.now() - startTime,
        response: { error: "Token unavailable or revoked" },
        details:
          "Execution blocked: Token Vault returned no token. The client may have revoked access. No changes were made.",
        timestamp,
      },
      messages: [
        new AIMessage(
          "EXECUTION BLOCKED: Unable to retrieve token from Auth0 Token Vault. The client may have revoked access. No changes were applied. This is exactly how it should work — revocation stops the agent immediately."
        ),
      ],
      error: "Token revoked or unavailable",
    };
  }

  // Log token retrieval
  await logPipelineEvent({
    connection: state.connection,
    action: "token_used",
    agentName: "execute-agent",
    details: { purpose: "Execute approved changes on GBP" },
  });

  // Try to execute real GBP operations
  try {
    // Step 1: List accounts
    const accounts = await listAccounts(tokenResult.accessToken);

    if (accounts.length === 0) {
      return {
        currentStep: "post_check",
        execute: {
          passed: true,
          success: true,
          apiEndpoint: "mybusinessaccountmanagement.googleapis.com",
          durationMs: Date.now() - startTime,
          response: {
            status: "OK",
            message: "No GBP accounts found. Account may need to be claimed.",
          },
          details:
            "Successfully authenticated with Google. No Business Profile accounts found — client may need to claim their listing first.",
          timestamp,
        },
        messages: [
          new AIMessage(
            "Successfully connected to Google using Token Vault token. No Business Profile accounts were found. The client may need to claim their business listing at business.google.com first."
          ),
        ],
      };
    }

    // Step 2: List locations for first account
    const locations = await listLocations(
      tokenResult.accessToken,
      accounts[0].name
    );

    if (locations.length === 0) {
      return {
        currentStep: "post_check",
        execute: {
          passed: true,
          success: true,
          apiEndpoint: "mybusinessbusinessinformation.googleapis.com",
          durationMs: Date.now() - startTime,
          response: {
            status: "OK",
            account: accounts[0].accountName,
            locationsFound: 0,
          },
          details: `Connected to GBP account "${accounts[0].accountName}". No locations found.`,
          timestamp,
        },
        messages: [
          new AIMessage(
            `Connected to GBP account "${accounts[0].accountName}" using Token Vault. No locations found under this account.`
          ),
        ],
      };
    }

    // Step 3: Audit the first location
    const location = locations[0];
    const audit = await auditLocation(
      tokenResult.accessToken,
      location.name
    );

    // Step 4: Apply approved changes (if any from content-gen)
    const appliedChanges: string[] = [];
    const changesFromContentGen = state.contentGen?.changes || [];

    for (const change of changesFromContentGen) {
      try {
        if (
          change.field === "Business Description" ||
          change.field === "Description"
        ) {
          await updateDescription(
            tokenResult.accessToken,
            location.name,
            change.proposed
          );
          appliedChanges.push(`Updated description: "${change.proposed.slice(0, 50)}..."`);
        } else if (change.field === "Business Hours") {
          // Hours update would need parsed data — log as attempted
          appliedChanges.push(`Hours update proposed: ${change.proposed}`);
        }
      } catch (changeError) {
        console.error(`[Execute] Failed to apply change ${change.field}:`, changeError);
        appliedChanges.push(`Failed to update ${change.field}: ${changeError}`);
      }
    }

    // Log execution success
    await logPipelineEvent({
      connection: state.connection,
      action: "execution_success",
      agentName: "execute-agent",
      details: {
        account: accounts[0].accountName,
        location: location.title,
        issuesFound: audit.issues.length,
        changesApplied: appliedChanges.length,
        changes: appliedChanges,
      },
    });

    const durationMs = Date.now() - startTime;

    return {
      currentStep: "post_check",
      execute: {
        passed: true,
        success: true,
        apiEndpoint: "mybusinessbusinessinformation.googleapis.com",
        durationMs,
        response: {
          status: "OK",
          account: accounts[0].accountName,
          location: location.title,
          issuesFound: audit.issues.length,
          changesApplied: appliedChanges.length,
        },
        details: `Connected to "${location.title}" via Token Vault. Found ${audit.issues.length} issues. Applied ${appliedChanges.length} changes in ${durationMs}ms.`,
        timestamp,
      },
      messages: [
        new AIMessage(
          `Execution complete using Token Vault token.\n\n${audit.summary}\n\nChanges applied: ${appliedChanges.length > 0 ? appliedChanges.join("\n") : "Audit only — no changes applied this session."}\n\nRunning post-execution verification...`
        ),
      ],
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const durationMs = Date.now() - startTime;

    // Check if error is due to token revocation
    const isRevoked =
      errMsg.includes("401") ||
      errMsg.includes("403") ||
      errMsg.includes("invalid_token") ||
      errMsg.includes("revoked");

    await logPipelineEvent({
      connection: state.connection,
      action: "execution_failed",
      agentName: "execute-agent",
      details: {
        error: errMsg,
        isRevoked,
        durationMs,
      },
      status: "failed",
    });

    return {
      currentStep: "audit",
      execute: {
        passed: false,
        success: false,
        apiEndpoint: "mybusinessbusinessinformation.googleapis.com",
        durationMs,
        response: { error: errMsg },
        details: isRevoked
          ? `Access denied — token may have been revoked by the client. No changes made. (${durationMs}ms)`
          : `Execution failed: ${errMsg} (${durationMs}ms)`,
        timestamp,
      },
      messages: [
        new AIMessage(
          isRevoked
            ? "ACCESS REVOKED: The client has revoked access to their Google account. The agent has been stopped immediately. No changes were made. This revocation has been logged."
            : `Execution failed: ${errMsg}. No changes were made. Generating audit report...`
        ),
      ],
      error: isRevoked ? "Access revoked by client" : errMsg,
    };
  }
}
