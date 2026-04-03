"use client";

import { useState } from "react";
import { AlertTriangle, Shield, Trash2, LogOut } from "lucide-react";

export default function SettingsPage() {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDisconnectAll = () => {
    // TODO: Call Auth0 API to revoke all connections
    // DELETE /api/connections (all)
    // Then update Supabase vault_connections
    setShowConfirm(false);
    alert("All connections would be revoked. (Demo mode)");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title mb-2">Settings</h1>
        <p className="text-warm-gray">
          Manage your vault settings, offboarding, and security preferences.
        </p>
      </div>

      {/* Security section */}
      <div className="space-y-6">
        {/* Trust info */}
        <div className="card-static p-5">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={20} className="text-copper" />
            <h2 className="font-semibold text-navy">Security Model</h2>
          </div>
          <div className="space-y-3 text-sm text-warm-gray">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green mt-2 flex-shrink-0" />
              <p>
                <strong className="text-navy">Zero credential storage.</strong>{" "}
                Signal Vault never stores passwords or API keys. All access uses
                OAuth tokens managed by Auth0 Token Vault.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green mt-2 flex-shrink-0" />
              <p>
                <strong className="text-navy">Scoped access.</strong> Agents
                only get the specific permissions needed for each task. No
                blanket access.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green mt-2 flex-shrink-0" />
              <p>
                <strong className="text-navy">7-step verification.</strong>{" "}
                Every agent action goes through pre-check, human approval,
                permission validation, execution, post-check, and audit.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green mt-2 flex-shrink-0" />
              <p>
                <strong className="text-navy">Instant revocation.</strong>{" "}
                Disconnect any service with one click. Tokens are immediately
                invalidated.
              </p>
            </div>
          </div>
        </div>

        {/* Offboarding */}
        <div className="card-static p-5 border border-red/20">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={20} className="text-red" />
            <h2 className="font-semibold text-navy">Offboarding</h2>
          </div>
          <p className="text-sm text-warm-gray mb-4">
            Disconnect all services and revoke all agent access. Your audit
            trail is preserved for compliance, but all active tokens will be
            immediately invalidated.
          </p>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="btn btn-red text-sm"
            >
              <Trash2 size={14} />
              Disconnect All Services
            </button>
          ) : (
            <div className="bg-red/5 rounded-lg p-4">
              <p className="text-sm text-navy font-medium mb-3">
                Are you sure? This will:
              </p>
              <ul className="text-sm text-warm-gray space-y-1 mb-4">
                <li>• Revoke all OAuth tokens from Auth0 Token Vault</li>
                <li>• Disconnect Google, WordPress, and LinkedIn</li>
                <li>• Stop all agent access to your accounts</li>
                <li>• Preserve your activity log and trust reports</li>
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={handleDisconnectAll}
                  className="btn btn-red text-sm"
                >
                  Yes, Disconnect Everything
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="btn btn-navy text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Account */}
        <div className="card-static p-5">
          <div className="flex items-center gap-3 mb-4">
            <LogOut size={20} className="text-warm-gray" />
            <h2 className="font-semibold text-navy">Account</h2>
          </div>
          <a href="/auth/logout" className="btn btn-navy text-sm inline-flex items-center gap-2">
            <LogOut size={14} />
            Sign Out
          </a>
        </div>
      </div>
    </div>
  );
}
