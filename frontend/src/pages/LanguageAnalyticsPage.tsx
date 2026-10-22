import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Languages,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  Info
} from 'lucide-react';
import ApiService from '../services/api';
import type { LanguageAnalyticsData } from '../types';

export const LanguageAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<LanguageAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getLanguageAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load language analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Format bar chart data comparing Baseline F1 vs Transformer F1
  const chartData = (data?.languages || []).map((l) => ({
    language: l.code.toUpperCase(),
    Baseline_F1: Math.round(l.baseline_f1 * 100),
    Transformer_F1: Math.round(l.transformer_f1 * 100),
    Samples: l.total_samples,
  }));

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
          <Languages className="w-3.5 h-3.5" /> Cross-Lingual Evaluation
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Language-Specific NLP Analytics</h2>
        <p className="text-slate-400 text-sm mt-1">
          Comparative empirical performance across Indo-Aryan, Dravidian, and Code-Mixed linguistic branches.
        </p>
      </div>

      {/* Main Comparative Bar Chart */}
      <div className="glass-panel p-6 lg:p-8 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Macro F1-Score by Language (%)</h3>
            <p className="text-xs text-slate-400">Comparing Subword TF-IDF Baseline vs Multilingual Transformer</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-sm bg-indigo-500" /> TF-IDF Baseline
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-sm bg-pink-500" /> Transformer Head
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="language" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} domain={[70, 100]} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="Baseline_F1" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Transformer_F1" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-Language Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Linguistic Breakdown & Class Counts</h3>
          <p className="text-xs text-slate-400 mt-0.5">Sample volume and sentiment polarization by language</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Language Code</th>
                <th className="py-3.5 px-6">Resource Tier</th>
                <th className="py-3.5 px-6">Total Samples</th>
                <th className="py-3.5 px-6">Positive</th>
                <th className="py-3.5 px-6">Negative</th>
                <th className="py-3.5 px-6">Neutral</th>
                <th className="py-3.5 px-6">Macro F1</th>
                <th className="py-3.5 px-6 text-right">Avg Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {data?.languages.map((l) => (
                <tr key={l.code} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-6 font-mono font-bold text-white">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60">
                      {l.code.toUpperCase()}
                    </span>
                    {l.is_code_mixed && (
                      <span className="ml-2 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-sans">
                        Code-Mixed
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`text-[11px] font-semibold ${
                        l.resource_level === 'High' ? 'text-indigo-400' : 'text-purple-400'
                      }`}
                    >
                      {l.resource_level}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-white font-mono">{l.total_samples}</td>
                  <td className="py-3.5 px-6 text-emerald-400 font-mono font-medium">{l.positive}</td>
                  <td className="py-3.5 px-6 text-rose-400 font-mono font-medium">{l.negative}</td>
                  <td className="py-3.5 px-6 text-amber-400 font-mono font-medium">{l.neutral}</td>
                  <td className="py-3.5 px-6 font-bold text-slate-100 font-mono">
                    {(l.baseline_f1 * 100).toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-6 text-slate-400 font-mono text-right">{l.avg_char_length} chars</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Language-Specific Linguistic Challenges & Error Patterns */}
      <div className="glass-panel p-6 lg:p-8 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400" /> Identified Language-Specific Challenges & Failure Modes
        </h3>
        <p className="text-xs text-slate-400">
          Empirical observations from multilingual error analysis and ablation across Indic language families.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {data?.error_patterns.map((err, i) => (
            <div key={i} className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide block">
                {err.category}
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">{err.description}</p>
              <div className="pt-2 text-[11px] text-rose-400 font-medium border-t border-slate-800/80">
                Observed Impact: {err.impact}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
