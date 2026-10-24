import React, { useEffect, useState } from 'react';
import {
  Database,
  Upload,
  Plus,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ShieldCheck,
  Languages
} from 'lucide-react';
import ApiService from '../services/api';
import type { DatasetItem } from '../types';

export const DatasetExplorerPage: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [datasetName, setDatasetName] = useState('');
  const [source, setSource] = useState('Curated Research Corpus');
  const [licenseInfo, setLicenseInfo] = useState('CC-BY 4.0');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getDatasets();
      setDatasets(res);
    } catch (err) {
      console.error('Failed to load datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !datasetName) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataset_name', datasetName);
      formData.append('source', source);
      formData.append('license_info', licenseInfo);

      await ApiService.uploadDataset(formData);
      setIsModalOpen(false);
      setDatasetName('');
      setFile(null);
      await loadDatasets();
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold mb-2">
            <Database className="w-3.5 h-3.5" /> Data Pipeline Registry
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Multilingual Dataset Explorer</h2>
          <p className="text-slate-400 text-sm mt-1">
            Explore corpus partitions, linguistic distributions, licenses, and upload new datasets.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Upload New Dataset
        </button>
      </div>

      {/* Dataset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {datasets.map((ds) => (
          <div key={ds.dataset_id} className="glass-panel p-6 rounded-2xl glass-panel-hover flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-400" />
                    {ds.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Source: {ds.source}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {ds.sample_count} Samples
                </span>
              </div>

              {/* Status / Split info */}
              {ds.status && (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {ds.status}
                </div>
              )}

              {/* Language Coverage Chips */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-purple-400" /> Linguistic Coverage ({ds.language_coverage.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ds.language_coverage.map((code) => (
                    <span
                      key={code}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 font-mono text-[10px] font-bold"
                    >
                      {code.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer with License info */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> License: {ds.license_info}
              </span>
              <span className="font-mono text-[11px] text-slate-500">ID: {ds.dataset_id}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Dataset Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg p-6 lg:p-8 rounded-2xl border-indigo-500/30 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" /> Upload New Multilingual Dataset
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Dataset Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dravidian Social Reviews 2026"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Source / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Curated Multilingual Benchmark / Academic Corpus"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  License Information
                </label>
                <input
                  type="text"
                  value={licenseInfo}
                  onChange={(e) => setLicenseInfo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  CSV File *
                </label>
                <input
                  type="file"
                  accept=".csv,.tsv"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Must contain a 'text' column. Optional 'language' and 'sentiment' columns.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !file || !datasetName}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors"
                >
                  {uploading ? 'Validating & Uploading...' : 'Upload & Validate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
