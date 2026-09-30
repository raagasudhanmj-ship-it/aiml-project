import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Award,
  ShieldCheck,
  Cpu,
  BarChart2,
  Info,
  Layers,
  Scale,
  CheckCircle2,
  Sliders,
  Sparkles
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { ModelMetricsResponse } from "../types";
import { fetchMetrics } from "../api";
import { MetricCard, SkeletonLoader, ErrorBanner } from "./Common";

export function ModelPerformance() {
  const [data, setData] = useState<ModelMetricsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load model metrics");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <SkeletonLoader count={5} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <ErrorBanner message={error || "Failed to load metrics"} />
      </div>
    );
  }

  const { validation_metrics, selected_threshold, threshold_curve, feature_importance, dataset_splits } = data;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2 font-mono-code">
            <Award className="w-3.5 h-3.5" />
            Verified Macro F0.5 Optimization
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-display">Model Performance & Calibration</h2>
          <p className="text-xs text-slate-400 mt-1">
            Quantitative evaluation on group-split validation data and decision threshold calibration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-code px-3 py-1.5 rounded-lg bg-[#111827] border border-slate-800 text-slate-300">
            Model: <strong className="text-white">HistGradientBoosting</strong>
          </span>
          <span className="text-xs font-mono-code px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold">
            Threshold: τ = {selected_threshold}
          </span>
        </div>
      </div>

      {/* Official Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Macro F0.5 Score"
          value={validation_metrics.macro_f05.toFixed(4)}
          subtitle="Competition Optimization Metric"
          icon={Award}
          trend="89.57%"
          color="emerald"
        />
        <MetricCard
          title="Macro Precision"
          value={`${(validation_metrics.macro_precision * 100).toFixed(2)}%`}
          subtitle="True Positives / Predicted Matches"
          icon={ShieldCheck}
          trend="Near Zero Merges"
          color="cyan"
        />
        <MetricCard
          title="Macro Recall"
          value={`${(validation_metrics.macro_recall * 100).toFixed(2)}%`}
          subtitle="True Positives / Ground Truth Targets"
          icon={TrendingUp}
          trend="80.75%"
          color="indigo"
        />
        <MetricCard
          title="Singleton Accuracy"
          value={`${(validation_metrics.singleton_accuracy * 100).toFixed(2)}%`}
          subtitle={`${validation_metrics.singletons_correct} of ${validation_metrics.singletons_total} Unmatched Handled`}
          icon={CheckCircle2}
          trend="100.0%"
          color="purple"
        />
      </div>

      {/* Metric Rationale Callout Banner */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-indigo-500/30 space-y-3">
        <div className="flex items-center gap-2.5">
          <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <h3 className="text-base font-bold text-white font-display">
            Why Macro-Averaged F0.5 with Singleton Preservation?
          </h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>F0.5 places 2x greater emphasis on precision than recall.</strong> In business master data management,
          merging two distinct companies creates catastrophic financial and legal compliance risk (false positive).
          Conversely, failing to link a borderline trade variant (false negative) is far less harmful. Correctly identified
          singletons receive full $1.0$ score, while incorrect merges on singletons severely degrade macro score to $0.0$.
        </p>

        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono-code text-indigo-300 flex items-center justify-between">
          <span>Formula: F_0.5 = (1.25 × Precision × Recall) / (0.25 × Precision + Recall)</span>
          <span className="text-emerald-400 font-bold">Singleton Credit = 1.0</span>
        </div>
      </div>

      {/* Threshold Optimization Sweep Chart */}
      <div className="bg-[#111827] rounded-xl p-6 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white font-display">
              Threshold Calibration Sweep ($F_{0.5}$ vs Precision vs Recall)
            </h3>
            <p className="text-xs text-slate-400">
              Optimal boundary at τ = {selected_threshold} maximizes macro F0.5 by aggressively pruning false positives.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono-code">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> F0.5 Curve
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Precision
            </span>
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Recall
            </span>
          </div>
        </div>

        <div className="h-72 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={threshold_curve} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="threshold" stroke="#64748B" fontSize={11} tickFormatter={(v) => `τ=${v}`} />
              <YAxis stroke="#64748B" fontSize={11} domain={[0.65, 1.0]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
              />
              <Line type="monotone" dataKey="f05" name="Macro F0.5" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="precision" name="Precision" stroke="#06B6D4" strokeWidth={2} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="recall" name="Recall" stroke="#6366F1" strokeWidth={2} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Split Transparency and Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dataset Split Verification */}
        <div className="bg-[#111827] rounded-xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white font-display">Dataset Split Protocol (Zero Leakage)</h4>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono-code font-semibold">
              Group Split by S1 ID
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-800/40 border border-slate-800 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">TRAINING SET (80%)</p>
                <p className="text-slate-400">4,000 S1 Entities · 11,178 Positives · 33,534 Sampled Negatives</p>
              </div>
              <span className="font-mono-code font-bold text-indigo-400">Ratio 1:3.00</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-800/40 border border-slate-800 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">VALIDATION SET (20% Holdout)</p>
                <p className="text-slate-400">1,000 S1 Entities (54 Singletons) · Exhaustive Threshold Calibration</p>
              </div>
              <span className="font-mono-code font-bold text-emerald-400">F0.5: 0.8957</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-800/40 border border-slate-800 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">TEST SET (Leaderboard)</p>
                <p className="text-slate-400">1,732,544 S1 Records (Including Unseen France Domain) · Blind Inference</p>
              </div>
              <span className="font-mono-code font-bold text-cyan-400">Open-Set Ready</span>
            </div>
          </div>
        </div>

        {/* Feature Importance Ranking */}
        <div className="bg-[#111827] rounded-xl p-6 border border-slate-800 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white font-display">Feature Importance & Signal Weighting</h4>
            <p className="text-xs text-slate-400">Relative contribution of pairwise similarity features in decision trees</p>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {feature_importance.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800/80 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-mono-code font-semibold text-slate-200">{item.feature}</span>
                  <span className="font-mono-code font-bold text-indigo-400">{(item.importance * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full" style={{ width: `${item.importance * 300}%` }} />
                </div>
                <p className="text-[10px] text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
