export type SentimentClass = 'Positive' | 'Negative' | 'Neutral';

export interface PredictRequest {
  text: string;
  language_override?: string;
  model_id?: string;
}

export interface PredictResponse {
  prediction_id: string;
  text: string;
  detected_language: string;
  language_name: string;
  script: string;
  language_confidence: number;
  selected_model: string;
  predicted_sentiment: SentimentClass;
  confidence: number;
  probabilities: {
    Positive: number;
    Negative: number;
    Neutral: number;
  };
  is_uncertain: boolean;
  uncertainty_reason?: string;
  inference_time_ms: number;
}

export interface BatchItem {
  id?: string;
  text: string;
  language?: string;
}

export interface BatchPredictResponse {
  total_processed: number;
  sentiment_summary: Record<string, number>;
  language_summary: Record<string, number>;
  avg_inference_time_ms: number;
  results: PredictResponse[];
}

export interface LanguageItem {
  code: string;
  name: string;
  native_name: string;
  script: string;
  family: string;
  dataset_availability: string;
  model_compatibility: string[];
  status: string;
  samples: {
    positive: string;
    negative: string;
    neutral: string;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  type: string;
  architecture: string;
  parameters: string;
  supported_languages: string[];
  status: string;
  description: string;
  strengths: string;
  limitations: string;
}

export interface OverviewData {
  total_analyzed_texts: number;
  benchmark_dataset_samples: number;
  supported_languages_count: number;
  available_models_count: number;
  sentiment_distribution: Record<string, number>;
  language_distribution: Record<string, number>;
  length_histogram: Record<string, number>;
  recent_predictions: Array<{
    prediction_id: string;
    text: string;
    language: string;
    sentiment: SentimentClass;
    confidence: number;
    model: string;
    created_at: string;
  }>;
}

export interface LanguageAnalyticsItem {
  code: string;
  total_samples: number;
  positive: number;
  negative: number;
  neutral: number;
  avg_char_length: number;
  baseline_f1: number;
  baseline_acc: number;
  transformer_f1: number;
  is_code_mixed: boolean;
  resource_level: string;
}

export interface LanguageAnalyticsData {
  languages: LanguageAnalyticsItem[];
  overall_macro_f1: number;
  lowest_resource_family: string;
  error_patterns: Array<{
    category: string;
    description: string;
    impact: string;
  }>;
}

export interface ModelComparisonItem {
  id: string;
  name: string;
  type: string;
  accuracy: number;
  macro_f1: number;
  weighted_f1: number;
  precision: number;
  recall: number;
  latency_ms: number;
  training_time_sec: number;
  model_size_mb: number;
  parameters: string;
  confusion_matrix: number[][];
  per_class: Record<string, {
    precision: number;
    recall: number;
    f1_score: number;
    support: number;
  }>;
}

export interface ModelComparisonData {
  evaluation_dataset: string;
  classes: string[];
  models: ModelComparisonItem[];
}

export interface HistoryItem {
  id: number;
  prediction_id: string;
  text: string;
  detected_language: string;
  language_confidence: number;
  predicted_sentiment: SentimentClass;
  confidence: number;
  probabilities: Record<string, number>;
  model_name: string;
  is_uncertain: boolean;
  inference_time_ms: number;
  created_at: string;
}

export interface HistoryResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: HistoryItem[];
}

export interface DatasetItem {
  dataset_id: string;
  name: string;
  source: string;
  language_coverage: string[];
  sample_count: number;
  sentiment_distribution?: Record<string, number>;
  license_info: string;
  created_at?: string;
  status?: string;
}

export interface ExperimentItem {
  experiment_id: string;
  name: string;
  research_question: string;
  model_id: string;
  status: 'Pending' | 'Running' | 'Completed' | 'Failed';
  parameters?: Record<string, any>;
  metrics?: Record<string, any>;
  error_message?: string;
  start_time: string;
  completion_time?: string;
}
