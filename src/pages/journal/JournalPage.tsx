import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reflectionService } from '../../services/reflectionService';
import { ReflectionEntry } from '../../types';
import {
  BookMarked,
  Save,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Award,
  CheckCircle2,
  BrainCircuit
} from 'lucide-react';

export const JournalPage: React.FC = () => {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<ReflectionEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadReflections = async () => {
      if (!user) return;
      try {
        const items = await reflectionService.getUserReflections(user.id);
        setReflections(items);
        if (items.length > 0) setActiveEntry(items[0]);
      } catch (e) {
        console.error('Failed to load reflections:', e);
      }
    };
    loadReflections();
  }, [user]);

  const handleSave = async () => {
    if (!activeEntry) return;
    setIsSaving(true);
    try {
      const saved = await reflectionService.saveReflection(activeEntry);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);

      // Update in list
      const idx = reflections.findIndex((r) => r.id === saved.id);
      if (idx >= 0) {
        const updated = [...reflections];
        updated[idx] = saved;
        setReflections(updated);
      } else {
        setReflections([saved, ...reflections]);
      }
    } catch (e) {
      console.error('Failed to save reflection:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNew = () => {
    if (!user) return;
    const newEntry: ReflectionEntry = {
      id: `ref_${Date.now()}`,
      userId: user.id,
      title: `Daily Reflection - ${new Date().toLocaleDateString()}`,
      category: 'DAILY_JOURNAL',
      content: 'Write your thoughts, daily preparation review, self-corrections, and mindset observations here...',
      tags: ['reflection', 'mindset'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveEntry(newEntry);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    await reflectionService.deleteReflection(id);
    const remaining = reflections.filter((r) => r.id !== id);
    setReflections(remaining);
    setActiveEntry(remaining.length > 0 ? remaining[0] : null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold tracking-wider uppercase mb-1">
          <BookMarked className="w-4 h-4" />
          <span>Stage II • Psychology & Introspection</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Self-Description Test (SDT) & Reflection Journal
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl mt-1.5 leading-relaxed">
          The Self-Description Test reveals conscious self-awareness, personal authenticity, and congruence with your unconscious projections in TAT and SRT. Refine your master SDT and log daily thoughts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Entries List */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <h3 className="font-bold text-white text-sm">Your Entries</h3>
            <button
              onClick={handleCreateNew}
              className="p-1.5 rounded-lg bg-military-600 hover:bg-military-500 text-white text-xs font-semibold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Entry</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {reflections.map((r) => {
              const isSelected = activeEntry?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setActiveEntry(r)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-military-800/90 border-amber-400 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-mono uppercase font-semibold text-amber-400">{r.category}</span>
                    <span>{new Date(r.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="font-bold text-xs truncate">{r.title}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Entry Editor (2 Cols on lg) */}
        <div className="lg:col-span-2 bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
          {activeEntry ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <input
                  type="text"
                  value={activeEntry.title}
                  onChange={(e) => setActiveEntry({ ...activeEntry, title: e.target.value })}
                  className="bg-transparent text-lg font-bold text-white focus:outline-hidden w-full mr-4"
                />

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleDelete(activeEntry.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-military-600 hover:bg-military-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saveSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save Entry'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <textarea
                  value={activeEntry.content}
                  onChange={(e) => setActiveEntry({ ...activeEntry, content: e.target.value })}
                  rows={16}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden leading-relaxed font-mono"
                />
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-700">
                <span>Markdown supported (### Headers, * Bullet points)</span>
                <span>Last updated: {new Date(activeEntry.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <p>Select an entry on the left or create a new journal entry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
