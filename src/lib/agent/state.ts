import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";

// ============================================================
// Signal Vault Agent State
// Tracks the full multi-pass verification pipeline
// ============================================================

export interface ProposedChange {
  field: string;
  current: string;
  proposed: string;
  platform: string;
}

export interface PreCheckData {
  passed: boolean;
  scopeValid: boolean;
  simulationOk: boolean;
  details: string;
  timestamp: string;
}

export interface ContentGenData {
  passed: boolean;
  changes: ProposedChange[];
  details: string;
  timestamp: string;
}

export interface HumanReviewData {
  passed: boolean;
  approved: boolean;
  details: string;
  timestamp: string;
}

export interface PermissionValidateData {
  passed: boolean;
  tokenValid: boolean;
  scopeMatches: boolean;
  details: string;
  timestamp: string;
}

export interface ExecuteData {
  passed: boolean;
  success: boolean;
  apiEndpoint: string;
  durationMs: number;
  response: Record<string, unknown>;
  details: string;
  timestamp: string;
}

export interface PostCheckData {
  passed: boolean;
  verified: boolean;
  noScopeViolation: boolean;
  noLeaks: boolean;
  details: string;
  timestamp: string;
}

export interface AuditData {
  passed: boolean;
  reportId: string;
  details: string;
  timestamp: string;
}

// LangGraph annotation for the agent state
export const VaultAgentState = Annotation.Root({
  // Chat messages
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),

  // What the user asked for
  userRequest: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),

  // Which connection to use
  connection: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),

  // Current step in the pipeline
  currentStep: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "pre_check",
  }),

  // Results from each verification step
  preCheck: Annotation<PreCheckData | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  contentGen: Annotation<ContentGenData | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  humanReview: Annotation<HumanReviewData | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  permissionValidate: Annotation<PermissionValidateData | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  execute: Annotation<ExecuteData | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  postCheck: Annotation<PostCheckData | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  audit: Annotation<AuditData | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  // Error tracking
  error: Annotation<string | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  // Token from Auth0 Token Vault (passed from request context)
  vaultToken: Annotation<{ accessToken: string; expiresAt: number } | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
});

export type VaultAgentStateType = typeof VaultAgentState.State;
