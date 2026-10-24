import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { planService } from '../../services/planService';
import { attemptService } from '../../services/attemptService';
import { reflectionService } from '../../services/reflectionService';
import { DailyPlan, TestAttempt, RevisionItem } from '../../types';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  BrainCircuit,
  Mic,
  Users2,
  FileQuestion,
  BookMarked,
  TrendingUp,
  Target,
  Sparkles,
  ArrowRight,
  Flame,
  Award,
  AlertCircle
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<TestAttempt[]>([]);
  const [revisionItems, setRevisionItems] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      try {
        const plan = await planService.getDailyPlan(user.id, planService.getTodayDateString(), user.dailyTimeTargetMinutes);
        setDailyPlan(plan);

        const attempts = await attemptService.getUserAttempts(user.id);
        setRecentAttempts(attempts.slice(0, 5));

        const revs = await reflectionService.getUserRevisionItems(user.id);
        setRevisionItems(revs.slice(0, 4));
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user]);

  const handleToggleTask = async (taskId: string) => {
    if (!user || !dailyPlan) return;
    try {
      const updated = await planService.toggleTask(user.id, dailyPlan.date, taskId);
      setDailyPlan({ ...updated });
    } catch (e) {
      console.error('Error toggling task:', e);
    }
  };

  const getModuleRoute = (mod: string) => {
    switch (mod) {
      case 'WAT':
      case 'TAT':
      case 'SRT':
      case 'PPDT':
        return `/psychology/${mod.toLowerCase()}`;
      case 'LECTURETTE':
        return '/lecturette';
      case 'GTO':
        return '/gto';
      case 'INTERVIEW':
        return '/interview';
      default:
        return '/journal';
    }
  };

  const completedTasksCount = dailyPlan?.tasks.filter(t => t.isCompleted).length || 0;
  const totalTasksCount = dailyPlan?.tasks.length || 0;
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Calculate days remaining to SSB
  const daysToSSB = user?.targetSSBDate ? Math.max(0, Math.ceil((new Date(user.targetSSBDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <div className="space-y-6">
      {/* Cadet Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-military-900 via-slate-800 to-navy-900 p-6 sm:p-8 border border-military-800/60 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-military-600/60 text-military-200 border border-military-500/30">
                Target: {user?.targetEntry || 'CDS (IMA)'}
              </span>
              {user?.preferredBoard && (
                <span className="text-xs text-slate-300 font-medium">| {user.preferredBoard}</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-amber-400">{user?.displayName}</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Consistently develop Officer Like Qualities (OLQs) through disciplined daily practice. Today's preparation focuses on psychology spontaneity, thought clarity, and situational leadership.
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 shrink-0">
            <div className="text-center px-2">
              <div className="text-xs text-slate-400 font-medium">Daily Target</div>
              <div className="text-xl font-bold text-white">{user?.dailyTimeTargetMinutes || 90}m</div>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="text-center px-2">
              <div className="text-xs text-slate-400 font-medium">SSB Board</div>
              <div className="text-xl font-bold text-amber-400">{daysToSSB ? `${daysToSSB}d` : 'Set Date'}</div>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="text-center px-2">
              <div className="text-xs text-slate-400 font-medium">Completed</div>
              <div className="text-xl font-bold text-emerald-400">{completionPercentage}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Plan & Quick Practice Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Target List (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Today's Preparation Tasks</h2>
                <span className="text-xs text-slate-400">({dailyPlan?.date})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  {completedTasksCount} / {totalTasksCount} Finished
                </span>
              </div>
            </div>

            {/* Task Checklist */}
            <div className="divide-y divide-slate-700/60 mt-2">
              {dailyPlan?.tasks.map((task) => (
                <div
                  key={task.taskId}
                  className={`py-3.5 flex items-center justify-between transition-colors ${
                    task.isCompleted ? 'opacity-65' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 cursor-pointer select-none" onClick={() => handleToggleTask(task.taskId)}>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-white transition-colors focus:outline-hidden"
                      aria-label="Toggle task"
                    >
                      {task.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                      )}
                    </button>
                    <div>
                      <div className={`text-sm font-medium ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                        {task.title}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-mono text-[10px] uppercase">
                          {task.module}
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{task.durationMinutes} mins</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={getModuleRoute(task.module)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-military-700 hover:bg-military-600 text-white transition-colors"
                  >
                    <span>Launch</span>
                    <Play className="w-3 h-3 fill-current" />
                  </Link>
                </div>
              ))}
            </div>

            {dailyPlan?.rolloverFromDate && (
              <div className="mt-4 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Notice: High-priority incomplete task rolled over intelligently from yesterday without backlog overload.</span>
              </div>
            )}
          </div>

          {/* Quick Practice Modules Hub */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Target className="w-5 h-5 text-military-400" />
              <span>Direct Module Simulators</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                to="/psychology/wat"
                className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 hover:border-military-500/60 transition-all group"
              >
                <div className="text-amber-400 font-bold text-sm group-hover:text-amber-300">WAT Simulator</div>
                <div className="text-xs text-slate-400 mt-1">60 words, 15s timer</div>
              </Link>

              <Link
                to="/psychology/tat"
                className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 hover:border-military-500/60 transition-all group"
              >
                <div className="text-amber-400 font-bold text-sm group-hover:text-amber-300">TAT Stories</div>
                <div className="text-xs text-slate-400 mt-1">12 slides (11+1 blank)</div>
              </Link>

              <Link
                to="/psychology/srt"
                className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 hover:border-military-500/60 transition-all group"
              >
                <div className="text-amber-400 font-bold text-sm group-hover:text-amber-300">SRT Booklet</div>
                <div className="text-xs text-slate-400 mt-1">60 situations / 30m</div>
              </Link>

              <Link
                to="/psychology/ppdt"
                className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 hover:border-military-500/60 transition-all group"
              >
                <div className="text-amber-400 font-bold text-sm group-hover:text-amber-300">PPDT Screening</div>
                <div className="text-xs text-slate-400 mt-1">Box + Story + Speech</div>
              </Link>

              <Link
                to="/lecturette"
                className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 hover:border-military-500/60 transition-all group"
              >
                <div className="text-amber-400 font-bold text-sm group-hover:text-amber-300">Lecturette</div>
                <div className="text-xs text-slate-400 mt-1">4 topics, 3m timer</div>
              </Link>

              <Link
                to="/gto"
                className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 hover:border-military-500/60 transition-all group"
              >
                <div className="text-amber-400 font-bold text-sm group-hover:text-amber-300">GPE Scenarios</div>
                <div className="text-xs text-slate-400 mt-1">Prioritize & plan</div>
              </Link>

              <Link
                to="/interview"
                className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 hover:border-military-500/60 transition-all group"
              >
                <div className="text-amber-400 font-bold text-sm group-hover:text-amber-300">CIQ Interview</div>
                <div className="text-xs text-slate-400 mt-1">6 CIQs & technical</div>
              </Link>

              <Link
                to="/journal"
                className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 hover:border-military-500/60 transition-all group"
              >
                <div className="text-amber-400 font-bold text-sm group-hover:text-amber-300">SDT Master</div>
                <div className="text-xs text-slate-400 mt-1">5 core paragraphs</div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Spaced Repetition & Recent Attempts */}
        <div className="space-y-6">
          {/* Spaced Repetition Queue */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-white text-sm">Spaced Revision Queue</h3>
              </div>
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                {revisionItems.length} Due
              </span>
            </div>

            {revisionItems.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No weak-area bookmarks due for revision today. Star difficult words or situations during tests to queue them here.
              </p>
            ) : (
              <div className="space-y-2">
                {revisionItems.map((rev) => (
                  <div key={rev.id} className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-700/50 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 uppercase tracking-wider text-[10px] bg-military-800 px-1.5 py-0.5 rounded">
                        {rev.module}
                      </span>
                      <span className="text-slate-400 text-[10px]">Due {rev.nextReviewDate}</span>
                    </div>
                    <div className="text-slate-300 font-medium">{rev.notes || rev.questionId}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Practice History */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Recent Test Sessions</h3>
              </div>
              <Link to="/progress" className="text-xs text-amber-400 hover:underline">
                View All
              </Link>
            </div>

            {recentAttempts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-slate-400 mb-3">No test sessions recorded yet.</p>
                <Link
                  to="/psychology/wat"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-military-600 hover:bg-military-500 text-white text-xs font-medium"
                >
                  <span>Start First WAT Test</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentAttempts.map((att) => (
                  <div key={att.id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center space-x-2">
                        <span>{att.module} Simulation</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(att.startedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Answered: <strong className="text-emerald-400">{att.completedCount}</strong> / {att.totalItems} | Duration: {Math.round(att.durationSeconds / 60)}m
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      Finished
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
