import React, { useEffect, useState } from 'react';
import {
  GitCompare,
  Cpu,
  Clock,
  HardDrive,
  BarChart2,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import ApiService from '../services/api';
import type { ModelComparisonData, ModelComparisonItem } from '../types';

export const ModelComparisonPage: React.FC = () => {
  const [data, setData] = useState<ModelComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState<string>('tfidf_baseline');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getModelComparison();
      setData(res);
      if (res.models && res.models.length > 0) {
        setSelectedModelId(res.models[0].id);
      }
    } catch (err) {
      console.error('Failed to load model comparison:', err);
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

  const selectedModel = data?.models.find((m) => m.id === selectedModelId) || data?.models[0];

  // Chart data comparing accuracy and macro F1
  const chartData = (data?.models || []).map((m) => ({
    name: m.id === 'tfidf_baseline' ? 'TF-IDF' : m.id === 'xlm_roberta' ? 'XLM-R' : 'IndicBERT',
    Accuracy: Number((m.accuracy * 100).toFixed(1)),
    Macro_F1: Number((m.macro_f1 * 100).toFixed(1)),
    Latency_ms: Number(m.latency_ms.toFixed(1)),
  }));

  const classLabels = data?.classes || ['Positive', 'Negative', 'Neutral'];

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
          <GitCompare className="w-3.5 h-3.5" /> Empirical Benchmark
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Transformer vs Baseline Model Comparison</h2>
        <p className="text-slate-400 text-sm mt-1">
          Rigorous side-by-side evaluation across classification accuracy, macro F1, parameter efficiency, and runtime latency.
        </p>
      </div>

      {/* Dataset Attribution Alert */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          Evaluation Split:{' '}
          <strong className="text-slate-200">
            {data?.evaluation_dataset || 'Multilingual Sentiment Benchmark (Test Split)'}
          </strong>
        </span>
        <span className="text-emerald-400 font-medium">Standardized Leakage-Free Test Set</span>
      </div>

      {/* Model Benchmark Comparison Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Multilingual Benchmark Matrix</h3>
          <p className="text-xs text-slate-400 mt-0.5">Strictly evaluated on unseen held-out test splits</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Model Architecture</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Accuracy</th>
                <th className="py-4 px-6">Macro F1</th>
                <th className="py-4 px-6">Weighted F1</th>
                <th className="py-4 px-6">Latency</th>
                <th className="py-4 px-6">Train Time</th>
                <th className="py-4 px-6 text-right">Size / Parameters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {data?.models.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setSelectedModelId(m.id)}
                  className={`cursor-pointer transition-colors ${
                    selectedModelId === m.id ? 'bg-indigo-950/40 border-l-4 border-indigo-500' : 'hover:bg-slate-800/30'
                  }`}
                >
                  <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    {m.name}
                  </td>
                  <td className="py-4 px-6 text-slate-400">{m.type}</td>
                  <td className="py-4 px-6 font-bold text-emerald-400 font-mono text-sm">
                    {(m.accuracy * 100).toFixed(1)}%
                  </td>
                  <td className="py-4 px-6 font-bold text-indigo-400 font-mono text-sm">
                    {(m.macro_f1 * 100).toFixed(1)}%
                  </td>
                  <td className="py-4 px-6 font-mono text-slate-300">
                    {(m.weighted_f1 * 100).toFixed(1)}%
                  </td>
                  <td className="py-4 px-6 font-mono text-slate-300">
                    {m.latency_ms.toFixed(2)} ms
                  </td>
                  <td className="py-4 px-6 font-mono text-slate-400">
                    {m.training_time_sec} s
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-slate-400">
                    {m.parameters} ({m.model_size_mb} MB)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Detail & Confusion Matrix Viewer */}
      {selectedModel && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Confusion Matrix Card */}
          <div className="glass-panel p-6 lg:p-8 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Confusion Matrix (3x3)</h3>
                <p className="text-xs text-slate-400">Model: {selectedModel.name}</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                Actual vs Predicted
              </span>
            </div>

            <div className="pt-4 flex flex-col items-center">
              <div className="grid grid-cols-4 gap-2 text-center text-xs w-full max-w-sm">
                <div />
                {classLabels.map((c) => (
                  <div key={c} className="font-bold text-slate-400 uppercase text-[10px] pb-1">
                    Pred {c.slice(0, 3)}
                  </div>
                ))}

                {classLabels.map((actual, rowIdx) => (
                  <React.Fragment key={actual}>
                    <div className="font-bold text-slate-400 uppercase text-[10px] flex items-center justify-end pr-2">
                      True {actual.slice(0, 3)}
                    </div>
                    {classLabels.map((_, colIdx) => {
                      const count = selectedModel.confusion_matrix?.[rowIdx]?.[colIdx] || 0;
                      const isDiagonal = rowIdx === colIdx;
                      return (
                        <div
                          key={colIdx}
                          className={`h-16 rounded-xl flex flex-col items-center justify-center font-mono font-bold text-sm ${
                            isDiagonal
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-inner'
                              : count > 0
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-900/60 text-slate-600 border border-slate-800'
                          }`}
                        >
                          <span>{count}</span>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 text-center pt-2">
              Green diagonal blocks represent true positive matches. Off-diagonal blocks indicate error confusion.
            </p>
          </div>

          {/* Per-Class Precision, Recall, and F1 */}
          <div className="glass-panel p-6 lg:p-8 rounded-2xl space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Class-Specific Performance Breakdown</h3>
              <p className="text-xs text-slate-400">Precision, Recall, and F1 for {selectedModel.name}</p>

              <div className="mt-6 space-y-4">
                {selectedModel.per_class &&
                  Object.entries(selectedModel.per_class).map(([cls, m]) => (
                    <div key={cls} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>{cls} Class</span>
                        <span className="font-mono text-slate-400">Support: {m.support} samples</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                        <div className="p-2 rounded bg-slate-800/60">
                          <span className="text-[10px] text-slate-400 uppercase block">Precision</span>
                          <span className="font-mono font-bold text-slate-200">{(m.precision * 100).toFixed(1)}%</span>
                        </div>
                        <div className="p-2 rounded bg-slate-800/60">
                          <span className="text-[10px] text-slate-400 uppercase block">Recall</span>
                          <span className="font-mono font-bold text-slate-200">{(m.recall * 100).toFixed(1)}%</span>
                        </div>
                        <div className="p-2 rounded bg-slate-800/60">
                          <span className="text-[10px] text-slate-400 uppercase block">F1-Score</span>
                          <span className="font-mono font-bold text-indigo-400">{(m.f1_score * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
