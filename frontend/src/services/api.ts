import axios from 'axios';
import type {
  PredictResponse,
  BatchPredictResponse,
  OverviewData,
  LanguageAnalyticsData,
  ModelComparisonData,
  HistoryResponse,
  DatasetItem,
  ExperimentItem,
  LanguageItem,
  ModelInfo,
  LoginResponse,
  User,
  LoginCredentials
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const ApiService = {
  // Authentication
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  // Health & Metadata
  getHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },

  getLanguages: async (): Promise<{ supported_languages: LanguageItem[] }> => {
    const res = await api.get('/languages');
    return res.data;
  },

  getModels: async (): Promise<{ models: ModelInfo[]; default_model: string }> => {
    const res = await api.get('/models');
    return res.data;
  },

  // Prediction
  predictSentiment: async (text: string, languageOverride?: string, modelId?: string): Promise<PredictResponse> => {
    const res = await api.post('/predict', {
      text,
      language_override: languageOverride || undefined,
      model_id: modelId || undefined,
    });
    return res.data;
  },

  predictBatch: async (items: Array<{ text: string; language?: string }>, modelId?: string): Promise<BatchPredictResponse> => {
    const res = await api.post('/predict/batch', {
      items,
      model_id: modelId || undefined,
    });
    return res.data;
  },

  // Analytics
  getOverview: async (): Promise<OverviewData> => {
    const res = await api.get('/analytics/overview');
    return res.data;
  },

  getLanguageAnalytics: async (): Promise<LanguageAnalyticsData> => {
    const res = await api.get('/analytics/languages');
    return res.data;
  },

  getModelComparison: async (): Promise<ModelComparisonData> => {
    const res = await api.get('/analytics/model-comparison');
    return res.data;
  },

  getHistory: async (params: {
    page?: number;
    page_size?: number;
    search?: string;
    language?: string;
    sentiment?: string;
    model?: string;
  }): Promise<HistoryResponse> => {
    const res = await api.get('/analytics/history', { params });
    return res.data;
  },

  deleteHistoryItem: async (predictionId: string) => {
    const res = await api.delete(`/analytics/history/${predictionId}`);
    return res.data;
  },

  // Datasets
  getDatasets: async (): Promise<DatasetItem[]> => {
    const res = await api.get('/datasets');
    return res.data;
  },

  uploadDataset: async (formData: FormData) => {
    const res = await api.post('/datasets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // Experiments
  getExperiments: async (): Promise<ExperimentItem[]> => {
    const res = await api.get('/experiments');
    return res.data;
  },

  runExperiment: async (payload: {
    name: string;
    experiment_type: string;
    model_id: string;
    parameters?: Record<string, any>;
  }): Promise<ExperimentItem> => {
    const res = await api.post('/experiments/run', payload);
    return res.data;
  },

  getExperiment: async (experimentId: string): Promise<ExperimentItem> => {
    const res = await api.get(`/experiments/${experimentId}`);
    return res.data;
  },
};

export default ApiService;
