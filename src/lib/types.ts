// ============================================================
// Signal Vault — Core Type Definitions
// ============================================================

// --- Connection Types ---

export type ConnectionStatus = 'active' | 'expired' | 'revoked' | 'not_connected';

export type ConnectionType =
  | 'google-oauth2'
  | 'wordpress'
  | 'linkedin'
  | 'facebook';

export interface ConnectionScope {
  id: string;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  granted: boolean;
}

export interface VaultConnection {
  id: string;
  tenantId: string;
  userAuth0Id: string;
  connection: ConnectionType;
  displayName: string;
  description: string;
  iconUrl?: string;
  scopes: ConnectionScope[];
  status: ConnectionStatus;
  lastUsedAt: string | null;
  connectedAt: string | null;
}

// --- Service Definitions (what shows on the Vault page) ---

export interface ServiceDefinition {
  connection: ConnectionType;
  displayName: string;
  description: string;
  icon: string;
  services: {
    name: string;
    description: string;
    scopes: ConnectionScope[];
  }[];
}

// --- Audit Log ---

export type AuditAction =
  | 'token_requested'
  | 'token_used'
  | 'connection_created'
  | 'connection_revoked'
  | 'pre_check_passed'
  | 'pre_check_failed'
  | 'content_generated'
  | 'human_approved'
  | 'human_rejected'
  | 'permission_validated'
  | 'permission_failed'
  | 'execution_success'
  | 'execution_failed'
  | 'post_check_passed'
  | 'post_check_failed'
  | 'audit_complete';

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userAuth0Id: string;
  connection: ConnectionType;
  action: AuditAction;
  agentName: string | null;
  details: Record<string, unknown>;
  status: 'success' | 'failed' | 'denied';
  createdAt: string;
}

// --- Trust Reports (Multi-Pass Verification) ---

export interface CheckResult {
  passed: boolean;
  details: string;
  timestamp: string;
}

export interface PreCheckResult extends CheckResult {
  scopeValid: boolean;
  simulationOk: boolean;
}

export interface HumanApprovalResult extends CheckResult {
  approved: boolean;
  changesShown: { field: string; current: string; proposed: string }[];
}

export interface PermissionValidationResult extends CheckResult {
  tokenValid: boolean;
  scopeMatches: boolean;
}

export interface ExecutionResult extends CheckResult {
  apiEndpoint: string;
  durationMs: number;
  response: Record<string, unknown>;
}

export interface PostCheckResult extends CheckResult {
  verified: boolean;
  noScopeViolation: boolean;
  noLeaks: boolean;
}

export interface TrustReport {
  id: string;
  tenantId: string;
  userAuth0Id: string;
  sessionId: string;
  connection: ConnectionType;
  actionSummary: string;
  preCheck: PreCheckResult;
  humanApproval: HumanApprovalResult;
  permissionValidation: PermissionValidationResult;
  execution: ExecutionResult;
  postCheck: PostCheckResult;
  overallStatus: 'passed' | 'failed' | 'partial';
  createdAt: string;
}

// --- Agent State (LangGraph) ---

export type VerificationStep =
  | 'pre_check'
  | 'content_gen'
  | 'human_review'
  | 'permission_validate'
  | 'execute'
  | 'post_check'
  | 'audit';

export type StepStatus = 'pending' | 'active' | 'passed' | 'failed' | 'waiting';

export interface VerificationStepState {
  step: VerificationStep;
  label: string;
  status: StepStatus;
  details?: string;
  timestamp?: string;
}

export interface ProposedChange {
  field: string;
  current: string;
  proposed: string;
  platform: string;
}

// --- Human Approval (Granular Review) ---

export type ApprovalDecision = 'approved' | 'rejected' | 'pending';

export interface ChangeApproval {
  change: ProposedChange;
  decision: ApprovalDecision;
}

export interface ReviewResult {
  changes: ChangeApproval[];
  comment: string;
  approvedCount: number;
  rejectedCount: number;
  submittedAt: string;
}

// --- Navigation ---

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}
