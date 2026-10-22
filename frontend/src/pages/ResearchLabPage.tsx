import React, { useEffect, useState } from 'react';
import {
  FlaskConical,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingDown,
  Globe2
} from 'lucide-react';
import ApiService from '../services/api';
import type { ExperimentItem } from '../types';

const EXPERIMENT_TYPES = [
  {
    id: 'model_comparison',
    name: 'Model Comparison on Test Split',
    description: 'Compare TF-IDF Baseline, XLM-RoBERTa, and IndicBERT on identical held-out test data.',
  },
  {
    id: 'cross_language',
    name: 'Cross-Language Zero-Shot Transfer',
    description: 'Evaluate generalization from Indo-Aryan languages (Hindi, Bengali) to Dravidian (Tamil, Telugu, Malayalam, Kannada).',
  },
  {
    id: 'codemixed',
    name: 'Code-Mixed vs Native Indic Scripts',
    description: 'Isolate and evaluate Romanized code-mixed Hinglish performance compared against native Indic scripts.',
  },
  {
    id: 'low_resource',
    name: 'Low-Resource Data Volume Scaling',
    description: 'Empirical measurement of F1 decay across 10%, 25%, 50%, and 100% training set fractions.',
  },
  {
    id: 'error_analysis',
    name: 'Multilingual Error Analysis',
    description: 'Systematic taxonomy of misclassifications, negation ambiguities, and orthographic confusion.',
  },
];

export const ResearchLabPage: React.FC = () => {
  const [experiments, setExperiments] = useState<ExperimentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [expName, setExpName] = useState('Cross-Lingual Generalization Test');
  const [expType, setExpType] = useState('cross_language');
  const [selectedModel, setSelectedModel] = useState('xlm_roberta');
  const [running, setRunning] = useState(false);
  const [activeReport, setActiveReport] = useState<ExperimentItem | null>(null);

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getExperiments();
      setExperiments(res);
      if (res.length > 0 && !activeReport) {
        setActiveReport(res[0]);
      }
    } catch (err) {
      console.error('Failed to load experiments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRunning(true);
      const res = await ApiService.runExperiment({
        name: expName,
        experiment_type: expType,
        model_id: selectedModel,
        parameters: {
          test_split_size: 286,
          batch_size: 32,
        },
      });
      await loadExperiments();
      setActiveReport(res);
    } catch (err: any) {
      console.error('Experiment failed:', err);
      alert('Experiment execution failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setRunning(false);
    }
  };

  const handleDownloadReport = (exp: ExperimentItem) => {
    const jsonStr = JSON.stringify(exp, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `experiment_${exp.experiment_id}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
          <FlaskConical className="w-3.5 h-3.5" /> Research Experiments
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">NLP Research Experiment Lab</h2>
        <p className="text-slate-400 text-sm mt-1">
          Execute controlled empirical evaluations for cross-lingual transfer, code-mixing, low-resource scaling, and error taxonomy.
        </p>
      </div>

      {/* Experiment Runner Card */}
      <div className="glass-panel rounded-2xl p-6 lg:p-8 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" /> Configure & Launch New Experiment
        </h3>

        <form onSubmit={handleLaunchExperiment} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Experiment Title
              </label>
              <input
                type="text"
                required
                value={expName}
                onChange={(e) => setExpName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Research Protocol
              </label>
              <select
                value={expType}
                onChange={(e) => {
                  setExpType(e.target.value);
                  const selected = EXPERIMENT_TYPES.find((x) => x.id === e.target.value);
                  if (selected) setExpName(selected.name);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {EXPERIMENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Evaluation Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="xlm_roberta">XLM-RoBERTa Multilingual</option>
                <option value="indicbert">IndicBERT (AI4Bharat)</option>
                <option value="tfidf_baseline">TF-IDF + Logistic Regression</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
            <Globe2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block mb-0.5">Protocol Details</strong>
              <span>
                {EXPERIMENT_TYPES.find((t) => t.id === expType)?.description}
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={running}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              {running ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running Experiment Pipeline...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Run Experiment
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Past Experiments & Active Report Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Experiment History List */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-1 space-y-4">
          <h3 className="text-base font-bold text-white">Experiment Registry</h3>
          <p className="text-xs text-slate-400">Select an experiment to view empirical metrics</p>

          <div className="space-y-2 mt-4 max-h-[460px] overflow-y-auto pr-1">
            {experiments.map((exp) => (
              <div
                key={exp.experiment_id}
                onClick={() => setActiveReport(exp)}
                className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                  activeReport?.experiment_id === exp.experiment_id
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white truncate max-w-[170px]">{exp.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      exp.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : exp.status === 'Running'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {exp.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Model: {exp.model_id}</span>
                  <span className="font-mono text-[10px] text-slate-500">{exp.start_time?.slice(0, 10)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Experiment Metrics & Findings Viewer */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 space-y-6">
          {activeReport ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider block">
                    Experiment ID: {activeReport.experiment_id}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">{activeReport.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">{activeReport.research_question}</p>
                </div>

                <button
                  onClick={() => handleDownloadReport(activeReport)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <FileDown className="w-4 h-4 text-indigo-400" /> Export JSON Report
                </button>
              </div>

              {/* Status and Configuration Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Status</span>
                  <strong className="text-emerald-400">{activeReport.status}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Model</span>
                  <strong className="text-slate-200">{activeReport.model_id}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Started</span>
                  <span className="text-slate-400 font-mono text-[11px]">{activeReport.start_time?.slice(11, 19)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Finished</span>
                  <span className="text-slate-400 font-mono text-[11px]">{activeReport.completion_time?.slice(11, 19) || 'N/A'}</span>
                </div>
              </div>

              {/* Metrics Output Display */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Empirical Findings & Metrics Payload
                </span>
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-80">
                  <pre>{JSON.stringify(activeReport.metrics || {}, null, 2)}</pre>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-xs">
              <FlaskConical className="w-8 h-8 text-slate-600 mb-2" />
              Select an experiment from the registry to view detailed metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
