import React, { useState, useEffect } from "react";
import {
  Search,
  GitCompare,
  Building2,
  MapPin,
  Globe2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Scale,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { EntityMatchesResponse, EvaluatedCandidate } from "../types";
import { fetchEntityMatches } from "../api";
import { ConfidenceBadge, CountryFlagBadge, SkeletonLoader, EmptyState, ErrorBanner } from "./Common";
import { EntityComparisonModal } from "./EntityComparisonModal";

interface MatchInvestigationProps {
  selectedEntityId: string;
  onSelectNewEntity: (entityId: string) => void;
}

export function MatchInvestigation({ selectedEntityId, onSelectNewEntity }: MatchInvestigationProps) {
  const [searchInput, setSearchInput] = useState<string>(selectedEntityId || "S1-778640743");
  const [data, setData] = useState<EntityMatchesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeComparison, setActiveComparison] = useState<EvaluatedCandidate | null>(null);

  const demoEntities = [
    { id: "S1-778640743", label: "S1-778640743 (US Match)", country: "US" },
    { id: "S1-628750886", label: "S1-628750886 (France Match)", country: "France" },
    { id: "S1-913506265", label: "S1-913506265 (France Singleton)", country: "France" },
    { id: "S1-481669221", label: "S1-481669221 (India Candidate)", country: "India" }
  ];

  const loadEntityData = async (entityId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchEntityMatches(entityId);
      setData(res);
      setSearchInput(entityId);
    } catch (err: any) {
      setError(err.message || `Failed to load entity ${entityId}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEntityId) {
      loadEntityData(selectedEntityId);
    } else {
      loadEntityData("S1-778640743");
    }
  }, [selectedEntityId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSelectNewEntity(searchInput.trim());
      loadEntityData(searchInput.trim());
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Comparison Modal */}
      {activeComparison && (
        <EntityComparisonModal
          comparison={activeComparison}
          onClose={() => setActiveComparison(null)}
        />
      )}

      {/* Header & Search Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 mb-2 font-mono-code">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Flagship Verification Suite
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-display">
            Match Investigation & Evidence Diagnostic
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Deep-dive into reference business records, evaluated candidate pairs, and real-time similarity feature metrics.
          </p>
        </div>

        {/* Quick Demo Entity Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Demo Targets:</span>
          {demoEntities.map((demo) => (
            <button
              key={demo.id}
              onClick={() => {
                onSelectNewEntity(demo.id);
                loadEntityData(demo.id);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono-code font-semibold border transition-all cursor-pointer ${
                searchInput === demo.id
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/25"
                  : "bg-[#111827] text-slate-300 border-slate-700 hover:bg-slate-800"
              }`}
            >
              {demo.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-[#111827] rounded-xl p-4 border border-slate-800 shadow-md">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter Source 1 Entity ID (e.g. S1-778640743)..."
              className="w-full bg-[#0F172A] border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono-code"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
          >
            Investigate Entity
          </button>
        </form>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => loadEntityData(searchInput)} />}

      {loading ? (
        <SkeletonLoader count={4} />
      ) : data ? (
        <div className="space-y-8">
          {/* 1. REFERENCE ENTITY CARD */}
          <div className="bg-[#111827] rounded-2xl p-6 border-2 border-indigo-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider font-mono-code rounded-bl-xl shadow-md">
              Reference Entity (Source 1)
            </div>

            <div className="space-y-4 max-w-3xl">
              <div>
                <span className="text-xs font-mono-code font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {data.reference_entity.entity_id}
                </span>
                <h3 className="text-2xl font-bold text-white mt-2 font-display">
                  {data.reference_entity.business_name}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-800">
                <div className="flex items-start gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Address</span>
                    <span className="text-slate-200 font-medium">{data.reference_entity.business_address || "No address provided"}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-slate-300">
                  <Globe2 className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Jurisdiction</span>
                    <CountryFlagBadge country={data.reference_entity.country} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 text-xs">
                <span className="text-slate-400">Resolution Status:</span>
                {data.is_singleton ? (
                  <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                    Singleton (Unmatched Entity)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {data.match_count} Confirmed Target Linkage(s)
                  </span>
                )}
                <span className="text-slate-400">·</span>
                <span className="text-slate-400 font-mono-code">{data.candidate_count} Blocked Candidate Pairs</span>
              </div>
            </div>
          </div>

          {/* 2. PREDICTED MATCHED CANDIDATES */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Predicted Matches ({data.matches.length})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Target records scoring above optimal decision boundary (τ = 0.88)
                </p>
              </div>
            </div>

            {data.matches.length > 0 ? (
              <div className="space-y-4">
                {data.matches.map((cand) => (
                  <div
                    key={cand.target_id}
                    className="bg-[#111827] rounded-xl p-6 border border-emerald-500/40 shadow-lg hover:border-emerald-500/60 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono-code font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            {cand.target_id}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">
                            {cand.candidate_entity.source}
                          </span>
                        </div>
                        <h4 className="text-xl font-bold text-white mt-1.5 font-display">
                          {cand.candidate_entity.business_name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3">
                        <ConfidenceBadge confidence={cand.confidence_pct} status={cand.status} />
                        <button
                          onClick={() => setActiveComparison(cand)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                        >
                          <Scale className="w-3.5 h-3.5" />
                          <span>Compare Side-by-Side</span>
                        </button>
                      </div>
                    </div>

                    {/* Address & Country */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      <div className="flex items-start gap-2 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span>{cand.candidate_entity.business_address || "No address provided"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <CountryFlagBadge country={cand.candidate_entity.country} />
                      </div>
                    </div>

                    {/* Similarity Evidence Breakdown */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-display">
                        Pairwise Similarity Evidence Breakdown
                      </span>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 space-y-1">
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>Name Dice 3-gram</span>
                            <span className="font-mono-code font-bold text-white">
                              {cand.evidence.name_similarity.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-400 rounded-full"
                              style={{ width: `${cand.evidence.name_similarity}%` }}
                            />
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 space-y-1">
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>Token Containment</span>
                            <span className="font-mono-code font-bold text-white">
                              {cand.evidence.name_token_overlap.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-400 rounded-full"
                              style={{ width: `${cand.evidence.name_token_overlap}%` }}
                            />
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 space-y-1">
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>Address Dice 3-gram</span>
                            <span className="font-mono-code font-bold text-white">
                              {cand.evidence.address_similarity.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-400 rounded-full"
                              style={{ width: `${cand.evidence.address_similarity}%` }}
                            />
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 space-y-1">
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>Address Digits</span>
                            <span className="font-mono-code font-bold text-emerald-400">
                              {cand.evidence.address_numbers_shared > 0 ? "Match" : "N/A"}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full"
                              style={{ width: cand.evidence.address_numbers_shared > 0 ? "100%" : "0%" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-[#111827] rounded-xl border border-slate-800 text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-indigo-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Target Matches Exceeded Confidence Threshold</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  This entity is correctly identified as a <strong>Singleton</strong>. False merges on singletons are heavily penalized under the competition's macro $F_{0.5}$ metric.
                </p>
              </div>
            )}
          </div>

          {/* 3. OTHER BLOCKED CANDIDATE PAIRS (TRANSPARENCY) */}
          {data.other_candidates && data.other_candidates.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-300 font-display flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Other Blocked Candidate Pairs Scored Below Threshold ({data.other_candidates.length})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Candidates retrieved during multi-pass blocking that were rejected by the HistGradientBoosting model (False Positive Prevention).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.other_candidates.map((cand) => (
                  <div
                    key={cand.target_id}
                    className="p-4 rounded-xl bg-[#111827]/80 border border-slate-800 hover:border-slate-700 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono-code text-slate-400 font-semibold">{cand.target_id}</span>
                      <ConfidenceBadge confidence={cand.confidence_pct} status={cand.status} />
                    </div>

                    <p className="text-sm font-bold text-slate-200">{cand.candidate_entity.business_name}</p>
                    <p className="text-xs text-slate-400 truncate">{cand.candidate_entity.business_address || "No address"}</p>

                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Name Sim: {cand.evidence.name_similarity.toFixed(1)}%</span>
                      <button
                        onClick={() => setActiveComparison(cand)}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Inspect Pair</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
