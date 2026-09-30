import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowRight,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Building2,
  MapPin,
  CheckCircle2
} from "lucide-react";
import { EntityItem, PaginatedResponse } from "../types";
import { fetchEntities } from "../api";
import { MatchStatusBadge, CountryFlagBadge, SkeletonLoader, EmptyState, ErrorBanner } from "./Common";

interface EntityExplorerProps {
  initialQuery?: string;
  onSelectEntityForInvestigation: (entityId: string) => void;
}

export function EntityExplorer({ initialQuery = "", onSelectEntityForInvestigation }: EntityExplorerProps) {
  const [data, setData] = useState<PaginatedResponse<EntityItem> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and Pagination State
  const [query, setQuery] = useState<string>(initialQuery);
  const [country, setCountry] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("entity_id");
  const [sortDesc, setSortDesc] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchEntities({
        query: query.trim(),
        country,
        status,
        sort_by: sortBy,
        sort_desc: sortDesc,
        page,
        page_size: pageSize
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load entities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [country, status, sortBy, sortDesc, page, pageSize]);

  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleSortToggle = (field: string) => {
    if (sortBy === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(field);
      setSortDesc(false);
    }
    setPage(1);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-display">Entity Explorer</h2>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, and inspect deduplicated Reference Source 1 business records and their matching states.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-lg bg-[#111827] hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#111827] rounded-xl p-4 border border-slate-800 space-y-3 shadow-md">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ID, Business Name, or Address..."
              className="w-full bg-[#0F172A] border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Country Filter */}
          <div className="md:col-span-3">
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Countries (US, India, France)</option>
              <option value="US">United States (US)</option>
              <option value="INDIA">India</option>
              <option value="FRANCE">France (Open-set Test)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="MATCHED">Matched Entities Only</option>
              <option value="SINGLETON">Singletons (Unmatched)</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full h-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && <ErrorBanner message={error} onRetry={loadData} />}

      {/* Main Table */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0F172A] border-b border-slate-800 text-slate-400 uppercase font-semibold font-display tracking-wider">
                <th
                  onClick={() => handleSortToggle("entity_id")}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Source 1 ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle("business_name")}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Business Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Address</th>
                <th
                  onClick={() => handleSortToggle("country")}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Country</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Match Count</th>
                <th className="py-3 px-4">Highest Confidence</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Investigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8">
                    <SkeletonLoader count={6} />
                  </td>
                </tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((entity) => (
                  <tr
                    key={entity.entity_id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Source 1 ID */}
                    <td className="py-3.5 px-4 font-mono-code text-indigo-300 font-semibold">
                      {entity.entity_id}
                    </td>

                    {/* Business Name */}
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <div className="flex items-start gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                        <span className="font-semibold text-slate-100 truncate">{entity.business_name}</span>
                      </div>
                    </td>

                    {/* Address */}
                    <td className="py-3.5 px-4 max-w-[280px] text-slate-400">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                        <span className="truncate">{entity.business_address || "—"}</span>
                      </div>
                    </td>

                    {/* Country */}
                    <td className="py-3.5 px-4">
                      <CountryFlagBadge country={entity.country} />
                    </td>

                    {/* Match Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-mono-code font-bold ${
                          entity.match_count > 0
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {entity.match_count}
                      </span>
                    </td>

                    {/* Highest Confidence */}
                    <td className="py-3.5 px-4">
                      {entity.is_matched ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono-code font-semibold text-emerald-400">
                            <span>{entity.highest_confidence?.toFixed(1) || "95.0"}%</span>
                          </div>
                          <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full"
                              style={{ width: `${entity.highest_confidence || 95}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-mono-code">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <MatchStatusBadge status={entity.status} />
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectEntityForInvestigation(entity.entity_id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <span>Investigate</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8">
                    <EmptyState
                      title="No matching records found"
                      description="Try clearing your search query or selecting a different country filter."
                      actionLabel="Reset Filters"
                      onAction={() => {
                        setQuery("");
                        setCountry("ALL");
                        setStatus("ALL");
                      }}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {data && data.total > 0 && (
          <div className="p-4 bg-[#0F172A] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong className="text-white font-mono-code">{((page - 1) * pageSize) + 1}</strong> to{" "}
                <strong className="text-white font-mono-code">{Math.min(page * pageSize, data.total)}</strong> of{" "}
                <strong className="text-white font-mono-code">{data.total.toLocaleString()}</strong> records
              </span>
            </div>

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
