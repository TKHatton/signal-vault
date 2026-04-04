"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Bot,
  Activity,
  FileCheck,
  ClipboardCheck,
  Settings,
  Lock,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/vault", label: "Connected Accounts", icon: Shield },
  { href: "/agent", label: "Agent Workspace", icon: Bot },
  { href: "/approve", label: "Review Changes", icon: ClipboardCheck },
  { href: "/activity", label: "Activity Log", icon: Activity },
  { href: "/reports", label: "Trust Reports", icon: FileCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-card border border-border"
        aria-label="Open navigation"
      >
        <Menu size={20} className="text-navy" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-navy/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-navy z-50
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-white/60 hover:text-white"
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>

        {/* Brand */}
        <div className="p-6 pb-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-copper rounded-lg flex items-center justify-center">
              <Lock size={16} className="text-white" />
            </div>
            <div>
              <div className="text-white font-serif text-lg leading-tight">
                Signal Vault
              </div>
              <div className="text-white/40 text-[10px] font-mono uppercase tracking-widest">
                Signal & Structure AI
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="px-3 mt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1
                  transition-all duration-150
                  ${
                    isActive
                      ? "bg-white/10 text-copper"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Trust indicator at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
            <span className="font-mono">Vault Active</span>
          </div>
          <div className="text-white/20 text-[10px] font-mono mt-1">
            0 passwords stored &middot; Token-only access
          </div>
        </div>
      </aside>
    </>
  );
}
