import React, { useState, useEffect } from "react";
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Layers,
  Sparkles,
  Search,
  FileCheck,
  BarChart3
} from "lucide-react";
import { DataQualityResponse } from "../types";
import { fetchDataQuality } from "../api";
import { MetricCard, SkeletonLoader, ErrorBanner } from "./Common";

export function DataQuality() {
  const [data, setData] = useState<DataQualityResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDataQuality()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load data quality statistics");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <SkeletonLoader count={4} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <ErrorBanner message={error || "Failed to load data quality"} />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 mb-2 font-mono-code">
          <Database className="w-3.5 h-3.5" />
          Enterprise Data Health & Profiling
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight font-display">Data Quality & Noise Diagnostics</h2>
        <p className="text-xs text-slate-400 mt-1">
          Completeness verification across Reference Source 1 and Target Commercial Registries (Source 2 & Source 3).
        </p>
      </div>

      {/* Source Completeness Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.sources.map((src, i) => (
          <div key={i} className="bg-[#111827] rounded-xl p-6 border border-slate-800 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 font-mono-code">
                  Registry Stream
                </span>
                <h3 className="text-base font-bold text-white font-display mt-0.5">{src.source}</h3>
              </div>
              <span className="text-xs font-mono-code px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                {src.completeness_score}% Health
              </span>
            </div>

            <p className="text-xs text-slate-400">{src.role}</p>

            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs font-mono-code">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Records:</span>
                <span className="text-white font-bold">{src.total_records.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sample Indexed:</span>
                <span className="text-slate-300">{src.records_sampled.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Missing Names:</span>
                <span className="text-emerald-400">{src.missing_names} (0.00%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Missing Addresses:</span>
                <span className={src.missing_addresses > 0 ? "text-amber-400" : "text-emerald-400"}>
                  {src.missing_addresses}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Missing Countries:</span>
                <span className="text-emerald-400">{src.missing_countries} (0.00%)</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Noise Patterns & Automated Resolution Matrix */}
      <div className="bg-[#111827] rounded-xl p-6 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-display">Noise Patterns & Preprocessing Resilience</h3>
            <p className="text-xs text-slate-400">Automated cleaning strategies implemented in preprocessing & blocking</p>
          </div>
          <Sparkles className="w-5 h-5 text-indigo-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0F172A] border-b border-slate-800 text-slate-400 uppercase font-semibold font-display">
                <th className="py-3 px-4">Noise Category</th>
                <th className="py-3 px-4">Observed Dataset Example</th>
                <th className="py-3 px-4">Automated Pipeline Resolution Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-code">
              {data.common_noise_patterns.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="py-3.5 px-4 font-bold text-indigo-300">{item.category}</td>
                  <td className="py-3.5 px-4 text-slate-300">{item.example}</td>
                  <td className="py-3.5 px-4 text-emerald-300 font-sans">{item.handling}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
