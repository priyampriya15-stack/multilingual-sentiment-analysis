import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Layers,
  BarChart3,
  GitCompare,
  Database,
  FlaskConical,
  History,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  Globe2,
  Cpu,
  UserCircle
} from 'lucide-react';
import ApiService from '../services/api';

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Sentiment Analyzer', href: '/analyzer', icon: Sparkles },
  { name: 'Batch Analysis', href: '/batch', icon: Layers },
  { name: 'Language Analytics', href: '/languages', icon: BarChart3 },
  { name: 'Model Comparison', href: '/models', icon: GitCompare },
  { name: 'Dataset Explorer', href: '/datasets', icon: Database },
  { name: 'Research Lab', href: '/research', icon: FlaskConical },
  { name: 'Prediction History', href: '/history', icon: History },
  { name: 'Documentation', href: '/docs', icon: BookOpen },
];

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backendHealth, setBackendHealth] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [defaultModel, setDefaultModel] = useState<string>('tfidf_baseline');
  const location = useLocation();

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const data = await ApiService.getHealth();
      if (data.status === 'ok') {
        setBackendHealth('connected');
        if (data.default_model) setDefaultModel(data.default_model);
      } else {
        setBackendHealth('disconnected');
      }
    } catch {
      setBackendHealth('disconnected');
    }
  };

  return (
    <div className="min-h-screen flex bg-[#090d16] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0e1424] border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Globe2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                IndicSentiment
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v1.0
                </span>
              </h1>
              <p className="text-xs text-slate-400">Multilingual NLP Research</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white lg:hidden hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* System Status Footer */}
        <div className="p-4 m-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Backend Engine
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                backendHealth === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : backendHealth === 'checking'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  backendHealth === 'connected'
                    ? 'bg-emerald-400 animate-pulse'
                    : backendHealth === 'checking'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
              />
              {backendHealth === 'connected' ? 'FastAPI 8000' : backendHealth === 'checking' ? 'Connecting...' : 'Offline'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Active Model: {defaultModel}</p>
        </div>

        {/* Researcher Profile in Sidebar */}
        <div className="px-4 pb-4">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 text-xs font-bold">
                A
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">Dr. Ananya Sharma</p>
                <p className="text-[10px] text-slate-400 truncate">researcher@medai.org</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 px-6 lg:px-8 border-b border-slate-800/80 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white lg:hidden hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                12 Indian Languages + Hinglish
              </span>
              <span className="hidden sm:inline text-xs text-slate-400">
                Transformer vs Subword N-Gram Benchmark
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Production Pipeline</span>
            </div>
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/20 transition-colors"
            >
              Swagger Docs
            </a>

            {/* Researcher Profile */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-800">
              <div className="hidden lg:flex items-center gap-2 text-right">
                <div className="p-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <UserCircle className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-200 leading-none">
                    Dr. Ananya Sharma
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    researcher@medai.org
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
