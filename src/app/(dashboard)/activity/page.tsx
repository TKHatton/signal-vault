"use client";

import { useState, useEffect } from "react";
import { Shield, Filter, Loader2 } from "lucide-react";
// Audit entries from Supabase use snake_case, TypeScript types use camelCase
interface AuditEntry {
  id: string;
  tenant_id: string;
  user_auth0_id: string;
  connection: string;
  action: string;
  agent_name: string | null;
  details: Record<string, unknown>;
  status: "success" | "failed" | "denied";
  created_at: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  connection_created: { label: "Connected", color: "text-green" },
  connection_revoked: { label: "Disconnected", color: "text-red" },
  token_requested: { label: "Token Requested", color: "text-copper" },
  token_used: { label: "Token Used", color: "text-copper" },
  pre_check_passed: { label: "Pre-Check ✓", color: "text-green" },
  pre_check_failed: { label: "Pre-Check ✗", color: "text-red" },
  content_generated: { label: "Content Generated", color: "text-navy" },
  human_approved: { label: "Approved", color: "text-green" },
  human_rejected: { label: "Rejected", color: "text-red" },
  permission_validated: { label: "Permission ✓", color: "text-green" },
  permission_failed: { label: "Permission ✗", color: "text-red" },
  execution_success: { label: "Executed ✓", color: "text-green" },
  execution_failed: { label: "Executed ✗", color: "text-red" },
  post_check_passed: { label: "Post-Check ✓", color: "text-green" },
  post_check_failed: { label: "Post-Check ✗", color: "text-red" },
  audit_complete: { label: "Audit Complete", color: "text-navy" },
};

export default function ActivityPage() {
  const [activity, setActivity] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch("/api/audit");
        if (res.ok) {
          const data = await res.json();
          setActivity(data.auditLog);
        }
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-copper" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title mb-2">Activity Log</h1>
        <p className="text-warm-gray">
          Every token access and agent action is logged here. Full
          transparency — see exactly what happened with your credentials.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card-static p-4 text-center">
          <div className="data-text text-2xl text-navy font-bold">
            {activity.length}
          </div>
          <div className="text-xs text-warm-gray mt-1">Total events</div>
        </div>
        <div className="card-static p-4 text-center">
          <div className="data-text text-2xl text-green font-bold">
            {activity.filter((a) => a.status === "success").length}
          </div>
          <div className="text-xs text-warm-gray mt-1">Successful</div>
        </div>
        <div className="card-static p-4 text-center">
          <div className="data-text text-2xl text-red font-bold">
            {activity.filter((a) => a.status === "failed").length}
          </div>
          <div className="text-xs text-warm-gray mt-1">Failed</div>
        </div>
        <div className="card-static p-4 text-center">
          <div className="data-text text-2xl text-green font-bold">0</div>
          <div className="text-xs text-warm-gray mt-1">Scope violations</div>
        </div>
      </div>

      {/* Activity table */}
      <div className="card-static overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy">
            <Shield size={16} className="text-copper" />
            Audit Trail
          </div>
          <button className="flex items-center gap-1 text-xs text-warm-gray hover:text-copper transition-colors">
            <Filter size={12} />
            Filter
          </button>
        </div>

        <div className="divide-y divide-border">
          {activity.length === 0 ? (
            <div className="px-4 py-8 text-center text-warm-gray text-sm">
              No activity yet. Connect an account or run an agent task to see events here.
            </div>
          ) : (
            activity.map((entry) => {
              const actionConfig = ACTION_LABELS[entry.action] || {
                label: entry.action,
                color: "text-warm-gray",
              };
              return (
                <div
                  key={entry.id}
                  className="px-4 py-3 flex items-center gap-4 hover:bg-stone/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${actionConfig.color}`}
                      >
                        {actionConfig.label}
                      </span>
                      {entry.agent_name && (
                        <span className="text-[10px] font-mono bg-stone px-1.5 py-0.5 rounded text-warm-gray">
                          {entry.agent_name}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-warm-gray mt-0.5 truncate">
                      {JSON.stringify(entry.details)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-mono text-warm-gray">
                      {new Date(entry.created_at).toLocaleTimeString()}
                    </div>
                    <div className="text-[10px] font-mono text-warm-gray/60">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
