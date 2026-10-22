import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Cpu,
  Globe2,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import ApiService from '../services/api';
import type { PredictResponse, LanguageItem, ModelInfo } from '../types';

export const AnalyzerPage: React.FC = () => {
  const [text, setText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('tfidf_baseline');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const [langsRes, modelsRes] = await Promise.all([
        ApiService.getLanguages(),
        ApiService.getModels(),
      ]);
      setLanguages(langsRes.supported_languages || []);
      setModels(modelsRes.models || []);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    try {
      setLoading(true);
      const res = await ApiService.predictSentiment(
        text,
        selectedLanguage || undefined,
        selectedModel || undefined
      );
      setResult(res);
    } catch (err: any) {
      console.error('Prediction failed:', err);
      alert(err.response?.data?.detail || 'Prediction failed. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const summary = `Text: ${result.text}\nLanguage: ${result.language_name} (${result.detected_language})\nSentiment: ${result.predicted_sentiment} (${(result.confidence * 100).toFixed(1)}%)\nModel: ${result.selected_model}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setSampleText = (sampleText: string, langCode: string) => {
    setText(sampleText);
    setSelectedLanguage(langCode);
    setResult(null);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Real-Time Multilingual Inference
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Interactive Sentiment Analyzer</h2>
        <p className="text-slate-400 text-sm mt-1">
          Enter text in any of the 12 Indian languages or code-mixed Hinglish. The system identifies script, normalizes morphology, and classifies polarity.
        </p>
      </div>

      {/* Main Analyzer Card */}
      <div className="glass-panel rounded-2xl p-6 lg:p-8 space-y-6">
        {/* Controls Bar: Model & Language selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Active Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="tfidf_baseline">TF-IDF + Logistic Regression (Fast Baseline)</option>
              <option value="xlm_roberta">XLM-RoBERTa Multilingual Transformer</option>
              <option value="indicbert">IndicBERT (Dedicated Indic Transformer)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-purple-400" /> Language Override (Optional)
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="">Auto-Detect Script & Language</option>
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name} ({l.native_name}) - {l.script}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Text Input Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Input Text</span>
            <span className="text-xs text-slate-500">{text.length}/2000 characters</span>
          </div>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste text in Hindi, Tamil, Telugu, Bengali, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Odia, Assamese, English, or Hinglish..."
              rows={4}
              maxLength={2000}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 text-slate-100 placeholder:text-slate-500 text-sm leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-y"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={() => {
              setText('');
              setResult(null);
            }}
            disabled={!text && !result}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Input
          </button>

          <button
            onClick={handleAnalyze}
            disabled={loading || !text.trim()}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing Multilingual Text...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Analyze Sentiment
              </>
            )}
          </button>
        </div>

        {/* Quick Sample Selector Pill Carousel */}
        <div className="pt-4 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Quick Representative Test Samples
          </p>
          <div className="flex flex-wrap gap-2">
            {languages.slice(0, 13).map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSampleText(lang.samples.positive, lang.code)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 transition-all flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prediction Result Display Card */}
      {result && (
        <div className="glass-panel rounded-2xl p-6 lg:p-8 space-y-6 border-indigo-500/30 shadow-2xl animate-fade-in">
          {/* Result Header & Polarity Pill */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Classification Outcome</span>
              <div className="flex items-center gap-3 mt-1.5">
                <span
                  className={`text-2xl font-black px-4 py-1 rounded-xl uppercase tracking-wider ${
                    result.predicted_sentiment === 'Positive'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : result.predicted_sentiment === 'Negative'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {result.predicted_sentiment}
                </span>
                <span className="text-slate-400 text-sm">
                  Confidence: <strong className="text-white">{(result.confidence * 100).toFixed(1)}%</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Result'}
              </button>
            </div>
          </div>

          {/* Epistemic Uncertainty Warning (if confidence is low or script is ambiguous) */}
          {result.is_uncertain && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-amber-300 block mb-0.5">Confidence Uncertainty Warning</strong>
                <span>{result.uncertainty_reason}</span>
                <p className="mt-1 text-[11px] text-amber-300/80">
                  Note: Softmax confidence measures decision-boundary distance, not a calibrated mathematical probability of correctness.
                </p>
              </div>
            </div>
          )}

          {/* Metadata Badges: Language, Script, Model, Latency */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div>
              <span className="text-[11px] font-medium text-slate-400">Identified Language</span>
              <p className="text-sm font-bold text-white mt-0.5">{result.language_name} ({result.detected_language})</p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400">Writing Script</span>
              <p className="text-sm font-bold text-slate-200 mt-0.5">{result.script}</p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400">Model Used</span>
              <p className="text-sm font-bold text-slate-200 mt-0.5 truncate">{result.selected_model}</p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400">Inference Latency</span>
              <p className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" /> {result.inference_time_ms} ms
              </p>
            </div>
          </div>

          {/* Class Probability Distribution Bars */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Class Probability Breakdown
            </span>

            {Object.entries(result.probabilities).map(([cls, prob]) => {
              const pct = (prob * 100).toFixed(1);
              const color =
                cls === 'Positive' ? 'bg-emerald-500' : cls === 'Negative' ? 'bg-rose-500' : 'bg-amber-500';

              return (
                <div key={cls} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">{cls}</span>
                    <span className="font-mono text-slate-200 font-bold">{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
