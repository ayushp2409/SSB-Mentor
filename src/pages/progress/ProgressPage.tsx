import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attemptService } from '../../services/attemptService';
import { reflectionService } from '../../services/reflectionService';
import { TestAttempt, RevisionItem } from '../../types';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Bookmark,
  Calendar,
  Eye,
  X,
  Target,
  Sparkles
} from 'lucide-react';

export const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<TestAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      if (!user) return;
      try {
        const atts = await attemptService.getUserAttempts(user.id);
        setAttempts(atts);

        const revs = await reflectionService.getUserRevisionItems(user.id);
        setRevisions(revs);
      } catch (e) {
        console.error('Failed to load progress data:', e);
      } finally {
        setLoading(false);
      }
    };
    loadProgress();
  }, [user]);

  const totalAttempts = attempts.length;
  const completedAttempts = attempts.filter((a) => a.status === 'completed').length;
  const totalDurationMins = Math.round(
    attempts.reduce((acc, a) => acc + (a.durationSeconds || 0), 0) / 60
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold tracking-wider uppercase mb-1">
          <TrendingUp className="w-4 h-4" />
          <span>Cadet Growth & Consistency Tracker</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Progress & Test Attempt History
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl mt-1.5 leading-relaxed">
          True preparation for the Services Selection Board is built on daily consistency, honest introspection, and refining response speed. Review your completed simulations and manage bookmarked revision items.
        </p>
      </div>

      {/* Cumulative Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-2xl shadow-xl space-y-1">
          <div className="text-xs text-slate-400 font-medium">Total Test Sessions</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalAttempts}</div>
          <div className="text-[11px] text-emerald-400 font-medium">{completedAttempts} completed</div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-2xl shadow-xl space-y-1">
          <div className="text-xs text-slate-400 font-medium">Practice Time</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">{totalDurationMins}m</div>
          <div className="text-[11px] text-slate-400 font-medium">Logged in simulations</div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-2xl shadow-xl space-y-1">
          <div className="text-xs text-slate-400 font-medium">Revision Queue</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-400">{revisions.length}</div>
          <div className="text-[11px] text-slate-400 font-medium">Bookmarked items</div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-2xl shadow-xl space-y-1">
          <div className="text-xs text-slate-400 font-medium">Target Board</div>
          <div className="text-lg sm:text-xl font-bold text-white truncate">{user?.preferredBoard || '1 AFSB Dehradun'}</div>
          <div className="text-[11px] text-amber-400 font-medium">{user?.targetEntry || 'CDS'}</div>
        </div>
      </div>

      {/* Main Attempt History List */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Detailed Attempt Records</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">{attempts.length} Total Sessions</span>
        </div>

        {attempts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Target className="w-10 h-10 mx-auto text-slate-600" />
            <p>No tests attempted yet. Launch any Psychology or GTO simulator to begin tracking.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/60">
            {attempts.map((att) => (
              <div
                key={att.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-slate-800/40 px-2 rounded-xl"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-military-800 text-amber-400 font-semibold uppercase">
                      {att.module}
                    </span>
                    <span className="text-sm font-bold text-white">{att.profileId}</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(att.startedAt).toLocaleDateString()} at{' '}
                      {new Date(att.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Answered: <strong className="text-emerald-400">{att.completedCount}</strong> / {att.totalItems} | Duration: {Math.round(att.durationSeconds / 60)} mins {att.durationSeconds % 60}s
                    {att.skippedCount > 0 && (
                      <span className="text-rose-400 ml-2">({att.skippedCount} timed out/skipped)</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedAttempt(att)}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium flex items-center space-x-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Responses</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Inspect Responses */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-amber-400 uppercase font-semibold">
                  {selectedAttempt.module} Attempt Review
                </span>
                <h3 className="text-lg font-bold text-white">{selectedAttempt.id}</h3>
              </div>
              <button
                onClick={() => setSelectedAttempt(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center text-xs pb-3 border-b border-slate-800">
                <div className="bg-slate-800/60 p-2.5 rounded-lg">
                  <span className="text-slate-400">Total Items:</span>
                  <div className="text-base font-bold text-white">{selectedAttempt.totalItems}</div>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-lg">
                  <span className="text-slate-400">Completed:</span>
                  <div className="text-base font-bold text-emerald-400">{selectedAttempt.completedCount}</div>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-lg">
                  <span className="text-slate-400">Duration:</span>
                  <div className="text-base font-bold text-amber-400">{Math.round(selectedAttempt.durationSeconds / 60)}m</div>
                </div>
              </div>

              {selectedAttempt.selfReflection && (
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-2 text-xs">
                  <div className="font-bold text-amber-400">Self-Reflection Notes:</div>
                  <div className="text-slate-300">
                    Confidence: <strong>{selectedAttempt.selfReflection.perceivedConfidence} / 5</strong>
                  </div>
                  {selectedAttempt.selfReflection.personalReviewNotes && (
                    <div className="text-slate-300 italic">
                      "{selectedAttempt.selfReflection.personalReviewNotes}"
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">Responses List:</h4>
                {selectedAttempt.responses.map((r, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-400 font-mono">
                      <span>Item #{idx + 1} ({r.questionId})</span>
                      <span>{(r.timeTakenMs / 1000).toFixed(1)}s</span>
                    </div>
                    {r.characterBox && (
                      <div className="text-purple-300 font-mono text-[11px]">
                        Character Box: {r.characterBox.charactersCount} Person(s), {r.characterBox.mainCharacterAge}y, {r.characterBox.mainCharacterSex}, Mood: {r.characterBox.mainCharacterMood} | Action: {r.characterBox.action}
                      </div>
                    )}
                    <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {r.skipped ? (
                        <span className="text-rose-400 italic">[Skipped / Timed Out]</span>
                      ) : (
                        r.responseText
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedAttempt(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
