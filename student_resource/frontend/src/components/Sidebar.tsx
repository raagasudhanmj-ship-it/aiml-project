import React from "react";
import {
  LayoutDashboard,
  Search,
  GitCompare,
  FileCheck2,
  LineChart,
  Database,
  BookOpen,
  Sparkles,
  CheckCircle,
  Cpu,
  Layers
} from "lucide-react";
import { SystemHealth } from "../types";

export type NavigationTab =
  | "dashboard"
  | "explorer"
  | "investigation"
  | "results"
  | "performance"
  | "data-quality"
  | "methodology";

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  systemHealth: SystemHealth | null;
}

export function Sidebar({ currentTab, onSelectTab, systemHealth }: SidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: "Live" },
    { id: "explorer", label: "Entity Explorer", icon: Search, badge: "50k" },
    { id: "investigation", label: "Match Investigation", icon: GitCompare, highlight: true },
    { id: "results", label: "Prediction Results", icon: FileCheck2 },
    { id: "performance", label: "Model Performance", icon: LineChart, badge: "F0.5: 0.896" },
    { id: "data-quality", label: "Data Quality", icon: Database },
    { id: "methodology", label: "Methodology", icon: BookOpen }
  ];

  return (
    <aside className="w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white font-display tracking-tight flex items-center gap-1.5">
                EntityResolve <span className="text-indigo-400">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">Enterprise Entity Linkage</p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display">
            Platform Intelligence
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as NavigationTab)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono-code font-medium border ${
                      isActive
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.highlight && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-[#0B0F19]/60">
        <div className="p-3 rounded-lg bg-[#111827] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Engine Status
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold font-mono-code">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ACTIVE
            </span>
          </div>

          <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800/60 font-mono-code">
            <div className="flex justify-between">
              <span>Model:</span>
              <span className="text-slate-300 font-semibold">HistGradientBoost</span>
            </div>
            <div className="flex justify-between">
              <span>Threshold:</span>
              <span className="text-indigo-300 font-bold">τ = 0.88</span>
            </div>
            <div className="flex justify-between">
              <span>F0.5 Score:</span>
              <span className="text-emerald-300 font-bold">0.8957</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span>EntityResolve AI Platform</span>
          <span className="font-mono-code">v2.4.0-prod</span>
        </div>
      </div>
    </aside>
  );
}
