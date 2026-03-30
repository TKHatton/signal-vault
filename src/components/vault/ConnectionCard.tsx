"use client";

import { ServiceDefinition, ConnectionStatus } from "@/lib/types";
import { STATUS_CONFIG, getServiceIcon } from "@/lib/connections";
import { Shield, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ConnectionCardProps {
  service: ServiceDefinition;
  status: ConnectionStatus;
  lastUsedAt: string | null;
  connectedAt: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function ConnectionCard({
  service,
  status,
  lastUsedAt,
  connectedAt,
  onConnect,
  onDisconnect,
}: ConnectionCardProps) {
  const [showScopes, setShowScopes] = useState(false);
  const statusConfig = STATUS_CONFIG[status];
  const isConnected = status === "active";

  const allScopes = service.services.flatMap((s) => s.scopes);

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-stone rounded-xl flex items-center justify-center text-2xl">
            {getServiceIcon(service.icon)}
          </div>
          <div>
            <h3 className="font-semibold text-navy text-lg">
              {service.displayName}
            </h3>
            <div className={`status-badge ${statusConfig.color} mt-1`}>
              <span
                className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} mr-1.5`}
              />
              {statusConfig.label}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-warm-gray text-sm mb-4 leading-relaxed">
        {service.description}
      </p>

      {/* Services included */}
      <div className="mb-4">
        <div className="text-xs font-mono text-warm-gray uppercase tracking-wider mb-2">
          Services
        </div>
        <div className="space-y-1">
          {service.services.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-2 text-sm text-navy"
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? "bg-green" : "bg-warm-gray/40"
                }`}
              />
              {s.name}
            </div>
          ))}
        </div>
      </div>

      {/* Scope panel (collapsible) */}
      <button
        onClick={() => setShowScopes(!showScopes)}
        className="flex items-center gap-2 text-xs text-copper font-medium mb-3 hover:text-copper/80 transition-colors"
      >
        <Shield size={12} />
        View permissions ({allScopes.length})
        {showScopes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {showScopes && (
        <div className="bg-stone rounded-lg p-3 mb-4 space-y-2">
          {allScopes.map((scope) => (
            <div key={scope.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                    scope.riskLevel === "high"
                      ? "bg-red/10 text-red"
                      : scope.riskLevel === "medium"
                      ? "bg-amber/10 text-amber"
                      : "bg-green/10 text-green"
                  }`}
                >
                  {scope.riskLevel}
                </span>
                <span className="text-sm text-navy">{scope.name}</span>
              </div>
              <span
                className={`text-xs font-mono ${
                  isConnected ? "text-green" : "text-warm-gray"
                }`}
              >
                {isConnected ? "✓" : "—"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Timestamps */}
      {isConnected && (
        <div className="flex gap-4 text-[11px] font-mono text-warm-gray mb-4">
          {connectedAt && (
            <span>Connected {new Date(connectedAt).toLocaleDateString()}</span>
          )}
          {lastUsedAt && (
            <span>Last used {new Date(lastUsedAt).toLocaleDateString()}</span>
          )}
        </div>
      )}

      {/* Action button */}
      {isConnected ? (
        <button
          onClick={onDisconnect}
          className="btn btn-navy w-full text-sm"
        >
          Disconnect
        </button>
      ) : (
        <button onClick={onConnect} className="btn btn-copper w-full text-sm">
          Connect {service.displayName}
        </button>
      )}
    </div>
  );
}
