import React, { useState, useEffect } from 'react';
import { X, Key, Cpu, CheckCircle2, AlertTriangle, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { getAIConfig, saveAIConfig, getActiveProvider } from '../../services/aiService';
import { AIProvider, AIConfig } from '../../types/ai';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<AIConfig>({ provider: 'heuristic' });
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeProvider, setActiveProvider] = useState<AIProvider>('heuristic');

  useEffect(() => {
    if (isOpen) {
      setConfig(getAIConfig());
      setActiveProvider(getActiveProvider());
    }
  }, [isOpen]);

  const handleSave = () => {
    saveAIConfig(config);
    setActiveProvider(getActiveProvider());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearKeys = () => {
    const cleared: AIConfig = { provider: 'heuristic' };
    setConfig(cleared);
    saveAIConfig(cleared);
    setActiveProvider('heuristic');
  };

  if (!isOpen) return null;

  const providerBadge: Record<AIProvider, { label: string; color: string }> = {
    gemini: { label: '✦ Gemini AI Active', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    openai: { label: '◆ OpenAI Active', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    heuristic: { label: '⚡ Smart Heuristic Mode', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  };

  const badge = providerBadge[activeProvider];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Engine Settings</h2>
              <p className="text-xs text-slate-400">Configure your AI provider for evaluations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Active Provider Badge */}
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-xs font-semibold ${badge.color}`}>
            <span>{badge.label}</span>
          </div>

          {/* How it works */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-xs text-slate-300 space-y-2">
            <div className="font-semibold text-white flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>How AI Evaluation Works</span>
            </div>
            <ul className="space-y-1 text-slate-400">
              <li>🔑 <strong className="text-slate-300">With API key:</strong> Real AI evaluation using Gemini or OpenAI</li>
              <li>⚡ <strong className="text-slate-300">Without key:</strong> Smart heuristic evaluation (SSB rule-based, always works)</li>
              <li>🔒 <strong className="text-slate-300">Privacy:</strong> API keys stored locally in your browser only</li>
            </ul>
          </div>

          {/* Gemini API Key */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Google Gemini API Key</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline flex items-center space-x-1"
              >
                <span>Get free key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <div className="relative">
              <input
                type={showGeminiKey ? 'text' : 'password'}
                value={config.geminiApiKey || ''}
                onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Recommended: Gemini 2.0 Flash — fast and generous free tier. Used for all AI evaluations.
            </p>
          </div>

          {/* OpenAI API Key */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>OpenAI API Key (Alternative)</span>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <span>Get key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <div className="relative">
              <input
                type={showOpenAIKey ? 'text' : 'password'}
                value={config.openaiApiKey || ''}
                onChange={(e) => setConfig({ ...config, openaiApiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                {showOpenAIKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">Uses GPT-4o-mini. Requires a paid OpenAI account.</p>
          </div>

          {/* Important disclaimer */}
          <div className="flex items-start space-x-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80">
              Your API key is stored only in your browser's local storage and is never transmitted to our servers. API usage costs are charged directly to your account by the provider.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-slate-800">
          <button
            onClick={handleClearKeys}
            className="px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 rounded-lg transition-colors"
          >
            Clear Keys
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center space-x-2 transition-all ${
                saved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
