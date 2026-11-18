import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { candidateMemoryService } from '../../services/candidateMemoryService';
import { OLQ_GROUPS, OLQName, OLQEvidenceLevel } from '../../types/ai';
import {
  Shield,
  Star,
  Award,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  BrainCircuit,
  ArrowRight,
  BookOpen,
  Mic,
  Users2,
  FileQuestion,
  Target,
  Sparkles,
} from 'lucide-react';

export const OLQPage: React.FC = () => {
  const { user } = useAuth();
  const [olqSummary, setOlqSummary] = useState<
    Record<string, { level: string; evidenceCount: number; lastNote: string }>
  >({});
  const [totalEvidenceCount, setTotalEvidenceCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const summary = candidateMemoryService.getOLQSummary(user.id);
    const store = candidateMemoryService.getOLQStore(user.id);
    setOlqSummary(summary);
    setTotalEvidenceCount(store.items.length);
  }, [user]);

  const levelBadges: Record<
    string,
    { label: string; bg: string; text: string; border: string }
  > = {
    positive_evidence: {
      label: 'Positive Evidence',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
    },
    developing: {
      label: 'Developing',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
    },
    needs_practice: {
      label: 'Needs Practice',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
    },
    insufficient_evidence: {
      label: 'Insufficient Evidence',
      bg: 'bg-slate-800',
      text: 'text-slate-400',
      border: 'border-slate-700',
    },
  };

  const moduleOLQGuides = [
    {
      module: 'TAT (Thematic Apperception)',
      path: '/psychology/tat',
      icon: BrainCircuit,
      olqs: ['Organising Ability', 'Initiative', 'Sense of Responsibility', 'Social Adaptability'],
      description: 'Reveals unconscious problem-solving structure, empathy, and initiative through story narratives.',
    },
    {
      module: 'WAT (Word Association)',
      path: '/psychology/wat',
      icon: BrainCircuit,
      olqs: ['Effective Intelligence', 'Power of Expression', 'Liveliness', 'Speed of Decision'],
      description: 'Tests spontaneous subconscious attitudes and positive mindset under strict 15s time pressure.',
    },
    {
      module: 'SRT (Situation Reaction)',
      path: '/psychology/srt',
      icon: Target,
      olqs: ['Speed of Decision', 'Courage', 'Reasoning Ability', 'Determination'],
      description: 'Assesses practical action-orientation, safety priorities, and leadership in realistic crises.',
    },
    {
      module: 'Personal Interview',
      path: '/interview/simulate',
      icon: FileQuestion,
      olqs: ['Power of Expression', 'Self Confidence', 'Cooperation', 'Reasoning Ability'],
      description: 'Tests self-awareness, personal values, emotional maturity, and depth through probing CIQs.',
    },
    {
      module: 'Lecturette',
      path: '/lecturette',
      icon: Mic,
      olqs: ['Power of Expression', 'Self Confidence', 'Effective Intelligence'],
      description: 'Measures fluency, structured thought presentation, composure, and pacing in public speaking.',
    },
    {
      module: 'GTO Group Discussion',
      path: '/gto/gd-simulator',
      icon: Users2,
      olqs: ['Ability to Influence Group', 'Cooperation', 'Social Adaptability', 'Initiative'],
      description: 'Evaluates team cohesion, persuasive logic, listening ability, and constructive argumentation.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold tracking-wider uppercase mb-1">
          <Shield className="w-4 h-4" />
          <span>Services Selection Board • 15 Officer Like Qualities (OLQs)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          OLQ Performance & Evidence Dossier
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl mt-1.5 leading-relaxed">
          The SSB evaluates candidates against 15 Officer Like Qualities divided into 4 core behavioral groups. This dashboard aggregates behavioral evidence collected from your TAT stories, WAT reactions, SRT solutions, mock interviews, and GTO tasks.
        </p>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 font-medium">Logged Behavioral Observations</div>
          <div className="text-3xl font-extrabold text-white">{totalEvidenceCount}</div>
          <div className="text-[11px] text-emerald-400 font-medium">Across all test simulations</div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 font-medium">Qualities with Active Evidence</div>
          <div className="text-3xl font-extrabold text-amber-400">
            {Object.keys(olqSummary).length} <span className="text-base text-slate-400">/ 15</span>
          </div>
          <div className="text-[11px] text-slate-400">Continuous multi-module tracking</div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 font-medium">Positive Practice Indicators</div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {Object.values(olqSummary).filter((s) => s.level === 'positive_evidence').length}
          </div>
          <div className="text-[11px] text-slate-400">Demonstrated consistently</div>
        </div>
      </div>

      {/* 4 OLQ Groups */}
      <div className="space-y-6">
        {Object.entries(OLQ_GROUPS).map(([groupTitle, qualities]) => (
          <div
            key={groupTitle}
            className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-md space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-military-800/80 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                  {groupTitle.includes('Group I') ? 'I' : groupTitle.includes('Group II') ? 'II' : groupTitle.includes('Group III') ? 'III' : 'IV'}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{groupTitle}</h2>
                  <p className="text-xs text-slate-400">
                    {groupTitle.includes('Group I')
                      ? 'Planning, intellect, and conceptual reasoning capabilities'
                      : groupTitle.includes('Group II')
                      ? 'Social adaptability, teamwork, and duty responsibility'
                      : groupTitle.includes('Group III')
                      ? 'Dynamic drive, initiative, and peer group influence'
                      : 'Physical stamina, courage, and unwavering determination'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quality Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
              {qualities.map((qualName) => {
                const data = olqSummary[qualName];
                const levelKey = data?.level || 'insufficient_evidence';
                const badge = levelBadges[levelKey] || levelBadges.insufficient_evidence;

                return (
                  <div
                    key={qualName}
                    className="p-4 rounded-xl bg-slate-900/70 border border-slate-700/60 hover:border-slate-600 transition-all space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-white tracking-wide">{qualName}</div>
                      <div
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {badge.label}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 pt-1">
                      {data ? (
                        <>
                          <div className="font-mono text-slate-300">
                            {data.evidenceCount} observation{data.evidenceCount > 1 ? 's' : ''}
                          </div>
                          {data.lastNote && (
                            <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 italic">
                              "{data.lastNote}"
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-500 italic">No practice observations yet</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Recommended Practice by Module */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">How Each Module Develops Specific OLQs</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleOLQGuides.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.module}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/70 space-y-2 flex flex-col justify-between hover:border-slate-500 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-military-800 text-amber-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-bold text-white">{mod.module}</div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{mod.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {mod.olqs.map((q) => (
                      <span
                        key={q}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono"
                      >
                        {q}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  to={mod.path}
                  className="mt-3 inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-military-700 hover:bg-military-600 text-white text-xs font-semibold transition-colors"
                >
                  <span>Practise Module</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ethical Assessment Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300/90 leading-relaxed flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300">Ethical AI Preparation Disclaimer:</strong> This performance dossier provides educational practice reflections based on simulated responses. In the actual Services Selection Board, OLQs are evaluated holistically by certified military psychologists, Group Testing Officers, and Interviewing Officers over 5 rigorous days. No automated software or AI model can officially diagnose personality traits or guarantee board recommendation.
        </div>
      </div>
    </div>
  );
};
export default OLQPage;