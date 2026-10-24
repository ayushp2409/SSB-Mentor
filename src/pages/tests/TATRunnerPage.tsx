import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { questionService } from '../../services/questionService';
import { attemptService } from '../../services/attemptService';
import { Question, TestResponse, SelfReflection } from '../../types';
import {
  Clock,
  Play,
  RotateCcw,
  ArrowRight,
  Eye,
  PenTool,
  Save,
  Award,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export const TATRunnerPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Test setup
  const [slideCount, setSlideCount] = useState<number>(12); // standard 12 (11 pics + 1 blank)
  const [questions, setQuestions] = useState<Question[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  // Active Runner State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [phase, setPhase] = useState<'observation' | 'writing'>('observation');
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [currentStory, setCurrentStory] = useState('');
  const [responses, setResponses] = useState<TestResponse[]>([]);
  const [attemptId, setAttemptId] = useState<string>('');
  const [testStartTime, setTestStartTime] = useState<number>(0);
  const [slideStartTime, setSlideStartTime] = useState<number>(0);

  // Post-test reflection
  const [perceivedConfidence, setPerceivedConfidence] = useState(4);
  const [keyOLQs, setKeyOLQs] = useState<string[]>(['Initiative', 'Self Confidence', 'Sense of Responsibility']);
  const [reviewNotes, setReviewNotes] = useState('');

  const timerRef = useRef<any>(null);

  useEffect(() => {
    const loadTATPictures = async () => {
      try {
        const items = await questionService.getQuestionsByCategory('TAT', false);
        setQuestions(items);
      } catch (err) {
        console.error('Failed to load TAT pictures:', err);
      } finally {
        setLoading(false);
      }
    };
    loadTATPictures();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!hasStarted || isFinished) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (phase === 'observation') {
            // Switch to writing phase (4 minutes = 240 seconds)
            setPhase('writing');
            return 240;
          } else {
            // Writing timeout -> auto-advance to next slide
            handleAdvanceSlide();
            return 30;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [hasStarted, isFinished, phase, currentSlideIndex, currentStory]);

  const handleStartTest = async () => {
    if (!user) return;
    const selected = questions.slice(0, slideCount - 1); // 11 pictures + 1 blank
    setQuestions(selected);

    const attempt = await attemptService.createAttempt(
      user.id,
      'TAT',
      slideCount === 12 ? 'profile_tat_standard' : 'profile_tat_express_3',
      1,
      slideCount
    );

    setAttemptId(attempt.id);
    setHasStarted(true);
    setTestStartTime(Date.now());
    setSlideStartTime(Date.now());
    setCurrentSlideIndex(0);
    setPhase('observation');
    setSecondsRemaining(30);
    setCurrentStory('');
  };

  const handleAdvanceSlide = async () => {
    const isBlankSlide = currentSlideIndex === slideCount - 1;
    const activeQuestion = questions[currentSlideIndex];
    const questionId = isBlankSlide ? 'tat_blank_slide' : activeQuestion?.id || `tat_${currentSlideIndex + 1}`;

    const newResponse: TestResponse = {
      questionId,
      responseText: currentStory.trim(),
      timeTakenMs: Date.now() - slideStartTime,
      skipped: currentStory.trim().length === 0,
    };

    const updated = [...responses, newResponse];
    setResponses(updated);

    if (attemptId) {
      await attemptService.autosaveResponse(attemptId, newResponse);
    }

    if (currentSlideIndex + 1 >= slideCount) {
      // Completed all slides
      clearInterval(timerRef.current);
      setIsFinished(true);
    } else {
      setCurrentSlideIndex((prev) => prev + 1);
      setCurrentStory('');
      setPhase('observation');
      setSecondsRemaining(30);
      setSlideStartTime(Date.now());
    }
  };

  const handleSubmitFinalReflection = async () => {
    const totalDuration = Math.round((Date.now() - testStartTime) / 1000);
    const reflection: SelfReflection = {
      perceivedConfidence,
      keyOLQsDemonstrated: keyOLQs,
      personalReviewNotes: reviewNotes,
    };

    await attemptService.completeAttempt(attemptId, totalDuration, reflection);
    navigate('/progress');
  };

  const isBlankSlide = currentSlideIndex === slideCount - 1;
  const currentPicture = questions[currentSlideIndex];
  const imageSrc = isBlankSlide ? null : currentPicture?.assetUrl || '/assets/tat/tat_001.jpeg';

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full mb-3" />
        <p>Loading TAT picture collection...</p>
      </div>
    );
  }

  // SCREEN 1: Setup / Pre-Test Screen
  if (!hasStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              TAT
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Thematic Apperception Test</h1>
              <p className="text-xs text-slate-400">Stage II Psychology • 11 Pictures + 1 Blank Slide</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <h3 className="font-semibold text-white">Structure of TAT:</h3>
            <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-slate-300">
              <li>Each picture is shown for <strong>30 seconds</strong> for detailed observation.</li>
              <li>You then have exactly <strong>4 minutes</strong> to write a structured story.</li>
              <li>Story Framework:
                <ul className="list-none pl-5 mt-1 text-slate-400 space-y-0.5 text-xs">
                  <li>&bull; <strong>Past:</strong> What led to the current situation?</li>
                  <li>&bull; <strong>Present:</strong> What is happening right now? (Thoughts, decisions, and immediate actions of the hero).</li>
                  <li>&bull; <strong>Future:</strong> What is the positive, logical outcome?</li>
                </ul>
              </li>
              <li><strong>Slide 12 is a Blank Slide:</strong> You will write a positive story on a theme of your choice reflecting constructive values.</li>
            </ul>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Test Profile:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSlideCount(12)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  slideCount === 12
                    ? 'bg-military-800/80 border-emerald-400 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <div className="font-bold text-sm text-emerald-400">Full 12-Slide Test</div>
                <div className="text-xs text-slate-300 mt-1">11 pictures + 1 blank (~54 mins)</div>
              </button>

              <button
                type="button"
                onClick={() => setSlideCount(3)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  slideCount === 3
                    ? 'bg-military-800/80 border-emerald-400 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <div className="font-bold text-sm text-emerald-400">Express Drill (3 Pics)</div>
                <div className="text-xs text-slate-300 mt-1">Daily practice (~13 mins)</div>
              </button>
            </div>
          </div>

          <button
            onClick={handleStartTest}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base flex items-center justify-center space-x-2 shadow-lg transition-transform active:scale-[0.99]"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Begin TAT Simulation</span>
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
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between bg-slate-800/80 p-4 rounded-xl border border-slate-700">
          <div>
            <span className="text-xs text-slate-400">Slide {currentSlideIndex + 1} of {slideCount}</span>
            <div className="text-sm font-bold text-white flex items-center space-x-2">
              {isBlankSlide ? (
                <span className="text-amber-400">Blank Slide (Your Own Theme)</span>
              ) : (
                <span>Picture Prompt #{currentSlideIndex + 1}</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-700">
              {phase === 'observation' ? (
                <>
                  <Eye className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-400 uppercase">Observation</span>
                </>
              ) : (
                <>
                  <PenTool className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400 uppercase">Writing</span>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2 font-mono text-xl font-bold text-white bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>{formattedTimer}</span>
            </div>
          </div>
        </div>

        {/* Observation Canvas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Picture Panel */}
          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-2 flex items-center justify-center min-h-[350px] overflow-hidden">
            {isBlankSlide ? (
              <div className="w-full h-full min-h-[350px] bg-white rounded-xl flex flex-col items-center justify-center text-slate-600 p-6 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-amber-500" />
                <h3 className="font-bold text-lg text-slate-900">BLANK SLIDE</h3>
                <p className="text-xs max-w-xs text-slate-600">
                  Write a genuine story depicting a positive scenario, goal achievement, or personal challenge overcome through resourcefulness.
                </p>
              </div>
            ) : imageSrc ? (
              <img
                src={imageSrc}
                alt={`TAT Slide ${currentSlideIndex + 1}`}
                className="max-h-[420px] w-auto object-contain rounded-xl select-none"
              />
            ) : (
              <div className="text-slate-500 text-sm">Image prompt placeholder</div>
            )}
          </div>

          {/* Story Writing Panel */}
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-5 flex flex-col justify-between space-y-4 shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Your Story Narrative</span>
                <span className="text-[11px] text-slate-400 font-mono">Autosaved</span>
              </div>
              <textarea
                value={currentStory}
                onChange={(e) => setCurrentStory(e.target.value)}
                placeholder="Past: What led to this moment...&#10;Present: The actions, thoughts, and decisions taken...&#10;Future: The positive and realistic conclusion..."
                rows={12}
                className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-hidden resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700 text-xs">
              <span className="text-slate-400">
                Word count: <strong className="text-slate-200">{currentStory.trim().split(/\s+/).filter(Boolean).length}</strong>
              </span>

              <button
                type="button"
                onClick={handleAdvanceSlide}
                className="px-4 py-2 rounded-xl bg-military-600 hover:bg-military-500 text-white font-semibold transition-colors flex items-center space-x-1.5"
              >
                <span>{currentSlideIndex + 1 === slideCount ? 'Finish Stories' : 'Next Slide'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 3: Post-Test Reflection
  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-700">
          <Award className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">TAT Completed — Self-Review</h1>
            <p className="text-xs text-slate-400">Reflect on your story themes and projected Officer Like Qualities (OLQs)</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Perceived Self-Confidence Across Stories (1 to 5):
            </label>
            <div className="flex items-center space-x-3">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setPerceivedConfidence(lvl)}
                  className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                    perceivedConfidence === lvl
                      ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                      : 'bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Key Qualities Highlighted in Your Heroes:
            </label>
            <div className="flex flex-wrap gap-2">
              {['Initiative', 'Courage', 'Social Adaptability', 'Sense of Responsibility', 'Stamina', 'Liveliness', 'Resourcefulness'].map((olq) => {
                const selected = keyOLQs.includes(olq);
                return (
                  <button
                    key={olq}
                    type="button"
                    onClick={() => {
                      if (selected) setKeyOLQs(keyOLQs.filter((q) => q !== olq));
                      else setKeyOLQs([...keyOLQs, olq]);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selected
                        ? 'bg-military-600 text-white border border-military-400'
                        : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {olq}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Personal Review Notes & Areas to Refine:
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="e.g. Ensure the hero takes immediate personal action rather than relying entirely on outside authorities..."
              rows={4}
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden"
            />
          </div>
        </div>

        <button
          onClick={handleSubmitFinalReflection}
          className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg transition-transform"
        >
          <span>Save Attempt & View Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
