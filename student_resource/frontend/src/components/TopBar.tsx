import React, { useState } from "react";
import { Search, ShieldCheck, Zap, Database, ArrowRight, UserCheck } from "lucide-react";

interface TopBarProps {
  onQuickSearch: (query: string) => void;
  onSelectEntity: (entityId: string) => void;
}

export function TopBar({ onQuickSearch, onSelectEntity }: TopBarProps) {
  const [searchValue, setSearchValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onQuickSearch(searchValue.trim());
    }
  };

  const handleQuickJump = (id: string) => {
    setSearchValue(id);
    onSelectEntity(id);
  };

  return (
    <header className="h-16 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Context */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 font-display">
            EntityResolve AI
            <span className="text-[11px] font-normal text-slate-400">·</span>
            <span className="text-xs font-normal text-slate-300">AI-Powered Business Entity Resolution & Matching Intelligence</span>
          </h2>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-6">
        <form onSubmit={handleSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search entity ID (e.g. S1-778640743), business name..."
            className="w-full bg-[#111827] border border-slate-700/80 rounded-lg pl-9 pr-20 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Quick Demo Entity Badges & Judge Profile */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-1.5 text-xs">
          <span className="text-[11px] text-slate-400 font-medium">Demo Pick:</span>
          <button
            onClick={() => handleQuickJump("S1-778640743")}
            className="px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono-code transition-colors cursor-pointer"
          >
            S1-778640743 (US Match)
          </button>
          <button
            onClick={() => handleQuickJump("S1-628750886")}
            className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono-code transition-colors cursor-pointer"
          >
            S1-628750886 (France Match)
          </button>
        </div>

        <div className="h-5 w-px bg-slate-800" />

        {/* Demo Judge Profile */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111827] border border-slate-800 text-xs">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="font-semibold text-slate-200 text-[11px] leading-tight">Hackathon Evaluator</p>
            <p className="text-[9px] text-emerald-400 font-mono-code">Live Production Demo</p>
          </div>
        </div>
      </div>
    </header>
  );
}
