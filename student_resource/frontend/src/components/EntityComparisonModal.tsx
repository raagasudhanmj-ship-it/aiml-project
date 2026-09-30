import React from "react";
import { X, CheckCircle2, XCircle, HelpCircle, ShieldCheck, Scale, ExternalLink, ArrowRight, Building2, MapPin, Globe2 } from "lucide-react";
import { EvaluatedCandidate } from "../types";
import { ConfidenceBadge, CountryFlagBadge } from "./Common";

interface EntityComparisonModalProps {
  comparison: EvaluatedCandidate | null;
  onClose: () => void;
}

export function EntityComparisonModal({ comparison, onClose }: EntityComparisonModalProps) {
  if (!comparison) return null;

  const { reference_entity: r1, candidate_entity: r2, features, evidence, confidence_pct, is_match, threshold } = comparison;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0F172A] border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#0F172A]/95 backdrop-blur z-10">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white font-display">Side-by-Side Entity Verification</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Detailed 20-dimensional pairwise similarity evidence and model confidence assessment
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Decision Outcome Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              is_match
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300"
            }`}
          >
            <div className="flex items-center gap-3">
              {is_match ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-400 flex-shrink-0" />
              ) : (
                <HelpCircle className="w-7 h-7 text-amber-400 flex-shrink-0" />
              )}
              <div>
                <h4 className="text-base font-bold font-display">
                  {is_match ? "PREDICTED MATCH CONFIRMED" : "CANDIDATE SCORED BELOW MATCH THRESHOLD"}
                </h4>
                <p className="text-xs opacity-80 mt-0.5">
                  Model Probability: <strong>{confidence_pct.toFixed(2)}%</strong> · Decision Threshold:{" "}
                  <strong>τ = {threshold}</strong>
                </p>
              </div>
            </div>

            <ConfidenceBadge confidence={confidence_pct} status={comparison.status} />
          </div>

          {/* Side-by-Side Comparison Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reference Source 1 Entity */}
            <div className="p-5 rounded-xl bg-[#111827] border border-indigo-500/30 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-500/20 text-indigo-300 border-b border-l border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider font-mono-code rounded-bl-lg">
                Reference Entity (Source 1)
              </div>

              <div>
                <span className="text-[11px] font-mono-code text-indigo-400 font-bold">{r1.entity_id}</span>
                <h4 className="text-lg font-bold text-white mt-1">{r1.business_name}</h4>
              </div>

              <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
                <div className="flex items-start gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>{r1.business_address || "No address provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <CountryFlagBadge country={r1.country} />
                </div>
              </div>
            </div>

            {/* Target Candidate Entity */}
            <div className="p-5 rounded-xl bg-[#111827] border border-slate-700 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-slate-800 text-cyan-300 border-b border-l border-slate-700 text-[10px] font-bold uppercase tracking-wider font-mono-code rounded-bl-lg">
                Target Registry ({r2.source || "Target"})
              </div>

              <div>
                <span className="text-[11px] font-mono-code text-cyan-400 font-bold">{r2.entity_id}</span>
                <h4 className="text-lg font-bold text-white mt-1">{r2.business_name}</h4>
              </div>

              <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
                <div className="flex items-start gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>{r2.business_address || "No address provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <CountryFlagBadge country={r2.country} />
                </div>
              </div>
            </div>
          </div>

          {/* Core Feature Evidence Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">
              Extracted Pairwise Similarity Evidence (Primary Signals)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-[#111827] border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px]">Name Dice 3-gram</span>
                <p className="text-base font-bold text-white font-mono-code">
                  {(evidence.name_similarity).toFixed(1)}%
                </p>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400" style={{ width: `${evidence.name_similarity}%` }} />
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#111827] border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px]">Name Token Containment</span>
                <p className="text-base font-bold text-white font-mono-code">
                  {(evidence.name_token_overlap).toFixed(1)}%
                </p>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400" style={{ width: `${evidence.name_token_overlap}%` }} />
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#111827] border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px]">Address Similarity</span>
                <p className="text-base font-bold text-white font-mono-code">
                  {(evidence.address_similarity).toFixed(1)}%
                </p>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${evidence.address_similarity}%` }} />
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#111827] border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px]">Address Digits Match</span>
                <p className="text-base font-bold text-white font-mono-code">
                  {evidence.address_numbers_shared > 0 ? `${evidence.address_numbers_shared} Shared Numbers` : "None"}
                </p>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: evidence.address_numbers_shared > 0 ? "100%" : "0%" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Full 20-Feature Diagnostics Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">
              Complete 20-Dimensional ML Feature Vector
            </h4>

            <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 text-[11px] font-mono-code max-h-56 overflow-y-auto">
                {Object.entries(features).map(([name, val]) => (
                  <div key={name} className="p-2 rounded bg-slate-800/50 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 truncate mr-2" title={name}>{name}:</span>
                    <span className="font-bold text-indigo-300">{typeof val === "number" ? val.toFixed(4) : String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#0F172A] border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
