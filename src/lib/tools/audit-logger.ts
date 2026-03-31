/**
 * Audit Logger — writes pipeline events to Supabase
 *
 * Used by pipeline nodes to log every action taken with
 * client credentials. This is the transparency layer.
 */

import { createAuditEntry } from "@/lib/supabase/queries";
import type { AuditAction } from "@/lib/types";

const DEFAULT_TENANT_ID =
  process.env.TENANT_ID || "484fb776-2077-410f-a4dd-1432df766103";

export async function logPipelineEvent(params: {
  userId?: string;
  connection: string;
  action: AuditAction;
  agentName?: string;
  details?: Record<string, unknown>;
  status?: "success" | "failed" | "denied";
}): Promise<void> {
  try {
    await createAuditEntry({
      tenant_id: DEFAULT_TENANT_ID,
      user_auth0_id: params.userId || "pipeline",
      connection: params.connection,
      action: params.action,
      agent_name: params.agentName,
      details: params.details,
      status: params.status || "success",
    });
  } catch (error) {
    // Never let audit logging break the pipeline
    console.error("[AuditLogger] Failed to log event:", error);
  }
}
