export interface SummaryKPIs {
  total_s1_entities: number;
  total_s2_records: number;
  total_s3_records: number;
  total_target_records: number;
  candidate_pairs_generated: number;
  predicted_matches: number;
  unmatched_entities: number;
  matched_entities: number;
  match_rate_pct: number;
  singleton_rate_pct: number;
  s2_matches: number;
  s3_matches: number;
  multi_source_matches: number;
  macro_f05: number;
  macro_precision: number;
  macro_recall: number;
  singleton_accuracy: number;
  selected_threshold: number;
  reduction_ratio_pct: number;
  cartesian_space_comparisons: string;
  country_distribution: Record<string, number>;
}

export interface EntityItem {
  entity_id: string;
  business_name: string;
  business_address: string;
  country: string;
  match_count: number;
  candidate_count: number;
  matched_ids: string[];
  candidate_ids: string[];
  is_matched: boolean;
  status: "MATCHED" | "SINGLETON";
  highest_confidence?: number;
}

export interface TargetEntity {
  entity_id: string;
  source: string;
  business_name: string;
  business_address: string;
  country: string;
}

export interface MatchEvidence {
  name_similarity: number;
  name_token_overlap: number;
  address_similarity: number;
  address_token_overlap: number;
  country_match: boolean;
  address_numbers_shared: number;
  postal_match: boolean;
}

export interface EvaluatedCandidate {
  source1_id: string;
  target_id: string;
  reference_entity: EntityItem;
  candidate_entity: TargetEntity;
  confidence: number;
  confidence_pct: number;
  confidence_tier: string;
  is_match: boolean;
  threshold: number;
  status: "MATCH" | "REVIEW" | "NON_MATCH";
  features: Record<string, number>;
  evidence: MatchEvidence;
}

export interface EntityMatchesResponse {
  reference_entity: EntityItem;
  match_count: number;
  candidate_count: number;
  matches: EvaluatedCandidate[];
  other_candidates: EvaluatedCandidate[];
  is_singleton: boolean;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: T[];
}

export interface ResultRow {
  source1_entity_id: string;
  business_name: string;
  country: string;
  matched_entity_ids: string[];
  match_count: number;
  candidate_entity_ids: string[];
  candidate_count: number;
  status: "MATCHED" | "SINGLETON";
}

export interface ThresholdSweepPoint {
  threshold: number;
  precision: number;
  recall: number;
  f05: number;
  selected?: boolean;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
  category: string;
  description: string;
}

export interface ModelMetricsResponse {
  model_architecture: string;
  hyperparameters: Record<string, any>;
  validation_metrics: {
    macro_f05: number;
    macro_precision: number;
    macro_recall: number;
    singleton_accuracy: number;
    total_entities: number;
    singletons_total: number;
    singletons_correct: number;
  };
  selected_threshold: number;
  threshold_curve: ThresholdSweepPoint[];
  feature_importance: FeatureImportanceItem[];
  dataset_splits: {
    train_s1_entities: number;
    val_s1_entities: number;
    positive_pairs: number;
    negative_pairs: number;
    pos_neg_ratio: string;
    candidate_pairs_evaluated: number;
  };
  metric_explanation: {
    f05_formula: string;
    emphasis: string;
  };
}

export interface DataSourceQuality {
  source: string;
  records_sampled: number;
  total_records: number;
  missing_names: number;
  missing_addresses: number;
  missing_countries: number;
  completeness_score: number;
  role: string;
}

export interface NoisePattern {
  category: string;
  example: string;
  handling: string;
}

export interface DataQualityResponse {
  sources: DataSourceQuality[];
  common_noise_patterns: NoisePattern[];
}

export interface PipelineStage {
  stage: number;
  name: string;
  summary: string;
  details: string;
}

export interface MethodologyFAQ {
  question: string;
  answer: string;
}

export interface MethodologyResponse {
  pipeline_stages: PipelineStage[];
  faqs: MethodologyFAQ[];
}

export interface SystemHealth {
  status: string;
  platform: string;
  version: string;
  model_loaded: boolean;
  model_type: string;
  threshold: number;
  indexed_s1_records: number;
  indexed_target_records: number;
  matching_results_available: boolean;
  candidate_pairs_available: boolean;
}
