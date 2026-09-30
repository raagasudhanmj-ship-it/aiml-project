import React, { useState, useEffect } from "react";
import {
  Download,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowRight
} from "lucide-react";
import { ResultRow, PaginatedResponse } from "../types";
import { fetchResults, DOWNLOAD_MATCHING_URL, DOWNLOAD_CANDIDATES_URL } from "../api";
import { MatchStatusBadge, CountryFlagBadge, SkeletonLoader, EmptyState, ErrorBanner } from "./Common";

interface PredictionResultsProps {
  onInvestigate: (entityId: string) => void;
}

export function PredictionResults({ onInvestigate }: PredictionResultsProps) {
  const [data, setData] = useState<PaginatedResponse<ResultRow> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchResults({
        page,
        page_size: pageSize,
        query: query.trim(),
        filter_type: filterType
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load prediction results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterType, page, pageSize]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Export Download Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-display">Prediction Results & Submissions</h2>
          <p className="text-xs text-slate-400 mt-1">
            Official evaluation outputs formatted strictly according to competition requirements for leaderboard scoring.
          </p>
        </div>

        {/* Download Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={DOWNLOAD_MATCHING_URL}
            download="matching_results.tsv"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download matching_results.tsv</span>
          </a>

          <a
            href={DOWNLOAD_CANDIDATES_URL}
            download="candidate_pairs.tsv"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            <span>Download candidate_pairs.tsv</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111827] rounded-xl p-4 border border-slate-800 space-y-3 shadow-md">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Source 1 ID, Matched Target ID (e.g. S3-467616579), or Business Name..."
              className="w-full bg-[#0F172A] border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono-code"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Records (Matches & Singletons)</option>
              <option value="MATCHED_ONLY">Matched Entities Only</option>
              <option value="SINGLETONS_ONLY">Singletons Only (Empty Matches)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full h-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
            >
              Filter Output
            </button>
          </div>
        </form>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadData} />}

      {/* Results Table */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0F172A] border-b border-slate-800 text-slate-400 uppercase font-semibold font-display tracking-wider">
                <th className="py-3 px-4">source1_entity_id</th>
                <th className="py-3 px-4">Business Name & Country</th>
                <th className="py-3 px-4">matched_entity_ids (Submission Output)</th>
                <th className="py-3 px-4 text-center">Match Count</th>
                <th className="py-3 px-4 text-center">Candidates Blocked</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <SkeletonLoader count={6} />
                  </td>
                </tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((row) => (
                  <tr key={row.source1_entity_id} className="hover:bg-slate-800/40 transition-colors">
                    {/* S1 ID */}
                    <td className="py-3.5 px-4 font-mono-code font-bold text-indigo-300">
                      {row.source1_entity_id}
                    </td>

                    {/* Name & Country */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <span className="font-semibold text-white block truncate">{row.business_name || "—"}</span>
                      <CountryFlagBadge country={row.country} />
                    </td>

                    {/* Matched IDs */}
                    <td className="py-3.5 px-4 max-w-[320px]">
                      {row.matched_entity_ids && row.matched_entity_ids.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 font-mono-code">
                          {row.matched_entity_ids.map((mid) => (
                            <span
                              key={mid}
                              className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            >
                              {mid}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono-code text-[11px] italic">
                          (empty — verified singleton)
                        </span>
                      )}
                    </td>

                    {/* Match Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-mono-code font-bold ${
                          row.match_count > 0
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {row.match_count}
                      </span>
                    </td>

                    {/* Candidate Count */}
                    <td className="py-3.5 px-4 text-center font-mono-code text-slate-300">
                      {row.candidate_count}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <MatchStatusBadge status={row.status} />
                    </td>

                    {/* Investigate button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onInvestigate(row.source1_entity_id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      title="No output rows match search"
                      description="Try clearing your search query or switching filters."
                      actionLabel="Show All Records"
                      onAction={() => {
                        setQuery("");
                        setFilterType("ALL");
                      }}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="p-4 bg-[#0F172A] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span>
              Showing <strong className="text-white font-mono-code">{((page - 1) * pageSize) + 1}</strong> to{" "}
              <strong className="text-white font-mono-code">{Math.min(page * pageSize, data.total)}</strong> of{" "}
              <strong className="text-white font-mono-code">{data.total.toLocaleString()}</strong> results
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 rounded bg-[#111827] border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <span className="px-3 py-1.5 font-mono-code text-slate-300">
                Page {page} of {data.total_pages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page >= data.total_pages || loading}
                className="px-3 py-1.5 rounded bg-[#111827] border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
