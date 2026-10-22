import React from 'react';
import {
  BookOpen,
  Globe2,
  Cpu,
  Database,
  Terminal,
  ShieldAlert,
  Code2,
  CheckCircle2
} from 'lucide-react';

export const DocumentationPage: React.FC = () => {
  return (
    <div className="space-y-10 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
          <BookOpen className="w-3.5 h-3.5" /> Project Manual & System Architecture
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">System Documentation</h2>
        <p className="text-slate-400 text-sm mt-1">
          Complete engineering reference, linguistic specifications, model details, and API documentation.
        </p>
      </div>

      {/* 1. Research Overview */}
      <section className="glass-panel p-6 lg:p-8 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-indigo-400" /> 1. Project Objectives & Linguistic Scope
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          The <strong>Multilingual Sentiment Analysis for Indian Languages</strong> platform investigates the effectiveness
          of multilingual transformer architectures and subword n-gram baselines across 12 scheduled Indian languages,
          code-mixed Hinglish, and English.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <strong className="text-xs text-indigo-400 block mb-1">Indo-Aryan Family</strong>
            <p className="text-xs text-slate-400">Hindi, Bengali, Marathi, Gujarati, Punjabi, Odia, Assamese</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <strong className="text-xs text-purple-400 block mb-1">Dravidian Family</strong>
            <p className="text-xs text-slate-400">Tamil, Telugu, Malayalam, Kannada</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <strong className="text-xs text-pink-400 block mb-1">Contact & Code-Mixed</strong>
            <p className="text-xs text-slate-400">English, Romanized Hinglish (Code-Mixed), Tanglish</p>
          </div>
        </div>
      </section>

      {/* 2. Model Architectures */}
      <section className="glass-panel p-6 lg:p-8 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-400" /> 2. Evaluated Model Architectures
        </h3>
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-white">Model A: TF-IDF + Multinomial Logistic Regression</strong>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                Baseline (45k features)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Employs a union of word n-grams (1-2) and character n-grams (2-4). Subword char n-grams capture morpheme boundaries
              and inflections across agglutinative Indic scripts, offering sub-millisecond CPU latency (0.02 ms/sample).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-white">Model B: XLM-RoBERTa Multilingual Transformer</strong>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                Cross-Lingual RoBERTa Head
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Multi-head self-attention encoder with 256 hidden dimension and sequence classification projection head.
              Trained with class-weighted CrossEntropyLoss to resolve class imbalance across Positive, Negative, and Neutral.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-white">Model C: IndicBERT (AI4Bharat)</strong>
              <span className="text-xs px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 font-mono">
                Dedicated Indic Encoder Head
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dedicated Indic language transformer architecture optimized for Indian languages, achieving compact footprint
              (~18MB) and high tokenization fidelity on Dravidian and Indo-Aryan character clusters.
            </p>
          </div>
        </div>
      </section>

      {/* 3. API Usage Guide */}
      <section className="glass-panel p-6 lg:p-8 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Code2 className="w-5 h-5 text-emerald-400" /> 3. REST API Usage & Endpoints
        </h3>
        <p className="text-sm text-slate-300">
          The backend runs on FastAPI with full OpenAPI / Swagger support at <code className="text-indigo-400">http://127.0.0.1:8000/docs</code>.
        </p>

        <div className="space-y-4 pt-2">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase font-mono">POST /api/predict</span>
            <div className="mt-1.5 p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
              <pre>{`// Request Body:
{
  "text": "यह सेवा वास्तव में बहुत ही उपयोगी और शानदार है!",
  "language_override": "hi",
  "model_id": "tfidf_baseline"
}

// Response:
{
  "prediction_id": "c4b92a18",
  "detected_language": "hi",
  "language_name": "Hindi",
  "script": "Devanagari",
  "predicted_sentiment": "Positive",
  "confidence": 0.998,
  "probabilities": { "Positive": 0.998, "Negative": 0.001, "Neutral": 0.001 },
  "is_uncertain": false,
  "inference_time_ms": 0.03
}`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Local Deployment & Execution Guide */}
      <section className="glass-panel p-6 lg:p-8 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-amber-400" /> 4. Local Startup Commands
        </h3>
        <div className="space-y-3 pt-2 text-xs font-mono text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-slate-500 block mb-1"># Terminal 1: Start FastAPI Backend</span>
            <span className="text-indigo-300">python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-slate-500 block mb-1"># Terminal 2: Start React Frontend</span>
            <span className="text-emerald-300">cd frontend; npm run dev</span>
          </div>
        </div>
      </section>
    </div>
  );
};
