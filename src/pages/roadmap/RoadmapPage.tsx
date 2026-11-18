import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { candidateMemoryService } from '../../services/candidateMemoryService';
import {
  Map,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  AlertCircle,
  BrainCircuit,
  Target,
  FileQuestion,
  Mic,
  Users2,
  BookOpen,
  Flame,
  Award,
} from 'lucide-react';

interface RoadmapDay {
  dayName: string;
  focusArea: string;
  tasks: Array<{
    id: string;
    title: string;
    module: string;
    durationMins: number;
    path: string;
    isCompleted: boolean;
  }>;
}

export const RoadmapPage: React.FC = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<RoadmapDay[]>([]);
  const [weakOLQs, setWeakOLQs] = useState<string[]>([]);

  const storageKey = user ? `ssb_mentor_weekly_roadmap_${user.id}` : 'ssb_mentor_weekly_roadmap_demo';

  useEffect(() => {
    if (!user) return;

    // Load weak OLQs
    const olqSummary = candidateMemoryService.getOLQSummary(user.id);
    const weakList = Object.entries(olqSummary)
      .filter(([_, data]) => data.level === 'needs_practice' || data.level === 'developing')
      .map(([name]) => name);
    setWeakOLQs(weakList);

    // Load or generate weekly schedule
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setSchedule(JSON.parse(saved));
        return;
      } catch (e) {}
    }

    generateAdaptiveSchedule(weakList);
  }, [user]);

  const generateAdaptiveSchedule = (weaks: string[]) => {
    const dailyTarget = user?.dailyTimeTargetMinutes || 90;
    const isPschPriority = weaks.some((w) => ['Effective Intelligence', 'Organising Ability', 'Initiative'].includes(w));
    const isCommPriority = weaks.some((w) => ['Power of Expression', 'Self Confidence', 'Ability to Influence Group'].includes(w));

    const defaultWeek: RoadmapDay[] = [
      {
        dayName: 'Monday',
        focusArea: 'Psychology Subconscious Spontaneity',
        tasks: [
          {
            id: 'mon_1',
            title: '5 Thematic Apperception Stories (TAT)',
            module: 'TAT',
            durationMins: 30,
            path: '/psychology/tat',
            isCompleted: false,
          },
          {
            id: 'mon_2',
            title: '20 Word Association Drills (WAT)',
            module: 'WAT',
            durationMins: 20,
            path: '/psychology/wat',
            isCompleted: false,
          },
          {
            id: 'mon_3',
            title: 'Daily Defence Briefing & LAC Notes',
            module: 'KNOWLEDGE',
            durationMins: 25,
            path: '/knowledge',
            isCompleted: false,
          },
        ],
      },
      {
        dayName: 'Tuesday',
        focusArea: 'Dynamic Cross-Questioning & CIQ Mastery',
        tasks: [
          {
            id: 'tue_1',
            title: 'AI Personal Interview (20 CIQ Exchanges)',
            module: 'INTERVIEW',
            durationMins: 45,
            path: '/interview/simulate',
            isCompleted: false,
          },
          {
            id: 'tue_2',
            title: 'Self Description Test (SDT) Reflection Update',
            module: 'SDT',
            durationMins: 25,
            path: '/journal',
            isCompleted: false,
          },
        ],
      },
      {
        dayName: 'Wednesday',
        focusArea: 'Situational Decisiveness & Group Tactics',
        tasks: [
          {
            id: 'wed_1',
            title: '30 Situation Reaction Booklet Items (SRT)',
            module: 'SRT',
            durationMins: 30,
            path: '/psychology/srt',
            isCompleted: false,
          },
          {
            id: 'wed_2',
            title: 'Virtual Group Discussion Simulator (Agnipath / Theatre)',
            module: 'GTO',
            durationMins: 30,
            path: '/gto/gd-simulator',
            isCompleted: false,
          },
        ],
      },
      {
        dayName: 'Thursday',
        focusArea: 'Verbal Fluency & Communication Delivery',
        tasks: [
          {
            id: 'thu_1',
            title: '2 Recorded Lecturette Speeches with Voice Analysis',
            module: 'LECTURETTE',
            durationMins: 35,
            path: '/lecturette',
            isCompleted: false,
          },
          {
            id: 'thu_2',
            title: 'PPDT Picture Box & Narration Practice',
            module: 'PPDT',
            durationMins: 30,
            path: '/psychology/ppdt',
            isCompleted: false,
          },
        ],
      },
      {
        dayName: 'Friday',
        focusArea: 'Strategic Synthesis & Deep Psychology',
        tasks: [
          {
            id: 'fri_1',
            title: 'Full 12-Slide TAT Simulation (11 Pics + 1 Blank)',
            module: 'TAT',
            durationMins: 45,
            path: '/psychology/tat',
            isCompleted: false,
          },
          {
            id: 'fri_2',
            title: 'Interactive Defence Awareness Quiz (10 Questions)',
            module: 'KNOWLEDGE',
            durationMins: 20,
            path: '/knowledge',
            isCompleted: false,
          },
        ],
      },
      {
        dayName: 'Saturday',
        focusArea: 'Group Planning & Comprehensive Obstacles',
        tasks: [
          {
            id: 'sat_1',
            title: 'GPE Group Planning Scenario Solution Planning',
            module: 'GTO',
            durationMins: 40,
            path: '/gto',
            isCompleted: false,
          },
          {
            id: 'sat_2',
            title: 'Consult SSB Personal Mentor on Week Progress',
            module: 'MENTOR',
            durationMins: 20,
            path: '/',
            isCompleted: false,
          },
        ],
      },
      {
        dayName: 'Sunday',
        focusArea: 'Review, Rest & Spaced Repetition',
        tasks: [
          {
            id: 'sun_1',
            title: 'Review Starred Bookmarks in Revision Queue',
            module: 'REVISION',
            durationMins: 30,
            path: '/progress',
            isCompleted: false,
          },
          {
            id: 'sun_2',
            title: 'Inspect OLQ Evidence Progress Dossier',
            module: 'OLQ',
            durationMins: 20,
            path: '/olq',
            isCompleted: false,
          },
        ],
      },
    ];

    setSchedule(defaultWeek);
    localStorage.setItem(storageKey, JSON.stringify(defaultWeek));
  };

  const handleToggleTask = (dayIndex: number, taskId: string) => {
    const updated = [...schedule];
    const task = updated[dayIndex].tasks.find((t) => t.id === taskId);
    if (task) {
      task.isCompleted = !task.isCompleted;
      setSchedule(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
  };

  const handleResetSchedule = () => {
    generateAdaptiveSchedule(weakOLQs);
  };

  // Metrics
  const totalTasks = schedule.reduce((sum, d) => sum + d.tasks.length, 0);
  const completedTasks = schedule.reduce(
    (sum, d) => sum + d.tasks.filter((t) => t.isCompleted).length,
    0
  );
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const daysToSSB = user?.targetSSBDate
    ? Math.max(
        0,
        Math.ceil((new Date(user.targetSSBDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold tracking-wider uppercase mb-1">
            <Map className="w-4 h-4" />
            <span>Personalized Training • Adaptive Weekly Planner</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Cadet Preparation Roadmap
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            A balanced schedule rotating across Psychology, Interview, GTO, and Communication. Automatically recalibrates based on your OLQ evidence gaps.
          </p>
        </div>

        <button
          onClick={handleResetSchedule}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Regenerate Schedule</span>
        </button>
      </div>

      {/* Progress & Countdown Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 font-medium">Days to SSB Reporting</div>
          <div className="text-3xl font-extrabold text-amber-400">
            {daysToSSB !== null ? `${daysToSSB} days` : 'Not Set'}
          </div>
          <div className="text-[11px] text-slate-400">
            Target Entry: <strong className="text-white">{user?.targetEntry || 'CDS'}</strong>
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 font-medium">Weekly Target Progress</div>
          <div className="text-3xl font-extrabold text-emerald-400">{completionPercentage}%</div>
          <div className="text-[11px] text-slate-400">
            {completedTasks} of {totalTasks} tasks completed
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 font-medium">Daily Quota Commitment</div>
          <div className="text-3xl font-extrabold text-white">
            {user?.dailyTimeTargetMinutes || 90}m
          </div>
          <div className="text-[11px] text-slate-400">Balanced multi-domain cadence</div>
        </div>
      </div>

      {/* Dynamic Weak-Area Warning */}
      {weakOLQs.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1 text-slate-300">
            <span className="font-bold text-amber-300">
              Adaptive Feedback — Prioritize Detected Improvement Areas:
            </span>
            <p>
              Your recent practice indicates opportunities to strengthen{' '}
              <strong className="text-white">{weakOLQs.slice(0, 3).join(', ')}</strong>. The schedule below has integrated relevant drills in TAT micro-actions and CIQ cross-questioning to build positive evidence.
            </p>
          </div>
        </div>
      )}

      {/* 7-Day Roadmap Grid */}
      <div className="space-y-4">
        {schedule.map((day, dIdx) => (
          <div
            key={day.dayName}
            className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-700/70 gap-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-military-800 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                  {day.dayName.slice(0, 3).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{day.dayName}</h3>
                  <p className="text-xs text-slate-400">{day.focusArea}</p>
                </div>
              </div>

              <div className="text-xs text-slate-400 font-mono">
                {day.tasks.filter((t) => t.isCompleted).length} / {day.tasks.length} Completed
              </div>
            </div>

            {/* Task list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {day.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    task.isCompleted
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : 'bg-slate-900/80 border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  <div
                    className="flex items-center space-x-3 cursor-pointer select-none flex-1 pr-2"
                    onClick={() => handleToggleTask(dIdx, task.id)}
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500 hover:text-slate-300 shrink-0" />
                    )}
                    <div>
                      <div
                        className={`text-xs font-semibold ${
                          task.isCompleted ? 'line-through text-slate-400' : 'text-slate-200'
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-mono">
                          {task.module}
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{task.durationMins}m</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={task.path}
                    className="p-2 rounded-lg bg-military-800 hover:bg-military-700 text-white shrink-0 transition-colors"
                    title="Launch module"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default RoadmapPage;