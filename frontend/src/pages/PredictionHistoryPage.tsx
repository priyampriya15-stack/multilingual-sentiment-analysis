import React, { useEffect, useState } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import ApiService from '../services/api';
import type { HistoryItem } from '../types';

export const PredictionHistoryPage: React.FC = () => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [selectedLang, setSelectedLang] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [currentPage, selectedLang, selectedSentiment, selectedModel]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getHistory({
        page: currentPage,
        page_size: pageSize,
        search: search || undefined,
        language: selectedLang || undefined,
        sentiment: selectedSentiment || undefined,
        model: selectedModel || undefined,
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadHistory();
  };

  const handleDelete = async (predictionId: string) => {
    if (!confirm('Are you sure you want to delete this prediction record?')) return;
    try {
      await ApiService.deleteHistoryItem(predictionId);
      await loadHistory();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleExportCsv = () => {
    if (items.length === 0) return;
    const headers = ['Prediction ID', 'Text', 'Language', 'Sentiment', 'Confidence', 'Model', 'Timestamp'];
    const rows = items.map((i) => [
      `"${i.prediction_id}"`,
      `"${i.text.replace(/"/g, '""')}"`,
      `"${i.detected_language}"`,
      `"${i.predicted_sentiment}"`,
      `"${(i.confidence * 100).toFixed(1)}%"`,
      `"${i.model_name}"`,
      `"${i.created_at}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `prediction_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5" /> Database Audit Trail
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Prediction History & Logs</h2>
          <p className="text-slate-400 text-sm mt-1">
            Searchable audit log of all live text sentiment predictions with full telemetry.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={items.length === 0}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-40"
        >
          <Download className="w-4 h-4 text-emerald-400" /> Export CSV Log
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by text content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <select
            value={selectedSentiment}
            onChange={(e) => {
              setSelectedSentiment(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
          >
            <option value="">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Negative">Negative</option>
            <option value="Neutral">Neutral</option>
          </select>

          <select
            value={selectedModel}
            onChange={(e) => {
              setSelectedModel(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
          >
            <option value="">All Models</option>
            <option value="tfidf_baseline">TF-IDF Baseline</option>
            <option value="xlm_roberta">XLM-RoBERTa</option>
            <option value="indicbert">IndicBERT</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setSelectedLang('');
              setSelectedSentiment('');
              setSelectedModel('');
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs text-slate-400 hover:text-white"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Text Snippet</th>
                <th className="py-3.5 px-6">Language</th>
                <th className="py-3.5 px-6">Model</th>
                <th className="py-3.5 px-6">Predicted Sentiment</th>
                <th className="py-3.5 px-6">Confidence</th>
                <th className="py-3.5 px-6">Inference Time</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
                    Loading prediction history...
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((i) => (
                  <tr key={i.prediction_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-slate-200 max-w-xs truncate">{i.text}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                        {i.detected_language.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-400">{i.model_name}</td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          i.predicted_sentiment === 'Positive'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : i.predicted_sentiment === 'Negative'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {i.predicted_sentiment}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-200">
                      {(i.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-400">
                      {i.inference_time_ms} ms
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleDelete(i.prediction_id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No predictions found matching the active criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Total: <strong>{total}</strong> predictions recorded
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-white font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
