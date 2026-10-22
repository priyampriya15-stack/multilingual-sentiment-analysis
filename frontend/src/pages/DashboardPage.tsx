import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import {
  Sparkles,
  Languages,
  Database,
  Cpu,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import ApiService from '../services/api';
import type { OverviewData } from '../types';

const COLORS = {
  Positive: '#10b981', // emerald-500
  Negative: '#f43f5e', // rose-500
  Neutral: '#f59e0b',  // amber-500
};

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to load overview:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading research analytics...</p>
        </div>
      </div>
    );
  }

  // Format sentiment chart data
  const sentimentData = data?.sentiment_distribution
    ? Object.entries(data.sentiment_distribution).map(([name, value]) => ({
        name,
        value,
        color: COLORS[name as keyof typeof COLORS] || '#6366f1',
      }))
    : [];

  // Format language chart data
  const languageData = data?.language_distribution
    ? Object.entries(data.language_distribution)
        .map(([name, count]) => ({ name: name.toUpperCase(), count }))
        .sort((a, b) => b.count - a.count)
    : [];

  // Format length histogram
  const lengthData = data?.length_histogram
    ? Object.entries(data.length_histogram).map(([bin, count]) => ({ bin, count }))
    : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/20 p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Multilingual Sentiment NLP Research Platform
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Indian Languages Sentiment Analysis & Benchmark
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            High-precision cross-lingual classification across 12 scheduled Indian languages,
            code-mixed Hinglish/Tanglish, and comparison between subword TF-IDF baselines and multilingual transformers (XLM-RoBERTa, IndicBERT).
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-6 rounded-2xl glass-panel-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Analyzed</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{data?.total_analyzed_texts || 0}</span>
            <span className="text-xs text-emerald-400 font-medium">Live Queries</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Audit trail logged in database</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl glass-panel-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Supported Languages</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Languages className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{data?.supported_languages_count || 13}</span>
            <span className="text-xs text-purple-400 font-medium">Scripts & Dialects</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">12 Scheduled + Code-Mixed Hinglish</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl glass-panel-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Benchmark Samples</span>
            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{data?.benchmark_dataset_samples || 1905}</span>
            <span className="text-xs text-pink-400 font-medium">Curated & Split</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Stratified 70/15/15 train/val/test</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl glass-panel-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Evaluated Models</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{data?.available_models_count || 3}</span>
            <span className="text-xs text-emerald-400 font-medium">Architectures</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">TF-IDF, XLM-R, IndicBERT</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment Distribution Donut Chart */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <h3 className="text-base font-bold text-white flex items-center justify-between">
            Sentiment Class Distribution
            <span className="text-xs font-normal text-slate-400">3-Class Polarity</span>
          </h3>
          <div className="mt-4 flex-1 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f9fafb',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2 pt-4 border-t border-slate-800">
            {sentimentData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-300 font-medium">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Language Representation Bar Chart */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col">
          <h3 className="text-base font-bold text-white flex items-center justify-between">
            Language Representation in Corpus
            <span className="text-xs font-normal text-slate-400">Samples per Code</span>
          </h3>
          <div className="mt-4 flex-1 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={languageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f9fafb',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 mt-2 pt-4 border-t border-slate-800">
            Balanced coverage ensuring unbiased evaluation across high-resource (Hindi, Bengali) and mid/low-resource Indic scripts (Assamese, Odia, Punjabi).
          </p>
        </div>
      </div>

      {/* Recent Predictions Audit Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Recent Real-Time Inferences</h3>
            <p className="text-xs text-slate-400 mt-0.5">Live prediction feed from database</p>
          </div>
          <a
            href="/history"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            View Full Audit Log <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold border-b border-slate-800/80">
              <tr>
                <th className="py-3.5 px-6">Text Snippet</th>
                <th className="py-3.5 px-6">Language</th>
                <th className="py-3.5 px-6">Model</th>
                <th className="py-3.5 px-6">Sentiment</th>
                <th className="py-3.5 px-6">Confidence</th>
                <th className="py-3.5 px-6 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {data?.recent_predictions && data.recent_predictions.length > 0 ? (
                data.recent_predictions.map((p) => (
                  <tr key={p.prediction_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-slate-200 max-w-xs truncate">{p.text}</td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 font-mono">
                        {p.language.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-400">{p.model}</td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          p.sentiment === 'Positive'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : p.sentiment === 'Negative'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {p.sentiment}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-200">
                      {(p.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 text-right font-mono text-[11px]">
                      {p.created_at}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No predictions yet. Head to the{' '}
                    <a href="/analyzer" className="text-indigo-400 hover:underline">
                      Sentiment Analyzer
                    </a>{' '}
                    to test Indian language sentences!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
