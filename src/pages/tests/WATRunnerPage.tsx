import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { questionService } from '../../services/questionService';
import { attemptService } from '../../services/attemptService';
import { reflectionService } from '../../services/reflectionService';
import { Question, TestResponse } from '../../types';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Bookmark,
  ArrowRight,
  ShieldAlert,
  Save,
  Flame,
  Award
} from 'lucide-react';

export const WATRunnerPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Test setup state
  const [wordCount, setWordCount] = useState<number>(60);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  // Active runner state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentResponse, setCurrentResponse] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [responses, setResponses] = useState<TestResponse[]>([]);
  const [attemptId, setAttemptId] = useState<string>('');
  const [testStartTime, setTestStartTime] = useState<number>(0);
  const [wordStartTime, setWordStartTime] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const loadWATWords = async () => {
      try {
        const items = await questionService.getRandomQuestions('WAT', 100);
        setQuestions(items);
      } catch (err) {
        console.error('Failed to load WAT words:', err);
      } finally {
        setLoading(false);
      }
    };
    loadWATWords();
  }, []);

  // Timer effect during active test
  useEffect(() => {
    if (!hasStarted || isFinished) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          handleNextWord(true); // auto advance on timeout
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [hasStarted, isFinished, currentIndex, currentResponse, questions]);

  const handleStartTest = async () => {
    if (!user) return;
    const selectedWords = questions.slice(0, wordCount);
    setQuestions(selectedWords);

    const attempt = await attemptService.createAttempt(
      user.id,
      'WAT',
      wordCount === 60 ? 'profile_wat_standard' : 'profile_wat_quick_20',
      1,
      wordCount
    );

    setAttemptId(attempt.id);
    setHasStarted(true);
    setTestStartTime(Date.now());
    setWordStartTime(Date.now());
    setCurrentIndex(0);
    setSecondsRemaining(15);
    setCurrentResponse('');

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleNextWord = async (isTimeout = false) => {
    const activeQuestion = questions[currentIndex];
    if (!activeQuestion) return;

    const latency = Date.now() - wordStartTime;
    const responseText = currentResponse.trim();
    const isSkipped = isTimeout && responseText.length === 0;

    const newResponse: TestResponse = {
      questionId: activeQuestion.id,
      responseText: isSkipped ? '' : responseText,
      timeTakenMs: latency,
      skipped: isSkipped,
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    // Autosave response
    if (attemptId) {
      await attemptService.autosaveResponse(attemptId, newResponse);
    }

    if (currentIndex + 1 >= questions.length) {
      // Completed test
      clearInterval(timerRef.current);
      setIsFinished(true);
      const totalDuration = Math.round((Date.now() - testStartTime) / 1000);
      await attemptService.completeAttempt(attemptId, totalDuration);
    } else {
      // Next word
      setCurrentIndex((prev) => prev + 1);
      setCurrentResponse('');
      setSecondsRemaining(15);
      setWordStartTime(Date.now());
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNextWord(false);
    }
  };

  const handleBookmarkRevision = async (qId: string, word: string) => {
    if (!user) return;
    await reflectionService.addRevisionItem(user.id, qId, 'WAT', `Practice sentence for WAT word: ${word}`);
    alert(`Bookmarked "${word}" to your Spaced Revision Queue!`);
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full mb-3" />
        <p>Loading curated WAT repository...</p>
      </div>
    );
  }

  // SCREEN 1: Setup / Pre-Test Screen
  if (!hasStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              WAT
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Word Association Test</h1>
              <p className="text-xs text-slate-400">Stage II Psychology • Strict 15s Sequential Pacing</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <h3 className="font-semibold text-white">Instructions & Rules:</h3>
            <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-slate-300">
              <li>Words will appear on screen one by one for exactly <strong>15 seconds</strong>.</li>
              <li>Type the <strong>first meaningful sentence</strong> that comes to your mind and press <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-amber-300 text-xs">Enter</kbd>.</li>
              <li>If you don't submit within 15 seconds, the test automatically advances and marks the word as skipped.</li>
              <li>Avoid purely grammatical rules or generic idioms like "Honesty is the best policy". Express proactive action and personal values.</li>
              <li>Once submitted, you cannot go back (matches actual SSB board conditions).</li>
            </ul>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Simulation Format:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWordCount(60)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  wordCount === 60
                    ? 'bg-military-800/80 border-amber-400 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <div className="font-bold text-sm text-amber-400">Full SSB Simulation</div>
                <div className="text-xs text-slate-300 mt-1">60 words (15 minutes)</div>
              </button>

              <button
                type="button"
                onClick={() => setWordCount(20)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  wordCount === 20
                    ? 'bg-military-800/80 border-amber-400 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <div className="font-bold text-sm text-amber-400">Quick Practice Drill</div>
                <div className="text-xs text-slate-300 mt-1">20 words (5 minutes)</div>
              </button>
            </div>
          </div>

          <button
            onClick={handleStartTest}
            className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-base flex items-center justify-center space-x-2 shadow-lg transition-transform active:scale-[0.99]"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start WAT Simulation</span>
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 2: Active Test Runner (Distraction-Free)
  if (!isFinished) {
    const currentWord = questions[currentIndex]?.title || 'WORD';
    const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

    return (
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        {/* Top Pacing Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="font-mono">
            Word <span className="text-amber-400 font-bold text-base">{currentIndex + 1}</span> of {questions.length}
          </div>
          <div className="flex items-center space-x-2">
            <Clock className={`w-4 h-4 ${secondsRemaining <= 4 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
            <span className={`font-mono text-lg font-extrabold ${secondsRemaining <= 4 ? 'text-rose-400' : 'text-white'}`}>
              {secondsRemaining}s
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Big Word Display Card */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-10 sm:p-16 flex flex-col items-center justify-center min-h-[300px] shadow-2xl relative overflow-hidden">
          {/* Subtle countdown circle indicator */}
          <div className="absolute top-4 right-4 text-xs font-mono text-slate-500 uppercase tracking-widest">
            Automatic Advance
          </div>

          <div className="text-4xl sm:text-6xl font-black text-white tracking-widest uppercase select-none drop-shadow-md">
            {currentWord}
          </div>

          <div className="w-full max-w-xl mt-12">
            <input
              ref={inputRef}
              type="text"
              value={currentResponse}
              onChange={(e) => setCurrentResponse(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your spontaneous sentence and hit Enter..."
              autoFocus
              className="w-full bg-slate-900/90 border-2 border-slate-600 focus:border-amber-400 rounded-xl px-5 py-3.5 text-base sm:text-lg text-white placeholder-slate-500 focus:outline-hidden transition-all shadow-inner text-center font-medium"
            />
          </div>

          <div className="flex items-center justify-between w-full max-w-xl mt-4 text-xs text-slate-400">
            <span className="text-slate-500">Press Enter or wait for timer</span>
            <button
              onClick={() => handleNextWord(false)}
              className="text-amber-400 hover:text-amber-300 font-semibold"
            >
              Skip / Submit &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 3: Post-Test Review & Spaced Repetition Bookmarks
  const completedCount = responses.filter((r) => !r.skipped && r.responseText.length > 0).length;
  const skippedCount = responses.filter((r) => r.skipped).length;
  const avgLatencyMs = Math.round(
    responses.reduce((acc, r) => acc + r.timeTakenMs, 0) / (responses.length || 1)
  );

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      {/* Header Summary */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
          <div>
            <div className="flex items-center space-x-2">
              <Award className="w-6 h-6 text-amber-400" />
              <h1 className="text-xl sm:text-2xl font-bold text-white">WAT Session Complete!</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">Review your responses, latency speed, and bookmark words for revision.</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setIsFinished(false);
                setHasStarted(false);
              }}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Practice Again</span>
            </button>
            <button
              onClick={() => navigate('/progress')}
              className="px-4 py-2 rounded-xl bg-military-600 hover:bg-military-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <span>View Progress</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Analytics Chips */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400">Answered</div>
            <div className="text-xl font-bold text-emerald-400">{completedCount} / {responses.length}</div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400">Skipped / Timed Out</div>
            <div className="text-xl font-bold text-rose-400">{skippedCount}</div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400">Avg Reaction Latency</div>
            <div className="text-xl font-bold text-amber-400">{(avgLatencyMs / 1000).toFixed(1)}s</div>
          </div>
        </div>
      </div>

      {/* Item-by-Item Review List */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <span>Responses & Self-Analysis</span>
        </h2>

        <div className="divide-y divide-slate-700/60">
          {responses.map((resp, idx) => {
            const word = questions[idx]?.title || 'WORD';
            return (
              <div key={resp.questionId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-slate-500 w-6">#{idx + 1}</span>
                    <span className="font-extrabold text-amber-400 tracking-wider text-base">{word}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({(resp.timeTakenMs / 1000).toFixed(1)}s)</span>
                  </div>
                  <div className="pl-8 text-slate-200">
                    {resp.skipped ? (
                      <span className="italic text-rose-400 text-xs">[Timed Out / Skipped]</span>
                    ) : (
                      resp.responseText
                    )}
                  </div>
                </div>

                <div className="pl-8 sm:pl-0 flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleBookmarkRevision(resp.questionId, word)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-700 transition-colors"
                    title="Bookmark word for spaced revision"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
