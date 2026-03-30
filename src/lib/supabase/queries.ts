import { getSupabaseAdmin } from "@/lib/supabase";
import type {
  ConnectionType,
  ConnectionStatus,
  AuditAction,
  ConnectionScope,
} from "@/lib/types";

// ============================================================
// vault_connections
// ============================================================

export interface ConnectionRow {
  id: string;
  tenant_id: string;
  user_auth0_id: string;
  connection: ConnectionType;
  display_name: string;
  description: string | null;
  scopes: ConnectionScope[];
  status: ConnectionStatus;
  last_used_at: string | null;
  connected_at: string | null;
  created_at: string;
}

export async function getConnections(
  tenantId: string,
  userId: string
): Promise<ConnectionRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("vault_connections")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_auth0_id", userId)
    .neq("status", "revoked")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[Supabase] getConnections error:", error);
    throw error;
  }
  return data || [];
}

export async function upsertConnection(data: {
  tenant_id: string;
  user_auth0_id: string;
  connection: ConnectionType;
  display_name: string;
  description?: string;
  scopes?: ConnectionScope[];
  status?: ConnectionStatus;
}): Promise<ConnectionRow> {
  const supabase = getSupabaseAdmin();
  const { data: row, error } = await supabase
    .from("vault_connections")
    .upsert(
      {
        ...data,
        scopes: data.scopes || [],
        status: data.status || "active",
        connected_at: new Date().toISOString(),
      },
      { onConflict: "user_auth0_id,connection" }
    )
    .select()
    .single();

  if (error) {
    console.error("[Supabase] upsertConnection error:", error);
    throw error;
  }
  return row;
}

export async function deleteConnection(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("vault_connections")
    .update({ status: "revoked" })
    .eq("id", id);

  if (error) {
    console.error("[Supabase] deleteConnection error:", error);
    throw error;
  }
}

export async function deleteConnectionByType(
  userId: string,
  connection: ConnectionType
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("vault_connections")
    .update({ status: "revoked" })
    .eq("user_auth0_id", userId)
    .eq("connection", connection);

  if (error) {
    console.error("[Supabase] deleteConnectionByType error:", error);
    throw error;
  }
}

export async function updateConnectionLastUsed(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("vault_connections")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[Supabase] updateConnectionLastUsed error:", error);
    throw error;
  }
}

// ============================================================
// vault_audit_log
// ============================================================

export interface AuditRow {
  id: string;
  tenant_id: string;
  user_auth0_id: string;
  connection: string;
  action: AuditAction;
  agent_name: string | null;
  details: Record<string, unknown>;
  status: "success" | "failed" | "denied";
  created_at: string;
}

export async function getAuditLog(
  tenantId: string,
  userId: string,
  limit = 50
): Promise<AuditRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("vault_audit_log")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_auth0_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Supabase] getAuditLog error:", error);
    throw error;
  }
  return data || [];
}

export async function createAuditEntry(data: {
  tenant_id: string;
  user_auth0_id: string;
  connection: string;
  action: AuditAction;
  agent_name?: string;
  details?: Record<string, unknown>;
  status?: "success" | "failed" | "denied";
}): Promise<AuditRow> {
  const supabase = getSupabaseAdmin();
  const { data: row, error } = await supabase
    .from("vault_audit_log")
    .insert({
      ...data,
      details: data.details || {},
      status: data.status || "success",
    })
    .select()
    .single();

  if (error) {
    console.error("[Supabase] createAuditEntry error:", error);
    throw error;
  }
  return row;
}

// ============================================================
// vault_trust_reports
// ============================================================

export interface TrustReportRow {
  id: string;
  tenant_id: string;
  user_auth0_id: string;
  session_id: string;
  connection: string;
  action_summary: string | null;
  pre_check: Record<string, unknown> | null;
  human_approval: Record<string, unknown> | null;
  permission_validation: Record<string, unknown> | null;
  execution: Record<string, unknown> | null;
  post_check: Record<string, unknown> | null;
  overall_status: "passed" | "failed" | "partial";
  created_at: string;
}

export async function getTrustReports(
  tenantId: string,
  userId: string,
  limit = 20
): Promise<TrustReportRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("vault_trust_reports")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_auth0_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Supabase] getTrustReports error:", error);
    throw error;
  }
  return data || [];
}

export async function getTrustReport(
  id: string
): Promise<TrustReportRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("vault_trust_reports")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    console.error("[Supabase] getTrustReport error:", error);
    throw error;
  }
  return data;
}

export async function createTrustReport(data: {
  id: string;
  tenant_id: string;
  user_auth0_id: string;
  session_id: string;
  connection: string;
  action_summary?: string;
  pre_check?: Record<string, unknown>;
  human_approval?: Record<string, unknown>;
  permission_validation?: Record<string, unknown>;
  execution?: Record<string, unknown>;
  post_check?: Record<string, unknown>;
  overall_status: "passed" | "failed" | "partial";
}): Promise<TrustReportRow> {
  const supabase = getSupabaseAdmin();
  const { data: row, error } = await supabase
    .from("vault_trust_reports")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("[Supabase] createTrustReport error:", error);
    throw error;
  }
  return row;
}
