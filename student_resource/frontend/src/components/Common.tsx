import React from "react";
import { AlertTriangle, CheckCircle2, HelpCircle, Layers, ShieldCheck, XCircle } from "lucide-react";

export function ConfidenceBadge({
  confidence,
  status
}: {
  confidence: number;
  status?: "MATCH" | "REVIEW" | "NON_MATCH";
}) {
  let bg = "bg-rose-500/10 text-rose-400 border-rose-500/30";
  let label = "LOW CONFIDENCE";
  let icon = <XCircle className="w-3.5 h-3.5" />;

  if (confidence >= 88 || status === "MATCH") {
    bg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    label = confidence >= 92 ? "HIGH CONFIDENCE" : "CONFIRMED MATCH";
    icon = <CheckCircle2 className="w-3.5 h-3.5" />;
  } else if (confidence >= 65 || status === "REVIEW") {
    bg = "bg-amber-500/10 text-amber-400 border-amber-500/30";
    label = "BORDERLINE / REVIEW";
    icon = <HelpCircle className="w-3.5 h-3.5" />;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bg}`}>
      {icon}
      <span>{confidence.toFixed(1)}%</span>
      <span className="opacity-75 font-medium text-[10px] tracking-wider uppercase">· {label}</span>
    </div>
  );
}

export function MatchStatusBadge({ status }: { status: "MATCHED" | "SINGLETON" | string }) {
  if (status === "MATCHED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3" />
        Matched
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-700/50">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
      Singleton
    </span>
  );
}

export function CountryFlagBadge({ country }: { country: string }) {
  const c = country ? country.toUpperCase() : "UNKNOWN";
  let flag = "🌐";
  let label = c;

  if (c === "US" || c.includes("UNITED STATES")) {
    flag = "🇺🇸";
    label = "United States";
  } else if (c === "INDIA" || c === "IN") {
    flag = "🇮🇳";
    label = "India";
  } else if (c === "FRANCE" || c === "FR") {
    flag = "🇫🇷";
    label = "France";
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 font-medium">
      <span>{flag}</span>
      <span>{label}</span>
    </span>
  );
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "indigo"
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  color?: "indigo" | "emerald" | "amber" | "rose" | "cyan" | "purple";
}) {
  const colorMap = {
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 group-hover:border-indigo-500/40",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/40",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20 group-hover:border-amber-500/40",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20 group-hover:border-rose-500/40",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 group-hover:border-cyan-500/40",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20 group-hover:border-purple-500/40"
  };

  return (
    <div className="group relative bg-[#111827] rounded-xl p-5 border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1.5 tracking-tight font-display">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-lg border ${colorMap[color]} transition-colors`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-slate-400 truncate max-w-[200px]">{subtitle}</span>
        {trend && (
          <span className="text-emerald-400 font-medium font-mono-code bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

export function SkeletonLoader({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-14 bg-slate-800/50 rounded-lg border border-slate-800/60" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="text-center py-16 px-4 bg-[#111827]/40 rounded-xl border border-dashed border-slate-800">
      <div className="w-12 h-12 rounded-full bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto mb-3">
        <Layers className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-slate-200 font-display">{title}</h4>
      <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center justify-between gap-3 text-rose-300 text-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold cursor-pointer transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
