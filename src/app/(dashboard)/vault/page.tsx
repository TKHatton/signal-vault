"use client";

import { useState, useEffect } from "react";
import ConnectionCard from "@/components/vault/ConnectionCard";
import { AVAILABLE_SERVICES } from "@/lib/connections";
import { ConnectionStatus, ConnectionType } from "@/lib/types";
import { Shield, AlertTriangle, Loader2 } from "lucide-react";

interface ConnectionData {
  connection: ConnectionType;
  displayName: string;
  description: string;
  status: ConnectionStatus;
  connectedAt: string | null;
  lastUsedAt: string | null;
  id: string | null;
}

export default function VaultPage() {
  const [connections, setConnections] = useState<ConnectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  const fetchConnections = async () => {
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections);
      }
    } catch (error) {
      console.error("Failed to fetch connections:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const connectedCount = connections.filter(
    (c) => c.status === "active"
  ).length;

  const handleConnect = async (connection: ConnectionType) => {
    setConnecting(connection);
    try {
      const res = await fetch("/api/connections/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection }),
      });
      if (res.ok) {
        await fetchConnections();
      }
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (connection: ConnectionType) => {
    const conn = connections.find((c) => c.connection === connection);
    if (!conn?.id) return;

    try {
      const res = await fetch(`/api/connections/${conn.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchConnections();
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-copper" />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="page-title mb-2">Connected Accounts</h1>
        <p className="text-warm-gray">
          Connect your accounts to let AI agents work on your behalf. Your
          credentials are never stored — only secure, scoped tokens.
        </p>
      </div>

      {/* Trust banner */}
      <div className="card-static p-4 mb-6 flex items-start gap-3 border-l-4 border-l-green">
        <Shield size={20} className="text-green mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-sm font-semibold text-navy">
            Zero passwords stored
          </div>
          <div className="text-sm text-warm-gray">
            Signal Vault uses OAuth tokens through Auth0 Token Vault. We never
            see or store your passwords. All access is scoped, time-limited, and
            revocable with one click.
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-6 mb-6">
        <div className="flex items-center gap-2">
          <span className="data-text text-navy font-bold">
            {connectedCount}
          </span>
          <span className="text-sm text-warm-gray">connected</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="data-text text-navy font-bold">
            {AVAILABLE_SERVICES.length - connectedCount}
          </span>
          <span className="text-sm text-warm-gray">available</span>
        </div>
      </div>

      {/* Connection grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AVAILABLE_SERVICES.map((service, index) => {
          const conn = connections.find(
            (c) => c.connection === service.connection
          );
          return (
            <div
              key={service.connection}
              className="stagger-item"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <ConnectionCard
                service={service}
                status={conn?.status ?? "not_connected"}
                lastUsedAt={conn?.lastUsedAt ?? null}
                connectedAt={conn?.connectedAt ?? null}
                onConnect={() => handleConnect(service.connection)}
                onDisconnect={() => handleDisconnect(service.connection)}
              />
              {connecting === service.connection && (
                <div className="mt-2 flex items-center gap-2 text-xs text-copper">
                  <Loader2 size={12} className="animate-spin" />
                  Connecting...
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Security note */}
      <div className="mt-8 flex items-start gap-3 text-sm text-warm-gray">
        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
        <p>
          All connections use OAuth 2.0 via Auth0 Token Vault. Tokens are
          encrypted, automatically refreshed, and can be revoked at any time.
          Every access is logged in your Activity Log.
        </p>
      </div>
    </div>
  );
}
