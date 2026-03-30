-- ============================================================
-- Signal Vault — Supabase Schema
-- ============================================================
-- Run this in Supabase Dashboard > SQL Editor
-- Tables use vault_ prefix to avoid conflicts with ss-client-portal
-- ============================================================

-- 1. vault_connections — tracks which accounts a user has connected
CREATE TABLE IF NOT EXISTS vault_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_auth0_id TEXT NOT NULL,
  connection TEXT NOT NULL,           -- 'google-oauth2', 'wordpress', 'linkedin'
  display_name TEXT NOT NULL,
  description TEXT,
  scopes JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'revoked', 'not_connected')),
  last_used_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate connections per user
  UNIQUE (user_auth0_id, connection)
);

-- Indexes for vault_connections
CREATE INDEX IF NOT EXISTS idx_vault_connections_tenant
  ON vault_connections (tenant_id);
CREATE INDEX IF NOT EXISTS idx_vault_connections_user
  ON vault_connections (user_auth0_id);
CREATE INDEX IF NOT EXISTS idx_vault_connections_status
  ON vault_connections (status);

-- 2. vault_audit_log — every token access and agent action
CREATE TABLE IF NOT EXISTS vault_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_auth0_id TEXT NOT NULL,
  connection TEXT NOT NULL,
  action TEXT NOT NULL
    CHECK (action IN (
      'token_requested', 'token_used',
      'connection_created', 'connection_revoked',
      'pre_check_passed', 'pre_check_failed',
      'content_generated',
      'human_approved', 'human_rejected',
      'permission_validated', 'permission_failed',
      'execution_success', 'execution_failed',
      'post_check_passed', 'post_check_failed',
      'audit_complete'
    )),
  agent_name TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'success'
    CHECK (status IN ('success', 'failed', 'denied')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for vault_audit_log
CREATE INDEX IF NOT EXISTS idx_vault_audit_tenant
  ON vault_audit_log (tenant_id);
CREATE INDEX IF NOT EXISTS idx_vault_audit_user
  ON vault_audit_log (user_auth0_id);
CREATE INDEX IF NOT EXISTS idx_vault_audit_connection
  ON vault_audit_log (connection);
CREATE INDEX IF NOT EXISTS idx_vault_audit_action
  ON vault_audit_log (action);
CREATE INDEX IF NOT EXISTS idx_vault_audit_created
  ON vault_audit_log (created_at DESC);

-- 3. vault_trust_reports — full 7-step verification reports
CREATE TABLE IF NOT EXISTS vault_trust_reports (
  id TEXT PRIMARY KEY,                -- 'rpt-xxxxx' format from LangGraph
  tenant_id TEXT NOT NULL,
  user_auth0_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  connection TEXT NOT NULL,
  action_summary TEXT,
  pre_check JSONB,
  human_approval JSONB,
  permission_validation JSONB,
  execution JSONB,
  post_check JSONB,
  overall_status TEXT NOT NULL DEFAULT 'passed'
    CHECK (overall_status IN ('passed', 'failed', 'partial')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for vault_trust_reports
CREATE INDEX IF NOT EXISTS idx_vault_reports_tenant
  ON vault_trust_reports (tenant_id);
CREATE INDEX IF NOT EXISTS idx_vault_reports_user
  ON vault_trust_reports (user_auth0_id);
CREATE INDEX IF NOT EXISTS idx_vault_reports_status
  ON vault_trust_reports (overall_status);
CREATE INDEX IF NOT EXISTS idx_vault_reports_created
  ON vault_trust_reports (created_at DESC);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
-- These policies ensure each user can only access their own data.
-- Since we use service_role key on the server, RLS is bypassed
-- for API routes, but this protects against direct client access.

ALTER TABLE vault_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_trust_reports ENABLE ROW LEVEL SECURITY;

-- vault_connections policies
CREATE POLICY "Users can view own connections"
  ON vault_connections FOR SELECT
  USING (user_auth0_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own connections"
  ON vault_connections FOR INSERT
  WITH CHECK (user_auth0_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own connections"
  ON vault_connections FOR UPDATE
  USING (user_auth0_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own connections"
  ON vault_connections FOR DELETE
  USING (user_auth0_id = auth.jwt() ->> 'sub');

-- vault_audit_log policies
CREATE POLICY "Users can view own audit log"
  ON vault_audit_log FOR SELECT
  USING (user_auth0_id = auth.jwt() ->> 'sub');

CREATE POLICY "Service can insert audit entries"
  ON vault_audit_log FOR INSERT
  WITH CHECK (true);

-- vault_trust_reports policies
CREATE POLICY "Users can view own reports"
  ON vault_trust_reports FOR SELECT
  USING (user_auth0_id = auth.jwt() ->> 'sub');

CREATE POLICY "Service can insert reports"
  ON vault_trust_reports FOR INSERT
  WITH CHECK (true);
