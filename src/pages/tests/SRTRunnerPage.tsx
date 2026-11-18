import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { questionService } from '../../services/questionService';
import { attemptService } from '../../services/attemptService';
import { reflectionService } from '../../services/reflectionService';
import { Question, TestResponse } from '../../types';
import { candidateMemoryService } from '../../services/candidateMemoryService';
import { evaluateSRTBatch } from '../../services/aiService';
import { SRTBatchEvaluation } from '../../types/ai';
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
  Award,
  Sparkles,
  Loader2,
  AlertTriangle
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

  // AI Evaluation State
  const [srtEvaluation, setSrtEvaluation] = useState<SRTBatchEvaluation | null>(null);
  const [aiEvalLoading, setAiEvalLoading] = useState(false);

  const handleEvaluateSRT = async () => {
    const list = questions.slice(0, totalCount).map((q) => ({
      situation: q.content || q.title,
      response: responsesMap[q.id] || '',
    })).filter((item) => item.response.trim().length > 0);

    if (list.length === 0) return;
    setAiEvalLoading(true);

    try {
      const res = await evaluateSRTBatch(list);
      if (res.success && res.data) {
        setSrtEvaluation(res.data);
        if (user) {
          const highPracticalityCount = res.data.analyzedResponses.filter(
            (r) => r.practicality === 'high'
          ).length;

          candidateMemoryService.saveSRTSession(user.id, {
            sessionDate: new Date().toISOString(),
            totalSituations: res.data.totalSituations,
            highPracticality: highPracticalityCount,
          });

          if (res.data.olqEvidence && res.data.olqEvidence.length > 0) {
            candidateMemoryService.addOLQEvidence(
              user.id,
              res.data.olqEvidence.map((e) => ({
                olqName: e.olq,
                level: e.level,
                evidence: e.evidence,
                source: 'SRT' as const,
                sessionId: attemptId || `srt_${Date.now()}`,
                timestamp: new Date().toISOString(),
              }))
            );
          }
        }
      }
    } finally {
      setAiEvalLoading(false);
    }
  };

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

        {/* AI Practicality & Decision Quality Evaluator */}
        <div className="bg-slate-900/80 border border-blue-500/30 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700/80 gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Practicality & Crisis Decision Evaluator</h3>
                <p className="text-[11px] text-slate-400">Assesses action-orientation, safety protocols, and resource allocation</p>
              </div>
            </div>

            <button
              onClick={handleEvaluateSRT}
              disabled={aiEvalLoading || answeredCount === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors shadow-md shrink-0"
            >
              {aiEvalLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Actions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run AI Evaluation</span>
                </>
              )}
            </button>
          </div>

          {!srtEvaluation && !aiEvalLoading && (
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center space-y-1">
              <p className="text-xs text-slate-300">
                Click "Run AI Evaluation" to grade your {answeredCount} reactions for practicality, initiative, and safety awareness.
              </p>
            </div>
          )}

          {srtEvaluation && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 leading-relaxed">
                <strong className="text-white">Assessor Feedback: </strong>
                {srtEvaluation.overallFeedback}
              </div>

              {/* Sample Detailed Situations */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Analyzed Responses & Suggested Improvements:
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {srtEvaluation.analyzedResponses.slice(0, 5).map((ar, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1.5 text-xs">
                      <div className="text-slate-300 font-semibold">{ar.situation}</div>
                      <div className="text-slate-400">
                        <strong className="text-slate-200">Your Action: </strong>
                        {ar.response}
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] pt-0.5">
                        <span className={`px-2 py-0.5 rounded font-mono ${
                          ar.practicality === 'high' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          Practicality: {ar.practicality}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-mono ${
                          ar.decisionQuality === 'sound' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-300'
                        }`}>
                          Decision: {ar.decisionQuality}
                        </span>
                      </div>
                      {ar.improvedResponse && (
                        <div className="p-2 rounded-lg bg-military-900/60 border border-military-700/40 text-[11px] text-military-200 italic">
                          <strong>Recommended Alternative: </strong>
                          {ar.improvedResponse}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Practice Recommendations */}
              {srtEvaluation.practiceRecommendations.length > 0 && (
                <div className="p-3.5 rounded-xl bg-military-900/50 border border-military-700/50 text-xs space-y-1">
                  <div className="font-bold text-amber-400">Tactical SRT Improvement Tips:</div>
                  <ul className="space-y-0.5 text-slate-300 list-disc list-inside">
                    {srtEvaluation.practiceRecommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
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
