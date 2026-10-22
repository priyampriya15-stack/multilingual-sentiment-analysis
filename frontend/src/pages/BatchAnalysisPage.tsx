import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import ApiService from '../services/api';
import type { PredictResponse } from '../types';

const COLORS = {
  Positive: '#10b981',
  Negative: '#f43f5e',
  Neutral: '#f59e0b',
};

export const BatchAnalysisPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [textColumn, setTextColumn] = useState<string>('text');
  const [langColumn, setLangColumn] = useState<string>('language');
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('tfidf_baseline');

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<PredictResponse[]>([]);
  const [avgTime, setAvgTime] = useState<number>(0);

  // Filters
  const [filterSentiment, setFilterSentiment] = useState<string>('All');
  const [filterLang, setFilterLang] = useState<string>('All');
  const [minConfidence, setMinConfidence] = useState<number>(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length > 0) {
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
        setAvailableColumns(headers);

        const rows = lines.slice(1).map((line) => {
          const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
          const rowObj: Record<string, string> = {};
          headers.forEach((h, i) => {
            rowObj[h] = values[i] || '';
          });
          return rowObj;
        });
        setParsedRows(rows);

        // Auto-detect matching headers
        if (headers.includes('text')) setTextColumn('text');
        else if (headers.includes('sentence')) setTextColumn('sentence');
        else if (headers.length > 0) setTextColumn(headers[0]);

        if (headers.includes('language')) setLangColumn('language');
        else if (headers.includes('lang')) setLangColumn('lang');
      }
    };
    reader.readAsText(uploadedFile);
  };

  const handleDownloadSample = () => {
    const sampleCsv = `text,language\n"This service was absolutely fantastic and helpful!","en"\n"यह सेवा वास्तव में अद्भुत और बहुत ही उपयोगी है","hi"\n"இந்த திரைப்படம் மிகவும் அருமையாக உள்ளது","ta"\n"Movie sach mein bohot mast thi yaar!","hi-en"\n"చాలా చెత్త సేవ, అసలు నా సమస్యను పరిష్కరించలేదు","te"\n"খুবই জঘন্য খাবার এবং চরম অব্যবস্থা","bn"`;
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_indic_sentiment.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRunBatch = async () => {
    if (parsedRows.length === 0 || !textColumn) return;

    setLoading(true);
    setProgress(10);

    const items = parsedRows.map((r, i) => ({
      id: String(i),
      text: r[textColumn] || '',
      language: langColumn && r[langColumn] ? r[langColumn] : undefined,
    })).filter((item) => item.text.trim().length > 0);

    try {
      setProgress(40);
      const res = await ApiService.predictBatch(items, selectedModel);
      setProgress(100);
      setResults(res.results);
      setAvgTime(res.avg_inference_time_ms);
    } catch (err: any) {
      console.error('Batch failed:', err);
      alert('Batch classification failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleExportResults = () => {
    if (results.length === 0) return;
    const headers = ['Prediction ID', 'Original Text', 'Detected Language', 'Sentiment', 'Confidence', 'Inference Time (ms)'];
    const rows = results.map((r) => [
      `"${r.prediction_id}"`,
      `"${r.text.replace(/"/g, '""')}"`,
      `"${r.detected_language}"`,
      `"${r.predicted_sentiment}"`,
      `"${(r.confidence * 100).toFixed(1)}%"`,
      `"${r.inference_time_ms}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analyzed_sentiment_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Results
  const filteredResults = results.filter((r) => {
    if (filterSentiment !== 'All' && r.predicted_sentiment !== filterSentiment) return false;
    if (filterLang !== 'All' && r.detected_language !== filterLang) return false;
    if (r.confidence < minConfidence) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredResults.length / pageSize) || 1;
  const paginatedRows = filteredResults.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Sentiment chart data
  const sentimentCounts: Record<string, number> = {};
  results.forEach((r) => {
    sentimentCounts[r.predicted_sentiment] = (sentimentCounts[r.predicted_sentiment] || 0) + 1;
  });
  const chartData = Object.entries(sentimentCounts).map(([name, value]) => ({
    name,
    value,
    color: COLORS[name as keyof typeof COLORS] || '#6366f1',
  }));

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" /> Bulk Inference Pipeline
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Batch CSV Sentiment Analysis</h2>
          <p className="text-slate-400 text-sm mt-1">
            Upload large CSV datasets for batch classification across Indian languages with full export support.
          </p>
        </div>

        <button
          onClick={handleDownloadSample}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Download Sample CSV
        </button>
      </div>

      {/* Upload & Configuration Card */}
      <div className="glass-panel rounded-2xl p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-900/50 transition-colors">
            <Upload className="w-8 h-8 text-indigo-400 mb-2" />
            <p className="text-sm font-semibold text-slate-200">
              {file ? file.name : 'Select or drag & drop CSV file'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports CSV files up to 25MB with Indic text
            </p>
            <label className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-colors">
              Browse File
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Column Mapping & Model Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Classification Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="tfidf_baseline">TF-IDF + Logistic Regression (Sub-millisecond)</option>
                <option value="xlm_roberta">XLM-RoBERTa Multilingual Transformer</option>
                <option value="indicbert">IndicBERT (Dedicated Indic Architecture)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Text Column *
                </label>
                <select
                  value={textColumn}
                  onChange={(e) => setTextColumn(e.target.value)}
                  disabled={availableColumns.length === 0}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  {availableColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Language Column (Optional)
                </label>
                <select
                  value={langColumn}
                  onChange={(e) => setLangColumn(e.target.value)}
                  disabled={availableColumns.length === 0}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value="">Auto-Detect</option>
                  {availableColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleRunBatch}
                disabled={loading || parsedRows.length === 0}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing {parsedRows.length} Rows...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Start Batch Inference ({parsedRows.length} Samples)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {loading && (
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary KPIs & Chart */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl md:col-span-1 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Batch Summary</span>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total Classified:</span>
                    <strong className="text-white font-mono">{results.length}</strong>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Avg Latency:</span>
                    <strong className="text-emerald-400 font-mono">{avgTime} ms/row</strong>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Languages Detected:</span>
                    <strong className="text-purple-400 font-mono">
                      {new Set(results.map((r) => r.detected_language)).size}
                    </strong>
                  </div>
                </div>
              </div>

              <button
                onClick={handleExportResults}
                className="mt-6 w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
              >
                <Download className="w-4 h-4" /> Export Analyzed CSV
              </button>
            </div>

            <div className="glass-panel p-6 rounded-2xl md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="h-44 w-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value">
                      {chartData.map((e, i) => (
                        <Cell key={`cell-${i}`} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-3 w-full">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Sentiment Distribution
                </span>
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-bold text-white font-mono">
                      {item.value} ({((item.value / results.length) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Filters Bar */}
          <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Filter className="w-4 h-4 text-indigo-400" /> Filter Results:
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <select
                value={filterSentiment}
                onChange={(e) => {
                  setFilterSentiment(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200"
              >
                <option value="All">All Sentiments</option>
                <option value="Positive">Positive</option>
                <option value="Negative">Negative</option>
                <option value="Neutral">Neutral</option>
              </select>

              <select
                value={filterLang}
                onChange={(e) => {
                  setFilterLang(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200"
              >
                <option value="All">All Languages</option>
                {Array.from(new Set(results.map((r) => r.detected_language))).map((l) => (
                  <option key={l} value={l}>
                    {l.toUpperCase()}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2 text-slate-400">
                <span>Min Conf:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={minConfidence}
                  onChange={(e) => {
                    setMinConfidence(parseFloat(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-20 accent-indigo-500"
                />
                <span className="font-mono text-white text-xs font-bold">{(minConfidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-6">Original Text</th>
                    <th className="py-3.5 px-6">Detected Language</th>
                    <th className="py-3.5 px-6">Sentiment</th>
                    <th className="py-3.5 px-6">Confidence</th>
                    <th className="py-3.5 px-6 text-right">Inference (ms)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {paginatedRows.map((r) => (
                    <tr key={r.prediction_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-slate-200 max-w-sm truncate">{r.text}</td>
                      <td className="py-3.5 px-6 font-mono text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                          {r.detected_language.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            r.predicted_sentiment === 'Positive'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : r.predicted_sentiment === 'Negative'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {r.predicted_sentiment}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-slate-200">
                        {(r.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-400 text-right">
                        {r.inference_time_ms} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredResults.length)} of {filteredResults.length} entries
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
      )}
    </div>
  );
};
