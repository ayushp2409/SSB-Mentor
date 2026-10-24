import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { questionService } from '../../services/questionService';
import { attemptService } from '../../services/attemptService';
import { reflectionService } from '../../services/reflectionService';
import { Question, TestResponse } from '../../types';
import {
  Clock,
  Play,
  RotateCcw,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Award
} from 'lucide-react';

export const SRTRunnerPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Test setup
  const [totalCount, setTotalCount] = useState<number>(60);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  // Active runner state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responsesMap, setResponsesMap] = useState<Record<string, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1800); // 30 minutes
  const [attemptId, setAttemptId] = useState<string>('');
  const [testStartTime, setTestStartTime] = useState<number>(0);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    const loadSRTData = async () => {
      try {
        const items = await questionService.getRandomQuestions('SRT', 80);
        setQuestions(items);
      } catch (err) {
        console.error('Failed to load SRT situations:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSRTData();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!hasStarted || isFinished) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          handleFinishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [hasStarted, isFinished]);

  const handleStartTest = async () => {
    if (!user) return;
    const selected = questions.slice(0, totalCount);
    setQuestions(selected);

    const attempt = await attemptService.createAttempt(
      user.id,
      'SRT',
      totalCount === 60 ? 'profile_srt_standard' : 'profile_srt_quick_20',
      1,
      totalCount
    );

    setAttemptId(attempt.id);
    setHasStarted(true);
    setTestStartTime(Date.now());
    setCurrentIndex(0);
    setSecondsRemaining(totalCount === 60 ? 1800 : 600);
  };

  const handleResponseChange = (text: string) => {
    const activeQ = questions[currentIndex];
    if (!activeQ) return;

    const updated = { ...responsesMap, [activeQ.id]: text };
    setResponsesMap(updated);

    // Autosave response
    if (attemptId) {
      attemptService.autosaveResponse(attemptId, {
        questionId: activeQ.id,
        responseText: text,
        timeTakenMs: 0,
        skipped: text.trim().length === 0,
      });
    }
  };

  const handleFinishTest = async () => {
    clearInterval(timerRef.current);
    setIsFinished(true);

    const totalDuration = Math.round((Date.now() - testStartTime) / 1000);
    if (attemptId) {
      await attemptService.completeAttempt(attemptId, totalDuration);
    }
  };

  const handleBookmark = async (qId: string, situation: string) => {
    if (!user) return;
    await reflectionService.addRevisionItem(user.id, qId, 'SRT', `Revise reaction: ${situation.slice(0, 50)}...`);
    alert('Situation added to Spaced Revision Queue!');
  };

  const activeQuestion = questions[currentIndex];
  const activeResponse = activeQuestion ? responsesMap[activeQuestion.id] || '' : '';
  const answeredCount = Object.values(responsesMap).filter((v) => v.trim().length > 0).length;

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full mb-3" />
        <p>Loading Situation Reaction Test repository...</p>
      </div>
    );
  }

  // SCREEN 1: Setup
  if (!hasStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              SRT
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Situation Reaction Test</h1>
              <p className="text-xs text-slate-400">Stage II Psychology • 60 Situations / 30 Minutes</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <h3 className="font-semibold text-white">Rules & Guidelines:</h3>
            <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-slate-300">
              <li>You have <strong>30 minutes</strong> to complete 60 practical situations.</li>
              <li>Write crisp, realistic, and complete reactions. Do not write passive thoughts like "He called the police and waited". Show initiative, leadership, and personal action.</li>
              <li>You can navigate freely using the question palette and bookmark difficult situations.</li>
              <li>Aim to attempt as many situations as possible with composure and common sense.</li>
            </ul>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Test Profile:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTotalCount(60)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  totalCount === 60
                    ? 'bg-military-800/80 border-sky-400 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <div className="font-bold text-sm text-sky-400">Standard SSB Booklet</div>
                <div className="text-xs text-slate-300 mt-1">60 situations (30 mins)</div>
              </button>

              <button
                type="button"
                onClick={() => setTotalCount(20)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  totalCount === 20
                    ? 'bg-military-800/80 border-sky-400 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <div className="font-bold text-sm text-sky-400">Quick Sprint</div>
                <div className="text-xs text-slate-300 mt-1">20 situations (10 mins)</div>
              </button>
            </div>
          </div>

          <button
            onClick={handleStartTest}
            className="w-full py-3.5 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-base flex items-center justify-center space-x-2 shadow-lg transition-transform"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start SRT Booklet</span>
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 2: Active Runner
  if (!isFinished) {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    const formattedTimer = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    return (
      <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between bg-slate-800/80 p-4 rounded-xl border border-slate-700">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-white text-base">SRT Booklet</span>
            <span className="text-xs text-slate-400 font-mono">
              Answered: <strong className="text-emerald-400">{answeredCount}</strong> / {questions.length}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 font-mono text-xl font-bold text-white bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
              <Clock className={`w-5 h-5 ${secondsRemaining < 300 ? 'text-rose-400 animate-pulse' : 'text-sky-400'}`} />
              <span>{formattedTimer}</span>
            </div>

            <button
              onClick={handleFinishTest}
              className="px-4 py-2 rounded-xl bg-military-600 hover:bg-military-500 text-white text-xs font-bold transition-colors"
            >
              Submit Booklet
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Main Question & Response Card (3 Cols) */}
          <div className="lg:col-span-3 bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Situation #{currentIndex + 1}
              </span>
              <button
                onClick={() => handleBookmark(activeQuestion.id, activeQuestion.content || '')}
                className="text-xs text-slate-400 hover:text-amber-400 flex items-center space-x-1"
                title="Bookmark for review"
              >
                <Bookmark className="w-4 h-4" />
                <span>Bookmark</span>
              </button>
            </div>

            {/* Situation Prompt */}
            <div className="text-lg sm:text-xl font-bold text-white leading-relaxed">
              {activeQuestion?.content}
            </div>

            {/* Response Area */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Your Immediate Reaction & Action:
              </label>
              <textarea
                value={activeResponse}
                onChange={(e) => handleResponseChange(e.target.value)}
                placeholder="He immediately... / You took charge and..."
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 focus:border-sky-400 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-hidden resize-none leading-relaxed"
              />
              <div className="text-[11px] text-slate-400 font-mono">Autosaved instantly</div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                disabled={currentIndex + 1 >= questions.length}
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <span>Next Situation</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Question Palette (1 Col) */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Question Palette</h3>
            <div className="grid grid-cols-5 gap-1.5 max-h-[360px] overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isAnswered = responsesMap[q.id]?.trim().length > 0;
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-8 rounded-lg text-xs font-mono font-bold transition-all ${
                      isCurrent
                        ? 'bg-sky-500 text-slate-950 ring-2 ring-white scale-105'
                        : isAnswered
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="pt-2 border-t border-slate-700 text-[10px] space-y-1 text-slate-400">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-900 border border-slate-700" />
                <span>Unanswered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 3: Review Screen
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-700">
          <Award className="w-8 h-8 text-sky-400" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">SRT Booklet Submitted!</h1>
            <p className="text-xs text-slate-400">Session saved to your candidate preparation history</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400">Completed Situations</div>
            <div className="text-2xl font-bold text-emerald-400">{answeredCount} / {questions.length}</div>
          </div>
          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400">Completion Rate</div>
            <div className="text-2xl font-bold text-sky-400">{Math.round((answeredCount / questions.length) * 100)}%</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => {
              setIsFinished(false);
              setHasStarted(false);
              setResponsesMap({});
            }}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Attempt Another Set</span>
          </button>

          <button
            onClick={() => navigate('/progress')}
            className="px-4 py-2 rounded-xl bg-military-600 hover:bg-military-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <span>View All Attempts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
