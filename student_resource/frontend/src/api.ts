import {
  SummaryKPIs,
  EntityItem,
  EntityMatchesResponse,
  EvaluatedCandidate,
  PaginatedResponse,
  ResultRow,
  ModelMetricsResponse,
  DataQualityResponse,
  MethodologyResponse,
  SystemHealth
} from "./types";

const API_BASE = "http://127.0.0.1:8001/api";

export async function fetchHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchSummary(): Promise<SummaryKPIs> {
  const res = await fetch(`${API_BASE}/summary`);
  if (!res.ok) throw new Error(`Failed to fetch summary: ${res.statusText}`);
  return res.json();
}

export async function fetchEntities(params: {
  query?: string;
  country?: string;
  status?: string;
  min_confidence?: number;
  sort_by?: string;
  sort_desc?: boolean;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<EntityItem>> {
  const searchParams = new URLSearchParams();
  if (params.query) searchParams.set("query", params.query);
  if (params.country && params.country !== "ALL") searchParams.set("country", params.country);
  if (params.status && params.status !== "ALL") searchParams.set("status", params.status);
  if (params.min_confidence) searchParams.set("min_confidence", params.min_confidence.toString());
  if (params.sort_by) searchParams.set("sort_by", params.sort_by);
  if (params.sort_desc !== undefined) searchParams.set("sort_desc", params.sort_desc.toString());
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.page_size) searchParams.set("page_size", params.page_size.toString());

  const res = await fetch(`${API_BASE}/entities?${searchParams.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch entities: ${res.statusText}`);
  return res.json();
}

export async function fetchEntityMatches(entityId: string): Promise<EntityMatchesResponse> {
  const res = await fetch(`${API_BASE}/entities/${encodeURIComponent(entityId)}/matches`);
  if (!res.ok) throw new Error(`Failed to fetch matches for ${entityId}: ${res.statusText}`);
  return res.json();
}

export async function comparePair(s1Id: string, targetId: string): Promise<EvaluatedCandidate> {
  const res = await fetch(`${API_BASE}/compare?s1_id=${encodeURIComponent(s1Id)}&target_id=${encodeURIComponent(targetId)}`);
  if (!res.ok) throw new Error(`Failed to compare pair: ${res.statusText}`);
  return res.json();
}

export async function fetchResults(params: {
  page?: number;
  page_size?: number;
  query?: string;
  filter_type?: string;
}): Promise<PaginatedResponse<ResultRow>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.page_size) searchParams.set("page_size", params.page_size.toString());
  if (params.query) searchParams.set("query", params.query);
  if (params.filter_type) searchParams.set("filter_type", params.filter_type);

  const res = await fetch(`${API_BASE}/results?${searchParams.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch results: ${res.statusText}`);
  return res.json();
}

export async function fetchMetrics(): Promise<ModelMetricsResponse> {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) throw new Error(`Failed to fetch metrics: ${res.statusText}`);
  return res.json();
}

export async function fetchDataQuality(): Promise<DataQualityResponse> {
  const res = await fetch(`${API_BASE}/data-quality`);
  if (!res.ok) throw new Error(`Failed to fetch data quality: ${res.statusText}`);
  return res.json();
}

export async function fetchMethodology(): Promise<MethodologyResponse> {
  const res = await fetch(`${API_BASE}/methodology`);
  if (!res.ok) throw new Error(`Failed to fetch methodology: ${res.statusText}`);
  return res.json();
}

export const DOWNLOAD_MATCHING_URL = `${API_BASE}/download/matching`;
export const DOWNLOAD_CANDIDATES_URL = `${API_BASE}/download/candidates`;
