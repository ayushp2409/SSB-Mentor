import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { questionService } from '../../services/questionService';
import { attemptService } from '../../services/attemptService';
import { Question, TestResponse } from '../../types';
import {
  Clock,
  Play,
  RotateCcw,
  ArrowRight,
  Eye,
  PenTool,
  Mic,
  Square,
  Users2,
  Award,
  Sparkles,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';

export const PPDTRunnerPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Test state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  // Phases: 'observation' (30s) -> 'box' (60s) -> 'story' (240s) -> 'narration' (60s) -> 'discussion'
  const [phase, setPhase] = useState<'observation' | 'box' | 'story' | 'narration' | 'discussion'>('observation');
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  // Character Box Inputs
  const [charCount, setCharCount] = useState<number>(1);
  const [mainAge, setMainAge] = useState<string>('24');
  const [mainSex, setMainSex] = useState<'M' | 'F' | 'P'>('M');
  const [mainMood, setMainMood] = useState<'+' | '-' | '0'>('+');
  const [actionTitle, setActionTitle] = useState<string>('');

  // Story Input
  const [storyText, setStoryText] = useState<string>('');

  // Audio Recording (Narration)
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Discussion Reflection Inputs
  const [consensusNotes, setConsensusNotes] = useState<string>('');
  const [attemptId, setAttemptId] = useState<string>('');

  const timerRef = useRef<any>(null);

  useEffect(() => {
    const loadPPDTPictures = async () => {
      try {
        const items = await questionService.getQuestionsByCategory('PPDT', false);
        setQuestions(items);
        if (items.length > 0) {
          const randomItem = items[Math.floor(Math.random() * items.length)];
          setActiveQuestion(randomItem);
        }
      } catch (err) {
        console.error('Failed to load PPDT picture:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPPDTPictures();
  }, []);

  // Timer Effect
  useEffect(() => {
    if (!hasStarted || isFinished) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          handleAutoPhaseTransition();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [hasStarted, isFinished, phase]);

  const handleAutoPhaseTransition = () => {
    if (phase === 'observation') {
      setPhase('box');
      setSecondsRemaining(60); // 1 minute for character box
    } else if (phase === 'box') {
      setPhase('story');
      setSecondsRemaining(240); // 4 minutes for story
    } else if (phase === 'story') {
      setPhase('narration');
      setSecondsRemaining(60); // 1 minute for narration
    } else if (phase === 'narration') {
      if (isRecording) stopRecording();
      setPhase('discussion');
    }
  };

  const handleStartTest = async () => {
    if (!user || !activeQuestion) return;

    const attempt = await attemptService.createAttempt(
      user.id,
      'PPDT',
      'profile_ppdt_standard',
      1,
      1
    );

    setAttemptId(attempt.id);
    setHasStarted(true);
    setPhase('observation');
    setSecondsRemaining(30);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access was not permitted. You can still practice speaking aloud.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleFinishPPDT = async () => {
    if (!activeQuestion) return;

    const response: TestResponse = {
      questionId: activeQuestion.id,
      responseText: storyText.trim(),
      timeTakenMs: 390000,
      skipped: false,
      notes: consensusNotes,
      characterBox: {
        charactersCount: charCount,
        mainCharacterAge: mainAge,
        mainCharacterSex: mainSex,
        mainCharacterMood: mainMood,
        action: actionTitle,
      },
    };

    if (attemptId) {
      await attemptService.autosaveResponse(attemptId, response);
      await attemptService.completeAttempt(attemptId, 390);
    }

    setIsFinished(true);
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full mb-3" />
        <p>Loading Stage I PPDT material...</p>
      </div>
    );
  }

  // SCREEN 1: Setup
  if (!hasStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              PPDT
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Picture Perception & Description Test</h1>
              <p className="text-xs text-slate-400">Stage I Screening Battery (Day 1 Decision Test)</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <h3 className="font-semibold text-white">SSB Screening Flow:</h3>
            <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-300">
              <li><strong>Observation (30s):</strong> View the hazy picture carefully to identify character numbers, setting, and mood.</li>
              <li><strong>Box Details (1 min):</strong> Fill in character count, age, sex (M/F/P), mood (+/- /0), and action title.</li>
              <li><strong>Story Writing (4 mins):</strong> Write what led to the scene, what is happening, and the final outcome.</li>
              <li><strong>Individual Narration (1 min):</strong> Practice speaking fluently for 1 minute without hesitation or looking at the assessors.</li>
              <li><strong>Group Discussion (GD):</strong> Reflect on how you contribute towards creating a unified group story.</li>
            </ol>
          </div>

          <button
            onClick={handleStartTest}
            className="w-full py-3.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-base flex items-center justify-center space-x-2 shadow-lg transition-transform"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start PPDT Simulation</span>
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 2: Active PPDT Flow
  if (!isFinished) {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    const formattedTimer = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    return (
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
        {/* Phase Header */}
        <div className="flex items-center justify-between bg-slate-800/80 p-4 rounded-xl border border-slate-700">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
              Phase: {phase.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xl font-bold text-white bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
            <Clock className="w-5 h-5 text-purple-400" />
            <span>{formattedTimer}</span>
          </div>
        </div>

        {/* PHASE 1: OBSERVATION */}
        {phase === 'observation' && (
          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-4 flex flex-col items-center justify-center min-h-[400px]">
            <img
              src={activeQuestion?.assetUrl || '/assets/ppdt/ppdt_001.jpeg'}
              alt="PPDT Observation"
              className="max-h-[450px] w-auto object-contain rounded-xl select-none"
            />
            <p className="text-xs text-slate-400 mt-3 animate-pulse">
              Observing scene: Note the number of persons, approximate age, gender, mood, and surrounding environment...
            </p>
          </div>
        )}

        {/* PHASE 2: CHARACTER BOX */}
        {phase === 'box' && (
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-6 space-y-6 shadow-xl">
            <div className="pb-3 border-b border-slate-700">
              <h2 className="text-base font-bold text-white">Fill Candidate Character Box (1 Minute)</h2>
              <p className="text-xs text-slate-400">Record character attributes identified in the picture</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Characters Seen:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={charCount}
                  onChange={(e) => setCharCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Main Character Age:</label>
                <input
                  type="text"
                  value={mainAge}
                  onChange={(e) => setMainAge(e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sex:</label>
                <select
                  value={mainSex}
                  onChange={(e) => setMainSex(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-bold"
                >
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                  <option value="P">Person / Unknown (P)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mood:</label>
                <select
                  value={mainMood}
                  onChange={(e) => setMainMood(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-bold"
                >
                  <option value="+">Positive (+)</option>
                  <option value="0">Neutral (0)</option>
                  <option value="-">Negative (-)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Action / Theme Title:</label>
              <input
                type="text"
                value={actionTitle}
                onChange={(e) => setActionTitle(e.target.value)}
                placeholder="e.g. Organizing an agricultural solar pump awareness camp..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white font-medium"
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => {
                  setPhase('story');
                  setSecondsRemaining(240);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
              >
                Proceed to Story Writing &rarr;
              </button>
            </div>
          </div>
        )}

        {/* PHASE 3: STORY WRITING */}
        {phase === 'story' && (
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div>
                <h2 className="text-base font-bold text-white">Story Writing (4 Minutes)</h2>
                <p className="text-xs text-slate-400">Action: {actionTitle || 'Theme'}</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Words: <strong className="text-purple-400">{storyText.trim().split(/\s+/).filter(Boolean).length}</strong>
              </span>
            </div>

            <textarea
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              placeholder="What led to the scene... What the hero and group are currently doing... How the situation was successfully resolved..."
              rows={12}
              className="w-full bg-slate-900 border border-slate-700 focus:border-purple-400 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-hidden leading-relaxed"
            />

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setPhase('narration');
                  setSecondsRemaining(60);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
              >
                Proceed to Narration Practice &rarr;
              </button>
            </div>
          </div>
        )}

        {/* PHASE 4: NARRATION PRACTICE */}
        {phase === 'narration' && (
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-6 space-y-6 shadow-xl text-center">
            <div className="max-w-md mx-auto space-y-2">
              <Mic className="w-10 h-10 text-purple-400 mx-auto" />
              <h2 className="text-lg font-bold text-white">Individual Narration (1 Minute)</h2>
              <p className="text-xs text-slate-300">
                In actual SSB, you will have 1 minute to narrate your story confidently to the group. Speak fluently, maintain eye contact across all candidates, and do not look at the testing officer.
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Audio Recording</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center space-x-2 animate-pulse"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop Recording</span>
                </button>
              )}
            </div>

            {audioUrl && (
              <div className="pt-2">
                <audio src={audioUrl} controls className="mx-auto" />
              </div>
            )}

            <div className="pt-4 border-t border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setPhase('discussion')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
              >
                Proceed to GD Reflection &rarr;
              </button>
            </div>
          </div>
        )}

        {/* PHASE 5: GROUP DISCUSSION REFLECTION */}
        {phase === 'discussion' && (
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-6 space-y-6 shadow-xl">
            <div className="pb-3 border-b border-slate-700">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Users2 className="w-5 h-5 text-purple-400" />
                <span>Group Discussion & Consensus Reflection</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Evaluate your contribution towards group cohesion and building the common group story
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Self-Review: What points would you put forward to help the group reach consensus?
              </label>
              <textarea
                value={consensusNotes}
                onChange={(e) => setConsensusNotes(e.target.value)}
                placeholder="e.g. Acknowledged chest number 14's point on flood relief, suggested incorporating our vehicle resource to bridge the plan..."
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden"
              />
            </div>

            <button
              onClick={handleFinishPPDT}
              className="w-full py-3.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete PPDT Practice & Save</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // SCREEN 3: Finished Screen
  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-700">
          <Award className="w-8 h-8 text-purple-400" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">PPDT Practice Logged!</h1>
            <p className="text-xs text-slate-400">Candidate screening record saved to your progress history</p>
          </div>
        </div>

        <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-700/60 space-y-2 text-xs">
          <div><strong className="text-slate-300">Theme:</strong> {actionTitle || 'PPDT Story'}</div>
          <div><strong className="text-slate-300">Character Box:</strong> {charCount} person(s), Age: {mainAge}, Sex: {mainSex}, Mood: {mainMood}</div>
          <div className="text-slate-400 mt-2 line-clamp-3 italic">"{storyText}"</div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => {
              setIsFinished(false);
              setHasStarted(false);
              setPhase('observation');
            }}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Practice Another Picture</span>
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
    </div>
  );
};
